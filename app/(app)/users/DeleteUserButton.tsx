"use client";

import { deleteUserAction } from "./actions";

export default function DeleteUserButton({ userId, username }: { userId: string; username: string }) {
  return (
    <form
      action={() => {
        if (window.confirm(`Hapus permanen akun "${username}"? Tindakan ini tidak dapat dibatalkan. Untuk akun yang datanya sudah dipakai (mis. pernah menilai UKK), gunakan "Nonaktifkan" saja.`)) {
          deleteUserAction(userId);
        }
      }}
    >
      <button type="submit" className="text-xs text-red-600 underline">Hapus</button>
    </form>
  );
}
