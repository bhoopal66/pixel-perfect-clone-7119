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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          agent_code: string
          created_at: string
          created_by: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean
          telephone: string
          updated_at: string
        }
        Insert: {
          agent_code: string
          created_at?: string
          created_by?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean
          telephone: string
          updated_at?: string
        }
        Update: {
          agent_code?: string
          created_at?: string
          created_by?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          telephone?: string
          updated_at?: string
        }
        Relationships: []
      }
      applicant_businesses: {
        Row: {
          business_activity: string
          case_id: string
          company_legal_name: string
          created_at: string
          ejari_available: boolean | null
          emirate: string
          id: string
          legal_structure: string
          license_issuing_authority: string
          office_address: string
          tl_expiry_date: string
          trade_license_no: string
          updated_at: string
          year_of_establishment: number | null
        }
        Insert: {
          business_activity: string
          case_id: string
          company_legal_name: string
          created_at?: string
          ejari_available?: boolean | null
          emirate: string
          id?: string
          legal_structure: string
          license_issuing_authority: string
          office_address: string
          tl_expiry_date: string
          trade_license_no: string
          updated_at?: string
          year_of_establishment?: number | null
        }
        Update: {
          business_activity?: string
          case_id?: string
          company_legal_name?: string
          created_at?: string
          ejari_available?: boolean | null
          emirate?: string
          id?: string
          legal_structure?: string
          license_issuing_authority?: string
          office_address?: string
          tl_expiry_date?: string
          trade_license_no?: string
          updated_at?: string
          year_of_establishment?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "applicant_businesses_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: true
            referencedRelation: "onboarding_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      business_owners: {
        Row: {
          case_id: string
          created_at: string
          display_order: number | null
          email: string
          emirates_id: string
          id: string
          mobile: string
          nationality: string
          owner_name: string
          passport_number: string
          resident_status: string
          shareholding_percent: number
          updated_at: string
        }
        Insert: {
          case_id: string
          created_at?: string
          display_order?: number | null
          email: string
          emirates_id: string
          id?: string
          mobile: string
          nationality: string
          owner_name: string
          passport_number: string
          resident_status: string
          shareholding_percent: number
          updated_at?: string
        }
        Update: {
          case_id?: string
          created_at?: string
          display_order?: number | null
          email?: string
          emirates_id?: string
          id?: string
          mobile?: string
          nationality?: string
          owner_name?: string
          passport_number?: string
          resident_status?: string
          shareholding_percent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_owners_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "onboarding_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_lender_applications: {
        Row: {
          approved_amount: number | null
          assigned_ro_email: string | null
          assigned_ro_name: string | null
          assigned_ro_phone: string | null
          case_id: string
          created_at: string
          days_in_stage: number | null
          decision: string | null
          decision_date: string | null
          id: string
          interest_rate: number | null
          internal_remarks: string | null
          lender_id: string
          lender_remarks: string | null
          lender_stage: Database["public"]["Enums"]["process_stage"] | null
          lender_status: string | null
          rag_status: Database["public"]["Enums"]["rag_status"] | null
          requested_amount: number | null
          stage_entered_at: string | null
          submission_date: string | null
          tenure_months: number | null
          updated_at: string
        }
        Insert: {
          approved_amount?: number | null
          assigned_ro_email?: string | null
          assigned_ro_name?: string | null
          assigned_ro_phone?: string | null
          case_id: string
          created_at?: string
          days_in_stage?: number | null
          decision?: string | null
          decision_date?: string | null
          id?: string
          interest_rate?: number | null
          internal_remarks?: string | null
          lender_id: string
          lender_remarks?: string | null
          lender_stage?: Database["public"]["Enums"]["process_stage"] | null
          lender_status?: string | null
          rag_status?: Database["public"]["Enums"]["rag_status"] | null
          requested_amount?: number | null
          stage_entered_at?: string | null
          submission_date?: string | null
          tenure_months?: number | null
          updated_at?: string
        }
        Update: {
          approved_amount?: number | null
          assigned_ro_email?: string | null
          assigned_ro_name?: string | null
          assigned_ro_phone?: string | null
          case_id?: string
          created_at?: string
          days_in_stage?: number | null
          decision?: string | null
          decision_date?: string | null
          id?: string
          interest_rate?: number | null
          internal_remarks?: string | null
          lender_id?: string
          lender_remarks?: string | null
          lender_stage?: Database["public"]["Enums"]["process_stage"] | null
          lender_status?: string | null
          rag_status?: Database["public"]["Enums"]["rag_status"] | null
          requested_amount?: number | null
          stage_entered_at?: string | null
          submission_date?: string | null
          tenure_months?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_lender_applications_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "onboarding_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          abcd_fee_amount: number
          adjusted_turnover: number
          agent_reference: string
          bank_name: string
          case_number: string | null
          cash_adjustment: number
          client_name: string
          created_at: string
          declared_turnover: number
          eligibility_method: string
          eligibility_status: string
          eligible_loan_amount: number
          eligible_multiplier: number
          id: string
          interest_rate: number
          monthly_emi: number
          pos_annual_turnover: number
          pos_cap_rate: number
          pos_eligible_turnover: number
          pos_monthly_turnover: number
          product_type: string
          sister_concern_adjustment: number
          statement_pdf_url: string | null
          statement_period_from: string | null
          statement_period_to: string | null
          status: string
          tenure_months: number
          total_interest: number
          total_payable: number
          turnover_basis: number
          updated_at: string
          user_id: string | null
          variance_bucket: string
          variance_percent: number
          vat_turnover: number
        }
        Insert: {
          abcd_fee_amount?: number
          adjusted_turnover?: number
          agent_reference?: string
          bank_name: string
          case_number?: string | null
          cash_adjustment?: number
          client_name: string
          created_at?: string
          declared_turnover?: number
          eligibility_method?: string
          eligibility_status?: string
          eligible_loan_amount?: number
          eligible_multiplier?: number
          id?: string
          interest_rate?: number
          monthly_emi?: number
          pos_annual_turnover?: number
          pos_cap_rate?: number
          pos_eligible_turnover?: number
          pos_monthly_turnover?: number
          product_type?: string
          sister_concern_adjustment?: number
          statement_pdf_url?: string | null
          statement_period_from?: string | null
          statement_period_to?: string | null
          status?: string
          tenure_months?: number
          total_interest?: number
          total_payable?: number
          turnover_basis?: number
          updated_at?: string
          user_id?: string | null
          variance_bucket?: string
          variance_percent?: number
          vat_turnover?: number
        }
        Update: {
          abcd_fee_amount?: number
          adjusted_turnover?: number
          agent_reference?: string
          bank_name?: string
          case_number?: string | null
          cash_adjustment?: number
          client_name?: string
          created_at?: string
          declared_turnover?: number
          eligibility_method?: string
          eligibility_status?: string
          eligible_loan_amount?: number
          eligible_multiplier?: number
          id?: string
          interest_rate?: number
          monthly_emi?: number
          pos_annual_turnover?: number
          pos_cap_rate?: number
          pos_eligible_turnover?: number
          pos_monthly_turnover?: number
          product_type?: string
          sister_concern_adjustment?: number
          statement_pdf_url?: string | null
          statement_period_from?: string | null
          statement_period_to?: string | null
          status?: string
          tenure_months?: number
          total_interest?: number
          total_payable?: number
          turnover_basis?: number
          updated_at?: string
          user_id?: string | null
          variance_bucket?: string
          variance_percent?: number
          vat_turnover?: number
        }
        Relationships: []
      }
      financial_inputs: {
        Row: {
          adjusted_turnover: number | null
          annual_vat_turnover: number | null
          case_id: string
          cash_adjustment: number | null
          cash_intensive: boolean | null
          created_at: string
          declared_turnover: number
          existing_bank_accounts: string[] | null
          id: string
          monthly_avg_turnover: number
          pos_annual_turnover: number | null
          pos_machine: boolean | null
          pos_monthly_turnover: number | null
          primary_operating_bank: string
          sister_concern_adjustment: number | null
          sister_concern_exists: boolean | null
          updated_at: string
          vat_registered: boolean | null
        }
        Insert: {
          adjusted_turnover?: number | null
          annual_vat_turnover?: number | null
          case_id: string
          cash_adjustment?: number | null
          cash_intensive?: boolean | null
          created_at?: string
          declared_turnover?: number
          existing_bank_accounts?: string[] | null
          id?: string
          monthly_avg_turnover?: number
          pos_annual_turnover?: number | null
          pos_machine?: boolean | null
          pos_monthly_turnover?: number | null
          primary_operating_bank: string
          sister_concern_adjustment?: number | null
          sister_concern_exists?: boolean | null
          updated_at?: string
          vat_registered?: boolean | null
        }
        Update: {
          adjusted_turnover?: number | null
          annual_vat_turnover?: number | null
          case_id?: string
          cash_adjustment?: number | null
          cash_intensive?: boolean | null
          created_at?: string
          declared_turnover?: number
          existing_bank_accounts?: string[] | null
          id?: string
          monthly_avg_turnover?: number
          pos_annual_turnover?: number | null
          pos_machine?: boolean | null
          pos_monthly_turnover?: number | null
          primary_operating_bank?: string
          sister_concern_adjustment?: number | null
          sister_concern_exists?: boolean | null
          updated_at?: string
          vat_registered?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_inputs_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: true
            referencedRelation: "onboarding_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_cases: {
        Row: {
          abcd_fee_amount: number
          abcd_fee_rate: number
          adjusted_turnover: number
          agent_reference: string
          analyst_name: string
          applicant_email: string
          applicant_name: string
          applicant_phone: string
          approved_at: string | null
          case_number: string
          company_name: string
          created_at: string
          disbursed_at: string | null
          documents: Json
          eligible_loan_amount: number
          eligible_multiplier: number
          emi: number
          id: string
          interest_rate: number
          lender: string
          loan_amount: number
          monthly_salary: number
          notes: string | null
          pos_annual_turnover: number
          pos_cap_adjusted: number
          pos_cap_vat: number
          pos_eligible_turnover: number
          pos_monthly_turnover: number
          processing_fee: number
          product_type: string
          purpose: string | null
          status: string
          submitted_at: string | null
          tenure: number
          total_interest: number
          total_payable: number
          total_with_abcd: number
          turnover_basis: number
          updated_at: string
          user_id: string | null
          variance_percent: number
          vat_turnover: number
        }
        Insert: {
          abcd_fee_amount?: number
          abcd_fee_rate?: number
          adjusted_turnover?: number
          agent_reference: string
          analyst_name: string
          applicant_email: string
          applicant_name: string
          applicant_phone: string
          approved_at?: string | null
          case_number: string
          company_name: string
          created_at?: string
          disbursed_at?: string | null
          documents?: Json
          eligible_loan_amount?: number
          eligible_multiplier?: number
          emi?: number
          id?: string
          interest_rate?: number
          lender: string
          loan_amount?: number
          monthly_salary?: number
          notes?: string | null
          pos_annual_turnover?: number
          pos_cap_adjusted?: number
          pos_cap_vat?: number
          pos_eligible_turnover?: number
          pos_monthly_turnover?: number
          processing_fee?: number
          product_type?: string
          purpose?: string | null
          status?: string
          submitted_at?: string | null
          tenure?: number
          total_interest?: number
          total_payable?: number
          total_with_abcd?: number
          turnover_basis?: number
          updated_at?: string
          user_id?: string | null
          variance_percent?: number
          vat_turnover?: number
        }
        Update: {
          abcd_fee_amount?: number
          abcd_fee_rate?: number
          adjusted_turnover?: number
          agent_reference?: string
          analyst_name?: string
          applicant_email?: string
          applicant_name?: string
          applicant_phone?: string
          approved_at?: string | null
          case_number?: string
          company_name?: string
          created_at?: string
          disbursed_at?: string | null
          documents?: Json
          eligible_loan_amount?: number
          eligible_multiplier?: number
          emi?: number
          id?: string
          interest_rate?: number
          lender?: string
          loan_amount?: number
          monthly_salary?: number
          notes?: string | null
          pos_annual_turnover?: number
          pos_cap_adjusted?: number
          pos_cap_vat?: number
          pos_eligible_turnover?: number
          pos_monthly_turnover?: number
          processing_fee?: number
          product_type?: string
          purpose?: string | null
          status?: string
          submitted_at?: string | null
          tenure?: number
          total_interest?: number
          total_payable?: number
          total_with_abcd?: number
          turnover_basis?: number
          updated_at?: string
          user_id?: string | null
          variance_percent?: number
          vat_turnover?: number
        }
        Relationships: []
      }
      loan_eligibility: {
        Row: {
          abcd_fee_amount: number | null
          abcd_fee_rate: number | null
          adjusted_turnover: number
          cash_adjustment: number
          company_name: string | null
          created_at: string
          declared_turnover: number
          eligibility_method: string | null
          eligibility_status: string
          eligible_loan_amount: number
          eligible_multiplier: number
          id: string
          notes: string | null
          period_end: string | null
          period_start: string | null
          pos_annual_turnover: number
          pos_cap_adjusted: number
          pos_cap_rate: number
          pos_cap_vat: number
          pos_eligible_turnover: number
          pos_monthly_turnover: number
          product_type: string
          sister_concern_adjustment: number
          total_with_abcd: number | null
          turnover_basis: number
          updated_at: string
          variance_bucket: string
          variance_percent: number
          vat_turnover: number
        }
        Insert: {
          abcd_fee_amount?: number | null
          abcd_fee_rate?: number | null
          adjusted_turnover?: number
          cash_adjustment?: number
          company_name?: string | null
          created_at?: string
          declared_turnover?: number
          eligibility_method?: string | null
          eligibility_status?: string
          eligible_loan_amount?: number
          eligible_multiplier?: number
          id?: string
          notes?: string | null
          period_end?: string | null
          period_start?: string | null
          pos_annual_turnover?: number
          pos_cap_adjusted?: number
          pos_cap_rate?: number
          pos_cap_vat?: number
          pos_eligible_turnover?: number
          pos_monthly_turnover?: number
          product_type?: string
          sister_concern_adjustment?: number
          total_with_abcd?: number | null
          turnover_basis?: number
          updated_at?: string
          variance_bucket?: string
          variance_percent?: number
          vat_turnover?: number
        }
        Update: {
          abcd_fee_amount?: number | null
          abcd_fee_rate?: number | null
          adjusted_turnover?: number
          cash_adjustment?: number
          company_name?: string | null
          created_at?: string
          declared_turnover?: number
          eligibility_method?: string | null
          eligibility_status?: string
          eligible_loan_amount?: number
          eligible_multiplier?: number
          id?: string
          notes?: string | null
          period_end?: string | null
          period_start?: string | null
          pos_annual_turnover?: number
          pos_cap_adjusted?: number
          pos_cap_rate?: number
          pos_cap_vat?: number
          pos_eligible_turnover?: number
          pos_monthly_turnover?: number
          product_type?: string
          sister_concern_adjustment?: number
          total_with_abcd?: number | null
          turnover_basis?: number
          updated_at?: string
          variance_bucket?: string
          variance_percent?: number
          vat_turnover?: number
        }
        Relationships: []
      }
      onboarding_cases: {
        Row: {
          action_required_by:
            | Database["public"]["Enums"]["action_required_by"]
            | null
          agent_id: string | null
          case_number: string | null
          client_notes: string | null
          created_at: string
          days_in_current_stage: number | null
          decision_at: string | null
          drop_reason: string | null
          has_missing_docs: boolean | null
          has_validation_errors: boolean | null
          id: string
          internal_notes: string | null
          is_urgent: boolean | null
          last_valid_process_stage:
            | Database["public"]["Enums"]["process_stage"]
            | null
          process_stage: Database["public"]["Enums"]["process_stage"] | null
          rag_status: Database["public"]["Enums"]["rag_status"] | null
          stage_entered_at: string | null
          status: Database["public"]["Enums"]["case_status"]
          submitted_at: string | null
          supervisor_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          action_required_by?:
            | Database["public"]["Enums"]["action_required_by"]
            | null
          agent_id?: string | null
          case_number?: string | null
          client_notes?: string | null
          created_at?: string
          days_in_current_stage?: number | null
          decision_at?: string | null
          drop_reason?: string | null
          has_missing_docs?: boolean | null
          has_validation_errors?: boolean | null
          id?: string
          internal_notes?: string | null
          is_urgent?: boolean | null
          last_valid_process_stage?:
            | Database["public"]["Enums"]["process_stage"]
            | null
          process_stage?: Database["public"]["Enums"]["process_stage"] | null
          rag_status?: Database["public"]["Enums"]["rag_status"] | null
          stage_entered_at?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          submitted_at?: string | null
          supervisor_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          action_required_by?:
            | Database["public"]["Enums"]["action_required_by"]
            | null
          agent_id?: string | null
          case_number?: string | null
          client_notes?: string | null
          created_at?: string
          days_in_current_stage?: number | null
          decision_at?: string | null
          drop_reason?: string | null
          has_missing_docs?: boolean | null
          has_validation_errors?: boolean | null
          id?: string
          internal_notes?: string | null
          is_urgent?: boolean | null
          last_valid_process_stage?:
            | Database["public"]["Enums"]["process_stage"]
            | null
          process_stage?: Database["public"]["Enums"]["process_stage"] | null
          rag_status?: Database["public"]["Enums"]["rag_status"] | null
          stage_entered_at?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          submitted_at?: string | null
          supervisor_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_cases_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_documents: {
        Row: {
          case_id: string
          created_at: string
          document_type: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_mandatory: boolean | null
          mime_type: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
          uploaded_by: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          case_id: string
          created_at?: string
          document_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_mandatory?: boolean | null
          mime_type?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          uploaded_by?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          case_id?: string
          created_at?: string
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_mandatory?: boolean | null
          mime_type?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          uploaded_by?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "onboarding_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_eligibility: {
        Row: {
          abcd_fee_amount: number | null
          abcd_fee_percent: number | null
          adjusted_turnover: number | null
          calculated_at: string | null
          calculated_by: string | null
          case_id: string
          created_at: string
          eligibility_basis: string | null
          eligibility_method: string | null
          eligibility_status: string | null
          eligible_loan_amount: number | null
          eligible_multiplier: number | null
          flags: Json | null
          id: string
          lender_id: string | null
          pos_annual_turnover: number | null
          pos_cap_adjusted: number | null
          pos_cap_percent: number | null
          pos_cap_vat: number | null
          pos_eligible_turnover: number | null
          recommended_lenders: Json | null
          total_with_abcd: number | null
          turnover_basis: number | null
          updated_at: string
          variance_bucket: string | null
          variance_percent: number | null
          vat_turnover: number | null
        }
        Insert: {
          abcd_fee_amount?: number | null
          abcd_fee_percent?: number | null
          adjusted_turnover?: number | null
          calculated_at?: string | null
          calculated_by?: string | null
          case_id: string
          created_at?: string
          eligibility_basis?: string | null
          eligibility_method?: string | null
          eligibility_status?: string | null
          eligible_loan_amount?: number | null
          eligible_multiplier?: number | null
          flags?: Json | null
          id?: string
          lender_id?: string | null
          pos_annual_turnover?: number | null
          pos_cap_adjusted?: number | null
          pos_cap_percent?: number | null
          pos_cap_vat?: number | null
          pos_eligible_turnover?: number | null
          recommended_lenders?: Json | null
          total_with_abcd?: number | null
          turnover_basis?: number | null
          updated_at?: string
          variance_bucket?: string | null
          variance_percent?: number | null
          vat_turnover?: number | null
        }
        Update: {
          abcd_fee_amount?: number | null
          abcd_fee_percent?: number | null
          adjusted_turnover?: number | null
          calculated_at?: string | null
          calculated_by?: string | null
          case_id?: string
          created_at?: string
          eligibility_basis?: string | null
          eligibility_method?: string | null
          eligibility_status?: string | null
          eligible_loan_amount?: number | null
          eligible_multiplier?: number | null
          flags?: Json | null
          id?: string
          lender_id?: string | null
          pos_annual_turnover?: number | null
          pos_cap_adjusted?: number | null
          pos_cap_percent?: number | null
          pos_cap_vat?: number | null
          pos_eligible_turnover?: number | null
          recommended_lenders?: Json | null
          total_with_abcd?: number | null
          turnover_basis?: number | null
          updated_at?: string
          variance_bucket?: string | null
          variance_percent?: number | null
          vat_turnover?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_eligibility_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "onboarding_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_loan_requirements: {
        Row: {
          case_id: string
          created_at: string
          id: string
          loan_type: string
          preferred_tenure: string | null
          purpose: string | null
          required_loan_amount: number
          updated_at: string
          urgent_funding: boolean | null
        }
        Insert: {
          case_id: string
          created_at?: string
          id?: string
          loan_type: string
          preferred_tenure?: string | null
          purpose?: string | null
          required_loan_amount: number
          updated_at?: string
          urgent_funding?: boolean | null
        }
        Update: {
          case_id?: string
          created_at?: string
          id?: string
          loan_type?: string
          preferred_tenure?: string | null
          purpose?: string | null
          required_loan_amount?: number
          updated_at?: string
          urgent_funding?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_loan_requirements_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: true
            referencedRelation: "onboarding_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_stage_history: {
        Row: {
          case_id: string
          change_reason: string | null
          change_type: string | null
          changed_at: string
          changed_by: string | null
          field_changed: string
          id: string
          lender_application_id: string | null
          metadata: Json | null
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          case_id: string
          change_reason?: string | null
          change_type?: string | null
          changed_at?: string
          changed_by?: string | null
          field_changed: string
          id?: string
          lender_application_id?: string | null
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          case_id?: string
          change_reason?: string | null
          change_type?: string | null
          changed_at?: string
          changed_by?: string | null
          field_changed?: string
          id?: string
          lender_application_id?: string | null
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_stage_history_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "onboarding_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_stage_history_lender_application_id_fkey"
            columns: ["lender_application_id"]
            isOneToOne: false
            referencedRelation: "case_lender_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_all_users_with_roles: {
        Args: never
        Returns: {
          created_at: string
          email: string
          full_name: string
          role: string
          user_id: string
        }[]
      }
      has_admin_privileges: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_coordinator: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      is_supervisor: { Args: never; Returns: boolean }
      update_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      action_required_by: "client" | "agent" | "bank" | "supervisor" | "none"
      app_role: "admin" | "user" | "super_admin" | "supervisor" | "coordinator"
      case_status:
        | "draft"
        | "in_process"
        | "additional_info_required"
        | "submitted_to_lender"
        | "approved"
        | "declined"
        | "dropped"
        | "on_hold"
        | "closed"
      document_status: "pending" | "uploaded" | "verified" | "rejected"
      lender_type: "bank" | "fintech" | "nbfc"
      process_stage:
        | "email_sent"
        | "ro_assigned"
        | "link_shared"
        | "link_completed"
        | "video_verification"
        | "signature_submitted"
        | "ro_confirmation"
        | "account_opened"
      rag_status: "green" | "amber" | "red"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      action_required_by: ["client", "agent", "bank", "supervisor", "none"],
      app_role: ["admin", "user", "super_admin", "supervisor", "coordinator"],
      case_status: [
        "draft",
        "in_process",
        "additional_info_required",
        "submitted_to_lender",
        "approved",
        "declined",
        "dropped",
        "on_hold",
        "closed",
      ],
      document_status: ["pending", "uploaded", "verified", "rejected"],
      lender_type: ["bank", "fintech", "nbfc"],
      process_stage: [
        "email_sent",
        "ro_assigned",
        "link_shared",
        "link_completed",
        "video_verification",
        "signature_submitted",
        "ro_confirmation",
        "account_opened",
      ],
      rag_status: ["green", "amber", "red"],
    },
  },
} as const
