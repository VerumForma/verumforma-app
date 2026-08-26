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
          photo: string | null
          instagram: string | null
          facebook: string | null
          x: string | null
          linkedin: string | null
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
          photo?: string | null
          instagram?: string | null
          facebook?: string | null
          x?: string | null
          linkedin?: string | null
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
          photo?: string | null
          instagram?: string | null
          facebook?: string | null
          x?: string | null
          linkedin?: string | null
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
      suppliers: {
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
          photo: string | null
          instagram: string | null
          facebook: string | null
          x: string | null
          linkedin: string | null
          supplies: string[]
          labour_type: string | null
          languages: string[]
          status: 'potencial' | 'ativo' | 'inativo'
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
          photo?: string | null
          instagram?: string | null
          facebook?: string | null
          x?: string | null
          linkedin?: string | null
          supplies?: string[]
          labour_type?: string | null
          languages?: string[]
          status?: 'potencial' | 'ativo' | 'inativo'
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
          photo?: string | null
          instagram?: string | null
          facebook?: string | null
          x?: string | null
          linkedin?: string | null
          supplies?: string[]
          labour_type?: string | null
          languages?: string[]
          status?: 'potencial' | 'ativo' | 'inativo'
          incomplete?: boolean
          notes?: string | null
        }
        Relationships: []
      }
      supplier_contacts: {
        Row: {
          id: string
          supplier_id: string
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
          supplier_id: string
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
      partners: {
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
          photo: string | null
          instagram: string | null
          facebook: string | null
          x: string | null
          linkedin: string | null
          partner_type: string | null
          languages: string[]
          status: 'potencial' | 'ativo' | 'inativo'
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
          photo?: string | null
          instagram?: string | null
          facebook?: string | null
          x?: string | null
          linkedin?: string | null
          partner_type?: string | null
          languages?: string[]
          status?: 'potencial' | 'ativo' | 'inativo'
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
          photo?: string | null
          instagram?: string | null
          facebook?: string | null
          x?: string | null
          linkedin?: string | null
          partner_type?: string | null
          languages?: string[]
          status?: 'potencial' | 'ativo' | 'inativo'
          incomplete?: boolean
          notes?: string | null
        }
        Relationships: []
      }
      partner_contacts: {
        Row: {
          id: string
          partner_id: string
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
          partner_id: string
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
      staff: {
        Row: {
          id: string
          name: string
          photo: string | null
          email: string | null
          phone: string | null
          instagram: string | null
          facebook: string | null
          x: string | null
          linkedin: string | null
          role: string | null
          cargo: string | null
          department: string
          status: 'ativo' | 'inativo' | 'licenca'
          hire_date: string | null
          end_date: string | null
          contract_type: string | null
          driving_licence: string[]
          skills: string[]
          incomplete: boolean
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          photo?: string | null
          email?: string | null
          phone?: string | null
          instagram?: string | null
          facebook?: string | null
          x?: string | null
          linkedin?: string | null
          role?: string | null
          cargo?: string | null
          department?: string
          status?: 'ativo' | 'inativo' | 'licenca'
          hire_date?: string | null
          end_date?: string | null
          contract_type?: string | null
          driving_licence?: string[]
          skills?: string[]
          incomplete?: boolean
        }
        Update: {
          name?: string
          photo?: string | null
          email?: string | null
          phone?: string | null
          instagram?: string | null
          facebook?: string | null
          x?: string | null
          linkedin?: string | null
          role?: string | null
          cargo?: string | null
          department?: string
          status?: 'ativo' | 'inativo' | 'licenca'
          hire_date?: string | null
          end_date?: string | null
          contract_type?: string | null
          driving_licence?: string[]
          skills?: string[]
          incomplete?: boolean
        }
        Relationships: []
      }
      staff_personal: {
        Row: { staff_id: string; birth_date: string | null; nif: string | null; niss: string | null; address: string | null; cc: string | null; street: string | null; door: string | null; postal_code: string | null; city: string | null }
        Insert: { staff_id: string; birth_date?: string | null; nif?: string | null; niss?: string | null; address?: string | null; cc?: string | null; street?: string | null; door?: string | null; postal_code?: string | null; city?: string | null }
        Update: { birth_date?: string | null; nif?: string | null; niss?: string | null; address?: string | null; cc?: string | null; street?: string | null; door?: string | null; postal_code?: string | null; city?: string | null }
        Relationships: []
      }
      staff_finance: {
        Row: { staff_id: string; salary: number | null; currency: string; iban: string | null }
        Insert: { staff_id: string; salary?: number | null; currency?: string; iban?: string | null }
        Update: { salary?: number | null; currency?: string; iban?: string | null }
        Relationships: []
      }
      staff_notes: {
        Row: { id: string; staff_id: string; content: string; created_by: string | null; created_at: string }
        Insert: { id?: string; staff_id: string; content: string }
        Update: { content?: string }
        Relationships: []
      }
      staff_certifications: {
        Row: { id: string; staff_id: string; name: string; issuer: string | null; issue_date: string | null; expiry_date: string | null; number: string | null; created_at: string }
        Insert: { id?: string; staff_id: string; name: string; issuer?: string | null; issue_date?: string | null; expiry_date?: string | null; number?: string | null }
        Update: { name?: string; issuer?: string | null; issue_date?: string | null; expiry_date?: string | null; number?: string | null }
        Relationships: []
      }
      staff_family: {
        Row: { id: string; staff_id: string; relation: 'conjuge' | 'filho' | 'outro'; name: string; birthday: string | null; phone: string | null; is_emergency: boolean; gift_amount: number | null; created_at: string }
        Insert: { id?: string; staff_id: string; relation?: 'conjuge' | 'filho' | 'outro'; name: string; birthday?: string | null; phone?: string | null; is_emergency?: boolean; gift_amount?: number | null }
        Update: { relation?: 'conjuge' | 'filho' | 'outro'; name?: string; birthday?: string | null; phone?: string | null; is_emergency?: boolean; gift_amount?: number | null }
        Relationships: []
      }
      staff_documents: {
        Row: { id: string; staff_id: string; name: string; category: string; file_path: string; created_at: string }
        Insert: { id?: string; staff_id: string; name: string; category?: string; file_path: string }
        Update: { name?: string; category?: string }
        Relationships: []
      }
      materials: {
        Row: { id: string; name: string; category: string | null; unit: string; current_price: number | null; notes: string | null; created_by: string | null; created_at: string }
        Insert: { id?: string; name: string; category?: string | null; unit?: string; current_price?: number | null; notes?: string | null }
        Update: { name?: string; category?: string | null; unit?: string; current_price?: number | null; notes?: string | null }
        Relationships: []
      }
      material_prices: {
        Row: { id: string; material_id: string; supplier_id: string | null; price: number; price_date: string; source: string; created_at: string }
        Insert: { id?: string; material_id: string; supplier_id?: string | null; price: number; price_date?: string; source?: string }
        Update: { price?: number; supplier_id?: string | null; price_date?: string; source?: string }
        Relationships: []
      }
      labour: {
        Row: { id: string; name: string; hourly_cost: number | null; notes: string | null; created_by: string | null; created_at: string }
        Insert: { id?: string; name: string; hourly_cost?: number | null; notes?: string | null }
        Update: { name?: string; hourly_cost?: number | null; notes?: string | null }
        Relationships: []
      }
      labour_prices: {
        Row: { id: string; labour_id: string; hourly_cost: number; price_date: string; source: string; created_at: string }
        Insert: { id?: string; labour_id: string; hourly_cost: number; price_date?: string; source?: string }
        Update: { hourly_cost?: number; price_date?: string; source?: string }
        Relationships: []
      }
      composites: {
        Row: { id: string; name: string; category: string | null; unit: string; waste_pct: number; notes: string | null; created_by: string | null; created_at: string }
        Insert: { id?: string; name: string; category?: string | null; unit?: string; waste_pct?: number; notes?: string | null }
        Update: { name?: string; category?: string | null; unit?: string; waste_pct?: number; notes?: string | null }
        Relationships: []
      }
      composite_items: {
        Row: { id: string; composite_id: string; kind: 'material' | 'labour' | 'composite'; material_id: string | null; labour_id: string | null; composite_ref_id: string | null; quantity: number; unit: string | null; note: string | null; sort: number; created_at: string }
        Insert: { id?: string; composite_id: string; kind: 'material' | 'labour' | 'composite'; material_id?: string | null; labour_id?: string | null; composite_ref_id?: string | null; quantity?: number; unit?: string | null; note?: string | null; sort?: number }
        Update: { kind?: 'material' | 'labour' | 'composite'; quantity?: number; unit?: string | null; note?: string | null; sort?: number; material_id?: string | null; labour_id?: string | null; composite_ref_id?: string | null }
        Relationships: []
      }
      material_units: {
        Row: { id: string; material_id: string; label: string; per_base: number; created_at: string }
        Insert: { id?: string; material_id: string; label: string; per_base?: number }
        Update: { label?: string; per_base?: number }
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
export type Supplier = Database['public']['Tables']['suppliers']['Row']
export type SupplierContact = Database['public']['Tables']['supplier_contacts']['Row']
export type Partner = Database['public']['Tables']['partners']['Row']
export type PartnerContact = Database['public']['Tables']['partner_contacts']['Row']
export type Staff = Database['public']['Tables']['staff']['Row']
export type StaffPersonal = Database['public']['Tables']['staff_personal']['Row']
export type StaffFinance = Database['public']['Tables']['staff_finance']['Row']
export type StaffNotes = Database['public']['Tables']['staff_notes']['Row']
export type StaffCertification = Database['public']['Tables']['staff_certifications']['Row']
export type StaffFamily = Database['public']['Tables']['staff_family']['Row']
export type StaffDocument = Database['public']['Tables']['staff_documents']['Row']
export type Material = Database['public']['Tables']['materials']['Row']
export type MaterialPrice = Database['public']['Tables']['material_prices']['Row']
export type Labour = Database['public']['Tables']['labour']['Row']
export type LabourPrice = Database['public']['Tables']['labour_prices']['Row']
export type Composite = Database['public']['Tables']['composites']['Row']
export type CompositeItem = Database['public']['Tables']['composite_items']['Row']
export type MaterialUnit = Database['public']['Tables']['material_units']['Row']
