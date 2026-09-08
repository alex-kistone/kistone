export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_qual_fields: {
        Row: {
          created_at: string
          description: string | null
          icon: string
          id: string
          is_default: boolean
          key: string
          label: string
          sort_order: number
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_default?: boolean
          key: string
          label: string
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_default?: boolean
          key?: string
          label?: string
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_articles: {
        Row: {
          author_id: string
          category: string
          content: string
          created_at: string
          excerpt: string
          id: string
          image_url: string | null
          published: boolean
          read_time: string
          slug: string
          tenant_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          category?: string
          content?: string
          created_at?: string
          excerpt?: string
          id?: string
          image_url?: string | null
          published?: boolean
          read_time?: string
          slug: string
          tenant_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          category?: string
          content?: string
          created_at?: string
          excerpt?: string
          id?: string
          image_url?: string | null
          published?: boolean
          read_time?: string
          slug?: string
          tenant_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_articles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      client_needs: {
        Row: {
          budget_tjm_max: number | null
          budget_tjm_min: number | null
          company_name: string
          contact_email: string
          contact_name: string
          created_at: string
          description: string | null
          id: string
          job_title: string
          mission_location: string
          persona: string
          profile_types: string[]
          remote_policy: string
          sectors: string[]
          status: string
          tenant_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_tjm_max?: number | null
          budget_tjm_min?: number | null
          company_name: string
          contact_email: string
          contact_name: string
          created_at?: string
          description?: string | null
          id?: string
          job_title: string
          mission_location: string
          persona?: string
          profile_types?: string[]
          remote_policy?: string
          sectors?: string[]
          status?: string
          tenant_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_tjm_max?: number | null
          budget_tjm_min?: number | null
          company_name?: string
          contact_email?: string
          contact_name?: string
          created_at?: string
          description?: string | null
          id?: string
          job_title?: string
          mission_location?: string
          persona?: string
          profile_types?: string[]
          remote_policy?: string
          sectors?: string[]
          status?: string
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_needs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      client_profiles: {
        Row: {
          cities: string[]
          company_address: string | null
          company_name: string
          created_at: string
          email: string
          first_name: string
          id: string
          job_title: string
          last_name: string
          legal_form: string | null
          phone: string | null
          representative_name: string | null
          representative_title: string | null
          siren: string | null
          tenant_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cities?: string[]
          company_address?: string | null
          company_name?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          job_title?: string
          last_name?: string
          legal_form?: string | null
          phone?: string | null
          representative_name?: string | null
          representative_title?: string | null
          siren?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cities?: string[]
          company_address?: string | null
          company_name?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          job_title?: string
          last_name?: string
          legal_form?: string | null
          phone?: string | null
          representative_name?: string | null
          representative_title?: string | null
          siren?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      jarvi_field_mappings: {
        Row: {
          direction: string
          id: string
          jarvi_field_id: string | null
          jarvi_field_kind: string | null
          jarvi_field_name: string | null
          platform_field: string
          platform_type: string
          updated_at: string
        }
        Insert: {
          direction?: string
          id?: string
          jarvi_field_id?: string | null
          jarvi_field_kind?: string | null
          jarvi_field_name?: string | null
          platform_field: string
          platform_type?: string
          updated_at?: string
        }
        Update: {
          direction?: string
          id?: string
          jarvi_field_id?: string | null
          jarvi_field_kind?: string | null
          jarvi_field_name?: string | null
          platform_field?: string
          platform_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      jarvi_value_mappings: {
        Row: {
          id: string
          jarvi_value_id: string
          jarvi_value_name: string | null
          platform_field: string
          platform_value: string
          updated_at: string
        }
        Insert: {
          id?: string
          jarvi_value_id: string
          jarvi_value_name?: string | null
          platform_field: string
          platform_value: string
          updated_at?: string
        }
        Update: {
          id?: string
          jarvi_value_id?: string
          jarvi_value_name?: string | null
          platform_field?: string
          platform_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read: boolean
          receiver_id: string
          sender_id: string
          tenant_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id: string
          sender_id: string
          tenant_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_extensions: {
        Row: {
          created_at: string
          created_by: string
          id: string
          mission_id: string
          new_client_tjm: number | null
          new_duration_text: string | null
          new_end_date: string | null
          new_recruiter_tjm: number | null
          previous_client_tjm: number | null
          previous_duration_text: string | null
          previous_end_date: string | null
          previous_recruiter_tjm: number | null
          reason: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          mission_id: string
          new_client_tjm?: number | null
          new_duration_text?: string | null
          new_end_date?: string | null
          new_recruiter_tjm?: number | null
          previous_client_tjm?: number | null
          previous_duration_text?: string | null
          previous_end_date?: string | null
          previous_recruiter_tjm?: number | null
          reason?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          mission_id?: string
          new_client_tjm?: number | null
          new_duration_text?: string | null
          new_end_date?: string | null
          new_recruiter_tjm?: number | null
          previous_client_tjm?: number | null
          previous_duration_text?: string | null
          previous_end_date?: string | null
          previous_recruiter_tjm?: number | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mission_extensions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "client_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_extensions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "freelance_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_extensions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          client_tjm: number
          company_name: string
          created_at: string
          created_by: string
          duration_text: string | null
          end_date: string | null
          id: string
          location: string
          need_id: string
          recruiter_profile_id: string
          recruiter_tjm: number
          start_date: string
          status: string
          suggestion_id: string
          tenant_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          client_tjm?: number
          company_name: string
          created_at?: string
          created_by: string
          duration_text?: string | null
          end_date?: string | null
          id?: string
          location?: string
          need_id: string
          recruiter_profile_id: string
          recruiter_tjm?: number
          start_date: string
          status?: string
          suggestion_id: string
          tenant_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          client_tjm?: number
          company_name?: string
          created_at?: string
          created_by?: string
          duration_text?: string | null
          end_date?: string | null
          id?: string
          location?: string
          need_id?: string
          recruiter_profile_id?: string
          recruiter_tjm?: number
          start_date?: string
          status?: string
          suggestion_id?: string
          tenant_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "missions_need_id_fkey"
            columns: ["need_id"]
            isOneToOne: false
            referencedRelation: "client_needs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_need_id_fkey"
            columns: ["need_id"]
            isOneToOne: false
            referencedRelation: "client_needs_open"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_recruiter_profile_id_fkey"
            columns: ["recruiter_profile_id"]
            isOneToOne: false
            referencedRelation: "recruiter_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: true
            referencedRelation: "profile_suggestions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      need_applications: {
        Row: {
          created_at: string
          id: string
          motivation: string | null
          need_id: string
          recruiter_profile_id: string
          status: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          motivation?: string | null
          need_id: string
          recruiter_profile_id: string
          status?: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          motivation?: string | null
          need_id?: string
          recruiter_profile_id?: string
          status?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "need_applications_need_id_fkey"
            columns: ["need_id"]
            isOneToOne: false
            referencedRelation: "client_needs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "need_applications_need_id_fkey"
            columns: ["need_id"]
            isOneToOne: false
            referencedRelation: "client_needs_open"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "need_applications_recruiter_profile_id_fkey"
            columns: ["recruiter_profile_id"]
            isOneToOne: false
            referencedRelation: "recruiter_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "need_applications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_platform_fields: {
        Row: {
          created_at: string
          id: string
          label: string
          slug: string
          source_jarvi_field_id: string | null
          source_jarvi_field_name: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          slug: string
          source_jarvi_field_id?: string | null
          source_jarvi_field_name?: string | null
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          slug?: string
          source_jarvi_field_id?: string | null
          source_jarvi_field_name?: string | null
          type?: string
        }
        Relationships: []
      }
      persona_jarvi_mapping: {
        Row: {
          client_title: string | null
          color: string | null
          description: string | null
          freelance_title: string | null
          is_active: boolean
          jarvi_field_uuid: string | null
          jarvi_project_id: string | null
          label: string | null
          persona: string
          short_label: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          client_title?: string | null
          color?: string | null
          description?: string | null
          freelance_title?: string | null
          is_active?: boolean
          jarvi_field_uuid?: string | null
          jarvi_project_id?: string | null
          label?: string | null
          persona: string
          short_label?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          client_title?: string | null
          color?: string | null
          description?: string | null
          freelance_title?: string | null
          is_active?: boolean
          jarvi_field_uuid?: string | null
          jarvi_project_id?: string | null
          label?: string | null
          persona?: string
          short_label?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profile_suggestions: {
        Row: {
          anonymous_label: string
          created_at: string
          id: string
          match_reasons: string[]
          match_score: number
          need_id: string
          pipeline_status: string
          recruiter_first_name: string | null
          recruiter_profile_id: string
          status_updated_at: string | null
          super_tam: boolean | null
          tenant_id: string | null
        }
        Insert: {
          anonymous_label: string
          created_at?: string
          id?: string
          match_reasons?: string[]
          match_score?: number
          need_id: string
          pipeline_status?: string
          recruiter_first_name?: string | null
          recruiter_profile_id: string
          status_updated_at?: string | null
          super_tam?: boolean | null
          tenant_id?: string | null
        }
        Update: {
          anonymous_label?: string
          created_at?: string
          id?: string
          match_reasons?: string[]
          match_score?: number
          need_id?: string
          pipeline_status?: string
          recruiter_first_name?: string | null
          recruiter_profile_id?: string
          status_updated_at?: string | null
          super_tam?: boolean | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_suggestions_need_id_fkey"
            columns: ["need_id"]
            isOneToOne: false
            referencedRelation: "client_needs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_suggestions_need_id_fkey"
            columns: ["need_id"]
            isOneToOne: false
            referencedRelation: "client_needs_open"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_suggestions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      recruiter_profiles: {
        Row: {
          admin_comments: string | null
          admin_rating: number | null
          availability_date: string | null
          available: boolean | null
          clients: string[] | null
          company_address: string | null
          company_name: string | null
          created_at: string
          email: string
          english_level: string | null
          finance_specialties: string[]
          first_name: string
          has_linkedin_license: boolean | null
          hr_specialties: string[]
          id: string
          insurance_document_url: string | null
          intro_text: string | null
          job_title: string | null
          languages: Json | null
          last_name: string
          legal_form: string | null
          linkedin_url: string | null
          missions: Json | null
          mobility: string[] | null
          model: string | null
          persona: string
          phone: string | null
          photo_url: string | null
          remote_preference: string | null
          rib_document_url: string | null
          sectors: string[] | null
          siren: string | null
          skills: string[] | null
          super_tam: boolean | null
          tech_specialties: string[] | null
          tenant_id: string | null
          tjm: number | null
          tools: string[]
          tva_number: string | null
          urssaf_document_url: string | null
          user_id: string | null
          work_time: string | null
        }
        Insert: {
          admin_comments?: string | null
          admin_rating?: number | null
          availability_date?: string | null
          available?: boolean | null
          clients?: string[] | null
          company_address?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          english_level?: string | null
          finance_specialties?: string[]
          first_name: string
          has_linkedin_license?: boolean | null
          hr_specialties?: string[]
          id?: string
          insurance_document_url?: string | null
          intro_text?: string | null
          job_title?: string | null
          languages?: Json | null
          last_name: string
          legal_form?: string | null
          linkedin_url?: string | null
          missions?: Json | null
          mobility?: string[] | null
          model?: string | null
          persona?: string
          phone?: string | null
          photo_url?: string | null
          remote_preference?: string | null
          rib_document_url?: string | null
          sectors?: string[] | null
          siren?: string | null
          skills?: string[] | null
          super_tam?: boolean | null
          tech_specialties?: string[] | null
          tenant_id?: string | null
          tjm?: number | null
          tools?: string[]
          tva_number?: string | null
          urssaf_document_url?: string | null
          user_id?: string | null
          work_time?: string | null
        }
        Update: {
          admin_comments?: string | null
          admin_rating?: number | null
          availability_date?: string | null
          available?: boolean | null
          clients?: string[] | null
          company_address?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          english_level?: string | null
          finance_specialties?: string[]
          first_name?: string
          has_linkedin_license?: boolean | null
          hr_specialties?: string[]
          id?: string
          insurance_document_url?: string | null
          intro_text?: string | null
          job_title?: string | null
          languages?: Json | null
          last_name?: string
          legal_form?: string | null
          linkedin_url?: string | null
          missions?: Json | null
          mobility?: string[] | null
          model?: string | null
          persona?: string
          phone?: string | null
          photo_url?: string | null
          remote_preference?: string | null
          rib_document_url?: string | null
          sectors?: string[] | null
          siren?: string | null
          skills?: string[] | null
          super_tam?: boolean | null
          tech_specialties?: string[] | null
          tenant_id?: string | null
          tjm?: number | null
          tools?: string[]
          tva_number?: string | null
          urssaf_document_url?: string | null
          user_id?: string | null
          work_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recruiter_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      specialties: {
        Row: {
          created_at: string
          id: string
          jarvi_value_id: string | null
          label: string
          persona: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          jarvi_value_id?: string | null
          label: string
          persona: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          jarvi_value_id?: string | null
          label?: string
          persona?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      studio_requests: {
        Row: {
          created_at: string
          description: string
          email: string
          existing_project: string | null
          first_name: string
          id: string
          last_name: string
          phone: string | null
          project_type: string | null
          status: string
          theme: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          email: string
          existing_project?: string | null
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          project_type?: string | null
          status?: string
          theme?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          email?: string
          existing_project?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          project_type?: string | null
          status?: string
          theme?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          thread_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          thread_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "support_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      support_threads: {
        Row: {
          created_at: string
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tenant_billing: {
        Row: {
          created_at: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_billing_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_settings: {
        Row: {
          accent_color: string | null
          created_at: string
          custom_domain: string | null
          id: string
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          created_at?: string
          custom_domain?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          created_at?: string
          custom_domain?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          subscription_status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          subscription_status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          subscription_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      timesheet_days: {
        Row: {
          created_at: string
          day_date: string
          id: string
          tenant_id: string | null
          timesheet_id: string
          value: number
        }
        Insert: {
          created_at?: string
          day_date: string
          id?: string
          tenant_id?: string | null
          timesheet_id: string
          value?: number
        }
        Update: {
          created_at?: string
          day_date?: string
          id?: string
          tenant_id?: string | null
          timesheet_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "timesheet_days_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheet_days_timesheet_id_fkey"
            columns: ["timesheet_id"]
            isOneToOne: false
            referencedRelation: "timesheets"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheets: {
        Row: {
          admin_invoiced_at: string | null
          client_comment: string | null
          client_reviewed_at: string | null
          client_reviewed_by: string | null
          created_at: string
          freelancer_comment: string | null
          id: string
          mission_id: string | null
          month: number
          need_id: string
          recruiter_profile_id: string
          recruitments_count: number
          rejection_reason: string | null
          status: string
          submitted_at: string | null
          suggestion_id: string
          tenant_id: string | null
          total_days: number
          updated_at: string
          year: number
        }
        Insert: {
          admin_invoiced_at?: string | null
          client_comment?: string | null
          client_reviewed_at?: string | null
          client_reviewed_by?: string | null
          created_at?: string
          freelancer_comment?: string | null
          id?: string
          mission_id?: string | null
          month: number
          need_id: string
          recruiter_profile_id: string
          recruitments_count?: number
          rejection_reason?: string | null
          status?: string
          submitted_at?: string | null
          suggestion_id: string
          tenant_id?: string | null
          total_days?: number
          updated_at?: string
          year: number
        }
        Update: {
          admin_invoiced_at?: string | null
          client_comment?: string | null
          client_reviewed_at?: string | null
          client_reviewed_by?: string | null
          created_at?: string
          freelancer_comment?: string | null
          id?: string
          mission_id?: string | null
          month?: number
          need_id?: string
          recruiter_profile_id?: string
          recruitments_count?: number
          rejection_reason?: string | null
          status?: string
          submitted_at?: string | null
          suggestion_id?: string
          tenant_id?: string | null
          total_days?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "timesheets_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "client_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "freelance_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_need_id_fkey"
            columns: ["need_id"]
            isOneToOne: false
            referencedRelation: "client_needs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_need_id_fkey"
            columns: ["need_id"]
            isOneToOne: false
            referencedRelation: "client_needs_open"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_recruiter_profile_id_fkey"
            columns: ["recruiter_profile_id"]
            isOneToOne: false
            referencedRelation: "recruiter_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "profile_suggestions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      client_missions: {
        Row: {
          client_tjm: number | null
          company_name: string | null
          created_at: string | null
          duration_text: string | null
          end_date: string | null
          id: string | null
          location: string | null
          need_id: string | null
          recruiter_profile_id: string | null
          start_date: string | null
          status: string | null
          suggestion_id: string | null
          tenant_id: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          client_tjm?: number | null
          company_name?: string | null
          created_at?: string | null
          duration_text?: string | null
          end_date?: string | null
          id?: string | null
          location?: string | null
          need_id?: string | null
          recruiter_profile_id?: string | null
          start_date?: string | null
          status?: string | null
          suggestion_id?: string | null
          tenant_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          client_tjm?: number | null
          company_name?: string | null
          created_at?: string | null
          duration_text?: string | null
          end_date?: string | null
          id?: string | null
          location?: string | null
          need_id?: string | null
          recruiter_profile_id?: string | null
          start_date?: string | null
          status?: string | null
          suggestion_id?: string | null
          tenant_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "missions_need_id_fkey"
            columns: ["need_id"]
            isOneToOne: false
            referencedRelation: "client_needs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_need_id_fkey"
            columns: ["need_id"]
            isOneToOne: false
            referencedRelation: "client_needs_open"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_recruiter_profile_id_fkey"
            columns: ["recruiter_profile_id"]
            isOneToOne: false
            referencedRelation: "recruiter_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: true
            referencedRelation: "profile_suggestions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      client_needs_open: {
        Row: {
          budget_tjm_max: number | null
          budget_tjm_min: number | null
          created_at: string | null
          description: string | null
          id: string | null
          job_title: string | null
          mission_location: string | null
          profile_types: string[] | null
          remote_policy: string | null
        }
        Insert: {
          budget_tjm_max?: number | null
          budget_tjm_min?: number | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          job_title?: string | null
          mission_location?: string | null
          profile_types?: string[] | null
          remote_policy?: string | null
        }
        Update: {
          budget_tjm_max?: number | null
          budget_tjm_min?: number | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          job_title?: string | null
          mission_location?: string | null
          profile_types?: string[] | null
          remote_policy?: string | null
        }
        Relationships: []
      }
      freelance_missions: {
        Row: {
          company_name: string | null
          created_at: string | null
          duration_text: string | null
          end_date: string | null
          id: string | null
          location: string | null
          need_id: string | null
          recruiter_profile_id: string | null
          recruiter_tjm: number | null
          start_date: string | null
          status: string | null
          suggestion_id: string | null
          tenant_id: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          duration_text?: string | null
          end_date?: string | null
          id?: string | null
          location?: string | null
          need_id?: string | null
          recruiter_profile_id?: string | null
          recruiter_tjm?: number | null
          start_date?: string | null
          status?: string | null
          suggestion_id?: string | null
          tenant_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          duration_text?: string | null
          end_date?: string | null
          id?: string | null
          location?: string | null
          need_id?: string | null
          recruiter_profile_id?: string | null
          recruiter_tjm?: number | null
          start_date?: string | null
          status?: string | null
          suggestion_id?: string | null
          tenant_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "missions_need_id_fkey"
            columns: ["need_id"]
            isOneToOne: false
            referencedRelation: "client_needs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_need_id_fkey"
            columns: ["need_id"]
            isOneToOne: false
            referencedRelation: "client_needs_open"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_recruiter_profile_id_fkey"
            columns: ["recruiter_profile_id"]
            isOneToOne: false
            referencedRelation: "recruiter_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: true
            referencedRelation: "profile_suggestions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      current_tenant_id: { Args: never; Returns: string }
      delete_own_account: { Args: never; Returns: undefined }
      get_admin_user_id: { Args: never; Returns: string }
      get_user_tenant_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_tenant_role: {
        Args: {
          _role: Database["public"]["Enums"]["tenant_role"]
          _tenant_id: string
          _user_id: string
        }
        Returns: boolean
      }
      is_tenant_member: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      metier_usage_count: {
        Args: { _slug: string }
        Returns: {
          need_count: number
          recruiter_count: number
          specialty_count: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user" | "client"
      tenant_role: "owner" | "admin" | "member"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "client"],
      tenant_role: ["owner", "admin", "member"],
    },
  },
} as const
