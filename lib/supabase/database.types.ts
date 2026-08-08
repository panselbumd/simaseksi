/**
 * Hand-written placeholder types for the tables the app actually queries.
 * Once your Supabase project is linked, replace this file with the
 * generated version:
 *
 *   npx supabase login
 *   npx supabase link --project-ref <your-project-ref>
 *   npm run db:types
 *
 * Until then, these minimal types keep the app type-safe enough to build.
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string; username: string; name: string;
          role: "SYSTEM_ADMIN" | "PANITIA_SELEKSI" | "TIM_UKK" | "PESERTA" | "KPM" | "PEJABAT_BERWENANG" | "AUDITOR";
          unit: string | null; active: boolean; created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string; username: string; name: string; role: Database["public"]["Tables"]["profiles"]["Row"]["role"] };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      bumds: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any> };
      selections: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any> };
      selection_members: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any> };
      selection_stages: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any> };
      candidates: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any> };
      applicants: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any> };
      internal_nominations: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any> };
      documents: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any> };
      assessment_components: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any> };
      assessment_scores: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any> };
      assessments: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any> };
      recommendations: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any> };
      decisions: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any> };
      announcements: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any> };
      audit_logs: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any> };
      regulations: { Row: Record<string, any>; Insert: Record<string, any>; Update: Record<string, any> };
    };
    Views: {
      v_candidate_ranking: {
        Row: { selection_id: string; candidate_id: string; nama: string; final_score: number | null; complete: boolean; ranking: number };
      };
    };
    Functions: {
      get_login_email: { Args: { p_username: string }; Returns: string };
      write_audit_log: { Args: { p_module: string; p_action: string; p_old_value?: string; p_new_value?: string; p_selection?: string }; Returns: undefined };
    };
  };
};
