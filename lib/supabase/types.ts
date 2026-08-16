// Supabase schema types. Keep in sync with supabase/ migrations.

export type PermissionLevel =
  | 'none' | 'view_assigned' | 'view_all' | 'edit_assigned' | 'edit_all'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          role: string
          entity_type: string | null
          entity_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          role?: string
          entity_type?: string | null
          entity_id?: string | null
        }
        Update: {
          email?: string | null
          full_name?: string | null
          role?: string
          entity_type?: string | null
          entity_id?: string | null
        }
        Relationships: []
      }
      roles: {
        Row: { key: string; label_pt: string; label_en: string; is_system: boolean; sort: number }
        Insert: { key: string; label_pt: string; label_en: string; is_system?: boolean; sort?: number }
        Update: { label_pt?: string; label_en?: string; is_system?: boolean; sort?: number }
        Relationships: []
      }
      modules: {
        Row: { key: string; label_pt: string; sort: number }
        Insert: { key: string; label_pt: string; sort?: number }
        Update: { label_pt?: string; sort?: number }
        Relationships: []
      }
      role_permissions: {
        Row: { role_key: string; module_key: string; level: PermissionLevel }
        Insert: { role_key: string; module_key: string; level?: PermissionLevel }
        Update: { level?: PermissionLevel }
        Relationships: []
      }
      clients: {
        Row: {
          id: string
          kind: 'empresa' | 'individual'
          name: string
          company: string | null
          nif: string | null
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          country: string | null
          website: string | null
          status: 'potencial' | 'ativo' | 'inativo'
          languages: string[]
          incomplete: boolean
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          kind?: 'empresa' | 'individual'
          name: string
          company?: string | null
          nif?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          website?: string | null
          status?: 'potencial' | 'ativo' | 'inativo'
          languages?: string[]
          incomplete?: boolean
          notes?: string | null
        }
        Update: {
          kind?: 'empresa' | 'individual'
          name?: string
          company?: string | null
          nif?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          website?: string | null
          status?: 'potencial' | 'ativo' | 'inativo'
          languages?: string[]
          incomplete?: boolean
          notes?: string | null
        }
        Relationships: []
      }
      client_contacts: {
        Row: {
          id: string
          client_id: string
          name: string
          role: string | null
          email: string | null
          phone: string | null
          is_primary: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          name: string
          role?: string | null
          email?: string | null
          phone?: string | null
          is_primary?: boolean
          notes?: string | null
        }
        Update: {
          name?: string
          role?: string | null
          email?: string | null
          phone?: string | null
          is_primary?: boolean
          notes?: string | null
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
export type Role = Database['public']['Tables']['roles']['Row']
export type RolePermission = Database['public']['Tables']['role_permissions']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type ClientContact = Database['public']['Tables']['client_contacts']['Row']
