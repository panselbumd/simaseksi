"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendStageProgressionEmail } from "@/lib/email";
import { REQUIRED_DOCUMENTS } from "./constants";

// Peserta: unggah/perbarui satu jenis dokumen miliknya sendiri, untuk
// applicant record miliknya pada seleksi tersebut. RLS
// (documents_insert_owner, candidate_docs_owner_write) memastikan seorang
// peserta hanya bisa menulis dokumen miliknya sendiri.
export async function uploadDocumentAction(selectionId: string, jenis: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("Pilih berkas terlebih dahulu.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Ukuran berkas maksimal 5MB.");

  const { data: applicant } = await supabase
    .from("applicants").select("id").eq("selection_id", selectionId).eq("user_id", user.id).single();
  if (!applicant) throw new Error("Anda belum terdaftar sebagai peserta pada seleksi ini.");

  const path = `${user.id}/${applicant.id}-${jenis.replace(/\s+/g, "_")}-${Date.now()}-${file.name}`;
  const { error: uploadErr } = await supabase.storage.from("candidate-documents").upload(path, file, { upsert: false });
  if (uploadErr) throw uploadErr;

  const { data: existing } = await supabase
    .from("documents").select("id")
    .eq("owner_type", "APPLICANT").eq("owner_id", applicant.id).eq("selection_id", selectionId).eq("jenis", jenis)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("documents")
      .update({ storage_path: path, status: "UPLOADED", tanggal: new Date().toISOString().slice(0, 10), verifier: null, catatan: null })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("documents").insert({
      owner_type: "APPLICANT", owner_id: applicant.id, selection_id: selectionId,
      jenis, status: "UPLOADED", storage_path: path, tanggal: new Date().toISOString().slice(0, 10),
    });
    if (error) throw error;
  }

  revalidatePath("/documents");
}

// Panitia: verifikasi satu dokumen (VALID / INVALID / REVISION_REQUIRED / APPROVED).
export async function verifyDocumentAction(documentId: string, status: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const catatan = String(formData.get("catatan") || "").trim();

  const { data: doc } = await supabase.from("documents").select("owner_id, selection_id").eq("id", documentId).single();

  const { error } = await supabase.from("documents")
    .update({ status, verifier: user.id, catatan: catatan || null, tanggal: new Date().toISOString().slice(0, 10) })
    .eq("id", documentId);
  if (error) throw error; // RLS documents_verify_panitia blocks non-Panitia here

  await supabase.rpc("write_audit_log", {
    p_module: "Document", p_action: `VERIFY_DOCUMENT_${status}`, p_old_value: "-", p_new_value: status, p_selection: "",
  });

  // Peserta lolos tahap Verifikasi Dokumen begitu SEMUA dokumen wajibnya
  // berstatus APPROVED — kirim notifikasi email sekali saat kondisi ini
  // baru saja terpenuhi. (Ini satu-satunya titik "lolos tahapan" yang
  // sudah ada implementasinya di codebase; tahap UKK/Wawancara/Keputusan
  // belum punya aksi "tandai lolos" eksplisit — lihat catatan di
  // lib/email.ts / dokumentasi go-live untuk pola yang sama.)
  if (status === "APPROVED" && doc) {
    const { data: allDocs } = await supabase
      .from("documents").select("jenis, status")
      .eq("owner_type", "APPLICANT").eq("owner_id", doc.owner_id).eq("selection_id", doc.selection_id);
    const approvedJenis = new Set((allDocs ?? []).filter((d) => d.status === "APPROVED").map((d) => d.jenis));
    const allRequiredApproved = REQUIRED_DOCUMENTS.every((j) => approvedJenis.has(j));

    if (allRequiredApproved) {
      const { data: applicant } = await supabase
        .from("applicants").select("nama, email, selections(nama)")
        .eq("id", doc.owner_id).single();
      if (applicant) {
        await sendStageProgressionEmail({
          to: applicant.email,
          nama: applicant.nama,
          selectionNama: (applicant as any).selections?.nama ?? "",
          stage: "VERIFICATION_PASSED",
        });
      }
    }
  }

  revalidatePath("/documents");
}

export async function getSignedDocumentUrl(path: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("candidate-documents").createSignedUrl(path, 60 * 5);
  if (error) throw error;
  return data.signedUrl;
}
