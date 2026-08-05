// Supabase schema types. Extend as tables are added (Projects, Clients,
// Budgets, Tasks, ...). Keep in sync with supabase/ migrations.

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          role: 'admin' | 'staff'
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          role?: 'admin' | 'staff'
        }
        Update: {
          email?: string | null
          full_name?: string | null
          role?: 'admin' | 'staff'
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
