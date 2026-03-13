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
      ai_credit_decision_results: {
        Row: {
          approval_probability: number | null
          case_id: string
          created_at: string
          created_by: string | null
          credit_rating: string | null
          decision_notes: string | null
          id: string
          key_strengths_json: Json | null
          model_version: string | null
          recommended_lender_id: string | null
          recommended_limit: number | null
          recommended_product_id: string | null
          risk_flags_json: Json | null
          summary_id: string | null
          taamul_credit_score: number | null
        }
        Insert: {
          approval_probability?: number | null
          case_id: string
          created_at?: string
          created_by?: string | null
          credit_rating?: string | null
          decision_notes?: string | null
          id?: string
          key_strengths_json?: Json | null
          model_version?: string | null
          recommended_lender_id?: string | null
          recommended_limit?: number | null
          recommended_product_id?: string | null
          risk_flags_json?: Json | null
          summary_id?: string | null
          taamul_credit_score?: number | null
        }
        Update: {
          approval_probability?: number | null
          case_id?: string
          created_at?: string
          created_by?: string | null
          credit_rating?: string | null
          decision_notes?: string | null
          id?: string
          key_strengths_json?: Json | null
          model_version?: string | null
          recommended_lender_id?: string | null
          recommended_limit?: number | null
          recommended_product_id?: string | null
          risk_flags_json?: Json | null
          summary_id?: string | null
          taamul_credit_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_credit_decision_results_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "assessment_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_credit_decision_results_recommended_lender_id_fkey"
            columns: ["recommended_lender_id"]
            isOneToOne: false
            referencedRelation: "onboarding_lenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_credit_decision_results_recommended_product_id_fkey"
            columns: ["recommended_product_id"]
            isOneToOne: false
            referencedRelation: "lender_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_credit_decision_results_summary_id_fkey"
            columns: ["summary_id"]
            isOneToOne: false
            referencedRelation: "combined_financial_summary"
            referencedColumns: ["id"]
          },
        ]
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
      assessment_analyst_adjustments: {
        Row: {
          adjusted_by: string | null
          adjusted_value: string | null
          adjustment_type: string
          case_id: string
          created_at: string
          field_name: string | null
          id: string
          original_value: string | null
          reason: string
          target_entity: string | null
          target_id: string | null
        }
        Insert: {
          adjusted_by?: string | null
          adjusted_value?: string | null
          adjustment_type: string
          case_id: string
          created_at?: string
          field_name?: string | null
          id?: string
          original_value?: string | null
          reason: string
          target_entity?: string | null
          target_id?: string | null
        }
        Update: {
          adjusted_by?: string | null
          adjusted_value?: string | null
          adjustment_type?: string
          case_id?: string
          created_at?: string
          field_name?: string | null
          id?: string
          original_value?: string | null
          reason?: string
          target_entity?: string | null
          target_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_analyst_adjustments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "assessment_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_bank_summaries: {
        Row: {
          account_number: string | null
          avg_daily_balance: number | null
          bank_name: string | null
          bounce_count: number | null
          case_id: string
          cash_deposit_total: number | null
          closing_balance: number | null
          created_at: string
          credit_count: number | null
          debit_count: number | null
          highest_credit: number | null
          id: string
          lowest_balance: number | null
          month: number
          negative_balance_days: number | null
          total_credits: number | null
          total_debits: number | null
          year: number
        }
        Insert: {
          account_number?: string | null
          avg_daily_balance?: number | null
          bank_name?: string | null
          bounce_count?: number | null
          case_id: string
          cash_deposit_total?: number | null
          closing_balance?: number | null
          created_at?: string
          credit_count?: number | null
          debit_count?: number | null
          highest_credit?: number | null
          id?: string
          lowest_balance?: number | null
          month: number
          negative_balance_days?: number | null
          total_credits?: number | null
          total_debits?: number | null
          year: number
        }
        Update: {
          account_number?: string | null
          avg_daily_balance?: number | null
          bank_name?: string | null
          bounce_count?: number | null
          case_id?: string
          cash_deposit_total?: number | null
          closing_balance?: number | null
          created_at?: string
          credit_count?: number | null
          debit_count?: number | null
          highest_credit?: number | null
          id?: string
          lowest_balance?: number | null
          month?: number
          negative_balance_days?: number | null
          total_credits?: number | null
          total_debits?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessment_bank_summaries_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "assessment_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_bank_transactions: {
        Row: {
          account_name: string | null
          account_number_masked: string | null
          balance: number | null
          bank_name: string | null
          case_id: string
          category: string | null
          cheque_no: string | null
          created_at: string
          credit: number | null
          debit: number | null
          description: string | null
          document_id: string | null
          exclusion_reason: string | null
          extraction_run_id: string | null
          id: string
          is_excluded: boolean | null
          is_recurring: boolean | null
          is_related_party: boolean | null
          month: number | null
          raw_text_reference: string | null
          source_page: number | null
          txn_date: string | null
          year: number | null
        }
        Insert: {
          account_name?: string | null
          account_number_masked?: string | null
          balance?: number | null
          bank_name?: string | null
          case_id: string
          category?: string | null
          cheque_no?: string | null
          created_at?: string
          credit?: number | null
          debit?: number | null
          description?: string | null
          document_id?: string | null
          exclusion_reason?: string | null
          extraction_run_id?: string | null
          id?: string
          is_excluded?: boolean | null
          is_recurring?: boolean | null
          is_related_party?: boolean | null
          month?: number | null
          raw_text_reference?: string | null
          source_page?: number | null
          txn_date?: string | null
          year?: number | null
        }
        Update: {
          account_name?: string | null
          account_number_masked?: string | null
          balance?: number | null
          bank_name?: string | null
          case_id?: string
          category?: string | null
          cheque_no?: string | null
          created_at?: string
          credit?: number | null
          debit?: number | null
          description?: string | null
          document_id?: string | null
          exclusion_reason?: string | null
          extraction_run_id?: string | null
          id?: string
          is_excluded?: boolean | null
          is_recurring?: boolean | null
          is_related_party?: boolean | null
          month?: number | null
          raw_text_reference?: string | null
          source_page?: number | null
          txn_date?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_bank_transactions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "assessment_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_bank_transactions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "assessment_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bank_txn_extraction_run"
            columns: ["extraction_run_id"]
            isOneToOne: false
            referencedRelation: "extraction_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_cases: {
        Row: {
          ai_matching_completed: boolean
          analysis_completed: boolean
          analyst_notes: string | null
          approved_at: string | null
          approved_by: string | null
          avg_monthly_balance: number | null
          avg_monthly_credit: number | null
          avg_monthly_debit: number | null
          b2b_revenue_pct: number | null
          bank_vat_variance_percent: number | null
          case_number: string | null
          cash_collection_pct: number | null
          company_name: string | null
          contact_person: string | null
          created_at: string
          created_by: string | null
          declared_vat_turnover: number | null
          email: string | null
          emirate: string | null
          estimated_annual_turnover: number | null
          existing_debt_count: number | null
          gross_margin_pct: number | null
          id: string
          industry: string | null
          latest_report_version: number | null
          legal_form: string | null
          lenders_run_completed: boolean
          mobile_number: string | null
          normalized_turnover: number | null
          past_breakeven: boolean | null
          proceeds_for_cogs: boolean | null
          receivable_days: number | null
          risk_flags: Json | null
          statement_months_covered: number | null
          status: string
          total_bank_credits: number | null
          total_bank_debits: number | null
          trade_license_number: string | null
          trn: string | null
          uae_revenue_pct: number | null
          updated_at: string
          user_id: string | null
          variance_tag: string | null
          vat_periods_covered: number | null
        }
        Insert: {
          ai_matching_completed?: boolean
          analysis_completed?: boolean
          analyst_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          avg_monthly_balance?: number | null
          avg_monthly_credit?: number | null
          avg_monthly_debit?: number | null
          b2b_revenue_pct?: number | null
          bank_vat_variance_percent?: number | null
          case_number?: string | null
          cash_collection_pct?: number | null
          company_name?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          declared_vat_turnover?: number | null
          email?: string | null
          emirate?: string | null
          estimated_annual_turnover?: number | null
          existing_debt_count?: number | null
          gross_margin_pct?: number | null
          id?: string
          industry?: string | null
          latest_report_version?: number | null
          legal_form?: string | null
          lenders_run_completed?: boolean
          mobile_number?: string | null
          normalized_turnover?: number | null
          past_breakeven?: boolean | null
          proceeds_for_cogs?: boolean | null
          receivable_days?: number | null
          risk_flags?: Json | null
          statement_months_covered?: number | null
          status?: string
          total_bank_credits?: number | null
          total_bank_debits?: number | null
          trade_license_number?: string | null
          trn?: string | null
          uae_revenue_pct?: number | null
          updated_at?: string
          user_id?: string | null
          variance_tag?: string | null
          vat_periods_covered?: number | null
        }
        Update: {
          ai_matching_completed?: boolean
          analysis_completed?: boolean
          analyst_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          avg_monthly_balance?: number | null
          avg_monthly_credit?: number | null
          avg_monthly_debit?: number | null
          b2b_revenue_pct?: number | null
          bank_vat_variance_percent?: number | null
          case_number?: string | null
          cash_collection_pct?: number | null
          company_name?: string | null
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          declared_vat_turnover?: number | null
          email?: string | null
          emirate?: string | null
          estimated_annual_turnover?: number | null
          existing_debt_count?: number | null
          gross_margin_pct?: number | null
          id?: string
          industry?: string | null
          latest_report_version?: number | null
          legal_form?: string | null
          lenders_run_completed?: boolean
          mobile_number?: string | null
          normalized_turnover?: number | null
          past_breakeven?: boolean | null
          proceeds_for_cogs?: boolean | null
          receivable_days?: number | null
          risk_flags?: Json | null
          statement_months_covered?: number | null
          status?: string
          total_bank_credits?: number | null
          total_bank_debits?: number | null
          trade_license_number?: string | null
          trn?: string | null
          uae_revenue_pct?: number | null
          updated_at?: string
          user_id?: string | null
          variance_tag?: string | null
          vat_periods_covered?: number | null
        }
        Relationships: []
      }
      assessment_documents: {
        Row: {
          account_holder: string | null
          account_number: string | null
          bank_name: string | null
          case_id: string
          checksum_hash: string | null
          created_at: string
          document_type: string
          duplicate_flag: boolean
          file_name: string
          file_path: string | null
          file_size: number | null
          file_url: string | null
          id: string
          is_active: boolean
          is_duplicate: boolean | null
          is_password_protected: boolean | null
          mime_type: string | null
          original_file_name: string | null
          period_from: string | null
          period_to: string | null
          upload_source: string | null
          uploaded_by: string | null
          validation_message: string | null
          validation_status: string | null
        }
        Insert: {
          account_holder?: string | null
          account_number?: string | null
          bank_name?: string | null
          case_id: string
          checksum_hash?: string | null
          created_at?: string
          document_type: string
          duplicate_flag?: boolean
          file_name: string
          file_path?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          is_duplicate?: boolean | null
          is_password_protected?: boolean | null
          mime_type?: string | null
          original_file_name?: string | null
          period_from?: string | null
          period_to?: string | null
          upload_source?: string | null
          uploaded_by?: string | null
          validation_message?: string | null
          validation_status?: string | null
        }
        Update: {
          account_holder?: string | null
          account_number?: string | null
          bank_name?: string | null
          case_id?: string
          checksum_hash?: string | null
          created_at?: string
          document_type?: string
          duplicate_flag?: boolean
          file_name?: string
          file_path?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          is_duplicate?: boolean | null
          is_password_protected?: boolean | null
          mime_type?: string | null
          original_file_name?: string | null
          period_from?: string | null
          period_to?: string | null
          upload_source?: string | null
          uploaded_by?: string | null
          validation_message?: string | null
          validation_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "assessment_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_lender_results: {
        Row: {
          case_id: string
          created_at: string
          eligibility_status: string
          failed_rules: Json | null
          id: string
          key_reasons: Json | null
          lender_id: string
          lender_name: string
          limit_basis: string | null
          passed_rules: Json | null
          pricing_band: string | null
          product_name: string | null
          recommended_limit: number | null
          required_deviations: Json | null
          risk_flags: Json | null
          rule_details: Json | null
          tenure_months: number | null
          updated_at: string
        }
        Insert: {
          case_id: string
          created_at?: string
          eligibility_status?: string
          failed_rules?: Json | null
          id?: string
          key_reasons?: Json | null
          lender_id: string
          lender_name: string
          limit_basis?: string | null
          passed_rules?: Json | null
          pricing_band?: string | null
          product_name?: string | null
          recommended_limit?: number | null
          required_deviations?: Json | null
          risk_flags?: Json | null
          rule_details?: Json | null
          tenure_months?: number | null
          updated_at?: string
        }
        Update: {
          case_id?: string
          created_at?: string
          eligibility_status?: string
          failed_rules?: Json | null
          id?: string
          key_reasons?: Json | null
          lender_id?: string
          lender_name?: string
          limit_basis?: string | null
          passed_rules?: Json | null
          pricing_band?: string | null
          product_name?: string | null
          recommended_limit?: number | null
          required_deviations?: Json | null
          risk_flags?: Json | null
          rule_details?: Json | null
          tenure_months?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_lender_results_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "assessment_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_lender_results_lender_id_fkey"
            columns: ["lender_id"]
            isOneToOne: false
            referencedRelation: "onboarding_lenders"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_vat_returns: {
        Row: {
          case_id: string
          created_at: string
          document_id: string | null
          exempt_supplies: number | null
          extraction_run_id: string | null
          filing_date: string | null
          id: string
          input_vat: number | null
          is_edited: boolean | null
          net_vat_payable: number | null
          original_values: Json | null
          output_vat: number | null
          source_file: string | null
          source_page: number | null
          tax_period_from: string | null
          tax_period_to: string | null
          taxable_supplies: number | null
          trn: string | null
          vat_sales: number | null
          zero_rated_supplies: number | null
        }
        Insert: {
          case_id: string
          created_at?: string
          document_id?: string | null
          exempt_supplies?: number | null
          extraction_run_id?: string | null
          filing_date?: string | null
          id?: string
          input_vat?: number | null
          is_edited?: boolean | null
          net_vat_payable?: number | null
          original_values?: Json | null
          output_vat?: number | null
          source_file?: string | null
          source_page?: number | null
          tax_period_from?: string | null
          tax_period_to?: string | null
          taxable_supplies?: number | null
          trn?: string | null
          vat_sales?: number | null
          zero_rated_supplies?: number | null
        }
        Update: {
          case_id?: string
          created_at?: string
          document_id?: string | null
          exempt_supplies?: number | null
          extraction_run_id?: string | null
          filing_date?: string | null
          id?: string
          input_vat?: number | null
          is_edited?: boolean | null
          net_vat_payable?: number | null
          original_values?: Json | null
          output_vat?: number | null
          source_file?: string | null
          source_page?: number | null
          tax_period_from?: string | null
          tax_period_to?: string | null
          taxable_supplies?: number | null
          trn?: string | null
          vat_sales?: number | null
          zero_rated_supplies?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_vat_returns_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "assessment_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_vat_returns_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "assessment_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_vat_extraction_run"
            columns: ["extraction_run_id"]
            isOneToOne: false
            referencedRelation: "extraction_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_analysis_consolidated: {
        Row: {
          accounts_analyzed: number | null
          balance_trend: string | null
          case_id: string
          created_at: string
          id: string
          largest_concentration_ratio: number | null
          overall_cash_ratio: number | null
          overall_emi_total: number | null
          overall_eod_balance: number | null
          overall_fx_ratio: number | null
          overall_govt_ratio: number | null
          overall_od_utilization: number | null
          overall_related_party_flag: boolean | null
          overall_return_ratio: number | null
          overall_risk_flags: Json | null
          overall_round_tripping_flag: boolean | null
          overall_salary_outflow: number | null
          total_monthly_credit: number | null
          total_monthly_debit: number | null
          total_months_covered: number | null
        }
        Insert: {
          accounts_analyzed?: number | null
          balance_trend?: string | null
          case_id: string
          created_at?: string
          id?: string
          largest_concentration_ratio?: number | null
          overall_cash_ratio?: number | null
          overall_emi_total?: number | null
          overall_eod_balance?: number | null
          overall_fx_ratio?: number | null
          overall_govt_ratio?: number | null
          overall_od_utilization?: number | null
          overall_related_party_flag?: boolean | null
          overall_return_ratio?: number | null
          overall_risk_flags?: Json | null
          overall_round_tripping_flag?: boolean | null
          overall_salary_outflow?: number | null
          total_monthly_credit?: number | null
          total_monthly_debit?: number | null
          total_months_covered?: number | null
        }
        Update: {
          accounts_analyzed?: number | null
          balance_trend?: string | null
          case_id?: string
          created_at?: string
          id?: string
          largest_concentration_ratio?: number | null
          overall_cash_ratio?: number | null
          overall_emi_total?: number | null
          overall_eod_balance?: number | null
          overall_fx_ratio?: number | null
          overall_govt_ratio?: number | null
          overall_od_utilization?: number | null
          overall_related_party_flag?: boolean | null
          overall_return_ratio?: number | null
          overall_risk_flags?: Json | null
          overall_round_tripping_flag?: boolean | null
          overall_salary_outflow?: number | null
          total_monthly_credit?: number | null
          total_monthly_debit?: number | null
          total_months_covered?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_analysis_consolidated_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: true
            referencedRelation: "assessment_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_analysis_results: {
        Row: {
          account_number: string | null
          average_eod_balance: number | null
          avg_monthly_credit_12m: number | null
          avg_monthly_credit_24m: number | null
          avg_monthly_debit_12m: number | null
          avg_monthly_debit_24m: number | null
          bank_name: string | null
          case_id: string
          cash_deposit_ratio: number | null
          cash_risk_flag: boolean | null
          circular_flow_ratio: number | null
          created_at: string
          emi_lender_list: Json | null
          emi_monthly_total: number | null
          estimated_employee_count: number | null
          fx_exposure_flag: boolean | null
          fx_transaction_ratio: number | null
          government_receipt_ratio: number | null
          government_receivable_flag: boolean | null
          id: string
          largest_payer_name: string | null
          largest_payer_ratio: number | null
          max_monthly_balance: number | null
          min_monthly_balance: number | null
          month_end_balance_trend: string | null
          monthly_salary_outflow: number | null
          months_covered: number | null
          od_utilization_ratio: number | null
          payer_concentration_flag: boolean | null
          peak_month: string | null
          period_from: string | null
          period_to: string | null
          related_party_flag: boolean | null
          related_party_flow_ratio: number | null
          returned_cheque_count: number | null
          returned_cheque_flag: boolean | null
          returned_cheque_ratio: number | null
          returned_cheque_value: number | null
          round_tripping_flag: boolean | null
          salary_consistency_flag: string | null
          total_credits: number | null
          total_debits: number | null
          trough_month: string | null
        }
        Insert: {
          account_number?: string | null
          average_eod_balance?: number | null
          avg_monthly_credit_12m?: number | null
          avg_monthly_credit_24m?: number | null
          avg_monthly_debit_12m?: number | null
          avg_monthly_debit_24m?: number | null
          bank_name?: string | null
          case_id: string
          cash_deposit_ratio?: number | null
          cash_risk_flag?: boolean | null
          circular_flow_ratio?: number | null
          created_at?: string
          emi_lender_list?: Json | null
          emi_monthly_total?: number | null
          estimated_employee_count?: number | null
          fx_exposure_flag?: boolean | null
          fx_transaction_ratio?: number | null
          government_receipt_ratio?: number | null
          government_receivable_flag?: boolean | null
          id?: string
          largest_payer_name?: string | null
          largest_payer_ratio?: number | null
          max_monthly_balance?: number | null
          min_monthly_balance?: number | null
          month_end_balance_trend?: string | null
          monthly_salary_outflow?: number | null
          months_covered?: number | null
          od_utilization_ratio?: number | null
          payer_concentration_flag?: boolean | null
          peak_month?: string | null
          period_from?: string | null
          period_to?: string | null
          related_party_flag?: boolean | null
          related_party_flow_ratio?: number | null
          returned_cheque_count?: number | null
          returned_cheque_flag?: boolean | null
          returned_cheque_ratio?: number | null
          returned_cheque_value?: number | null
          round_tripping_flag?: boolean | null
          salary_consistency_flag?: string | null
          total_credits?: number | null
          total_debits?: number | null
          trough_month?: string | null
        }
        Update: {
          account_number?: string | null
          average_eod_balance?: number | null
          avg_monthly_credit_12m?: number | null
          avg_monthly_credit_24m?: number | null
          avg_monthly_debit_12m?: number | null
          avg_monthly_debit_24m?: number | null
          bank_name?: string | null
          case_id?: string
          cash_deposit_ratio?: number | null
          cash_risk_flag?: boolean | null
          circular_flow_ratio?: number | null
          created_at?: string
          emi_lender_list?: Json | null
          emi_monthly_total?: number | null
          estimated_employee_count?: number | null
          fx_exposure_flag?: boolean | null
          fx_transaction_ratio?: number | null
          government_receipt_ratio?: number | null
          government_receivable_flag?: boolean | null
          id?: string
          largest_payer_name?: string | null
          largest_payer_ratio?: number | null
          max_monthly_balance?: number | null
          min_monthly_balance?: number | null
          month_end_balance_trend?: string | null
          monthly_salary_outflow?: number | null
          months_covered?: number | null
          od_utilization_ratio?: number | null
          payer_concentration_flag?: boolean | null
          peak_month?: string | null
          period_from?: string | null
          period_to?: string | null
          related_party_flag?: boolean | null
          related_party_flow_ratio?: number | null
          returned_cheque_count?: number | null
          returned_cheque_flag?: boolean | null
          returned_cheque_ratio?: number | null
          returned_cheque_value?: number | null
          round_tripping_flag?: boolean | null
          salary_consistency_flag?: string | null
          total_credits?: number | null
          total_debits?: number | null
          trough_month?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_analysis_results_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "assessment_cases"
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
      case_activity_log: {
        Row: {
          activity_description: string | null
          activity_type: string
          case_id: string
          done_at: string
          done_by: string | null
          id: string
          reference_id: string | null
          reference_table: string | null
        }
        Insert: {
          activity_description?: string | null
          activity_type: string
          case_id: string
          done_at?: string
          done_by?: string | null
          id?: string
          reference_id?: string | null
          reference_table?: string | null
        }
        Update: {
          activity_description?: string | null
          activity_type?: string
          case_id?: string
          done_at?: string
          done_by?: string | null
          id?: string
          reference_id?: string | null
          reference_table?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_activity_log_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "assessment_cases"
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
          workflow_id: string | null
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
          workflow_id?: string | null
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
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_lender_applications_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "onboarding_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_lender_applications_lender_id_fkey"
            columns: ["lender_id"]
            isOneToOne: false
            referencedRelation: "onboarding_lenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_lender_applications_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "onboarding_lender_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      case_reports: {
        Row: {
          based_on_execution_id: string | null
          based_on_summary_id: string | null
          case_id: string
          file_name: string
          file_path: string | null
          file_url: string | null
          generated_at: string
          generated_by: string | null
          id: string
          is_latest: boolean
          remarks: string | null
          report_format: string
          report_name: string
          report_type: string
          report_version: number
        }
        Insert: {
          based_on_execution_id?: string | null
          based_on_summary_id?: string | null
          case_id: string
          file_name: string
          file_path?: string | null
          file_url?: string | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          is_latest?: boolean
          remarks?: string | null
          report_format?: string
          report_name: string
          report_type: string
          report_version?: number
        }
        Update: {
          based_on_execution_id?: string | null
          based_on_summary_id?: string | null
          case_id?: string
          file_name?: string
          file_path?: string | null
          file_url?: string | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          is_latest?: boolean
          remarks?: string | null
          report_format?: string
          report_name?: string
          report_type?: string
          report_version?: number
        }
        Relationships: [
          {
            foreignKeyName: "case_reports_based_on_execution_id_fkey"
            columns: ["based_on_execution_id"]
            isOneToOne: false
            referencedRelation: "lender_execution_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_reports_based_on_summary_id_fkey"
            columns: ["based_on_summary_id"]
            isOneToOne: false
            referencedRelation: "combined_financial_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_reports_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "assessment_cases"
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
      combined_financial_summary: {
        Row: {
          adjusted_annual_turnover: number | null
          adjusted_monthly_turnover: number | null
          aecb_score: number | null
          approved_at: string | null
          approved_by: string | null
          average_client_credit_days: number | null
          avg_monthly_balance: number | null
          avg_monthly_bank_credit: number | null
          avg_monthly_debit: number | null
          bank_vat_variance: number | null
          break_even_status: boolean | null
          business_vintage_months: number | null
          case_id: string
          cash_deposit_ratio: number | null
          client_type: string | null
          created_at: string
          created_by: string | null
          ecommerce_monthly_settlement: number | null
          existing_debt: number | null
          gross_margin_percentage: number | null
          id: string
          internal_transfer_percentage: number | null
          inventory_turn_days: number | null
          inventory_value: number | null
          is_active: boolean
          negative_balance_days: number | null
          one_off_credit_percentage: number | null
          period_from: string | null
          period_to: string | null
          pos_monthly_settlement: number | null
          profitability_last_12_months: number | null
          receivable_days: number | null
          receivable_overdue_percent: number | null
          repeat_buyer_ratio: number | null
          returned_cheque_count: number | null
          risk_flags_json: Json | null
          shareholder_management_tenure_months: number | null
          summary_version: number
          top_5_customer_concentration: number | null
          uae_client_percentage: number | null
          use_of_proceeds: string | null
          vat_monthly_sales: number | null
        }
        Insert: {
          adjusted_annual_turnover?: number | null
          adjusted_monthly_turnover?: number | null
          aecb_score?: number | null
          approved_at?: string | null
          approved_by?: string | null
          average_client_credit_days?: number | null
          avg_monthly_balance?: number | null
          avg_monthly_bank_credit?: number | null
          avg_monthly_debit?: number | null
          bank_vat_variance?: number | null
          break_even_status?: boolean | null
          business_vintage_months?: number | null
          case_id: string
          cash_deposit_ratio?: number | null
          client_type?: string | null
          created_at?: string
          created_by?: string | null
          ecommerce_monthly_settlement?: number | null
          existing_debt?: number | null
          gross_margin_percentage?: number | null
          id?: string
          internal_transfer_percentage?: number | null
          inventory_turn_days?: number | null
          inventory_value?: number | null
          is_active?: boolean
          negative_balance_days?: number | null
          one_off_credit_percentage?: number | null
          period_from?: string | null
          period_to?: string | null
          pos_monthly_settlement?: number | null
          profitability_last_12_months?: number | null
          receivable_days?: number | null
          receivable_overdue_percent?: number | null
          repeat_buyer_ratio?: number | null
          returned_cheque_count?: number | null
          risk_flags_json?: Json | null
          shareholder_management_tenure_months?: number | null
          summary_version?: number
          top_5_customer_concentration?: number | null
          uae_client_percentage?: number | null
          use_of_proceeds?: string | null
          vat_monthly_sales?: number | null
        }
        Update: {
          adjusted_annual_turnover?: number | null
          adjusted_monthly_turnover?: number | null
          aecb_score?: number | null
          approved_at?: string | null
          approved_by?: string | null
          average_client_credit_days?: number | null
          avg_monthly_balance?: number | null
          avg_monthly_bank_credit?: number | null
          avg_monthly_debit?: number | null
          bank_vat_variance?: number | null
          break_even_status?: boolean | null
          business_vintage_months?: number | null
          case_id?: string
          cash_deposit_ratio?: number | null
          client_type?: string | null
          created_at?: string
          created_by?: string | null
          ecommerce_monthly_settlement?: number | null
          existing_debt?: number | null
          gross_margin_percentage?: number | null
          id?: string
          internal_transfer_percentage?: number | null
          inventory_turn_days?: number | null
          inventory_value?: number | null
          is_active?: boolean
          negative_balance_days?: number | null
          one_off_credit_percentage?: number | null
          period_from?: string | null
          period_to?: string | null
          pos_monthly_settlement?: number | null
          profitability_last_12_months?: number | null
          receivable_days?: number | null
          receivable_overdue_percent?: number | null
          repeat_buyer_ratio?: number | null
          returned_cheque_count?: number | null
          risk_flags_json?: Json | null
          shareholder_management_tenure_months?: number | null
          summary_version?: number
          top_5_customer_concentration?: number | null
          uae_client_percentage?: number | null
          use_of_proceeds?: string | null
          vat_monthly_sales?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "combined_financial_summary_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "assessment_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      extraction_runs: {
        Row: {
          case_id: string
          completed_at: string | null
          confidence_score: number | null
          created_at: string
          document_id: string | null
          extracted_by_engine: string | null
          extraction_status: string
          extraction_type: string
          id: string
          started_at: string | null
        }
        Insert: {
          case_id: string
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string
          document_id?: string | null
          extracted_by_engine?: string | null
          extraction_status?: string
          extraction_type?: string
          id?: string
          started_at?: string | null
        }
        Update: {
          case_id?: string
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string
          document_id?: string | null
          extracted_by_engine?: string | null
          extraction_status?: string
          extraction_type?: string
          id?: string
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extraction_runs_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "assessment_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extraction_runs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "assessment_documents"
            referencedColumns: ["id"]
          },
        ]
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
      lender_decision_matrix: {
        Row: {
          created_at: string
          decision_status: string
          id: string
          max_major_failures: number
          max_minor_failures: number
          min_major_failures: number
          min_minor_failures: number
          remarks: string | null
          rule_set_id: string
          score_from: number | null
          score_to: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          decision_status?: string
          id?: string
          max_major_failures?: number
          max_minor_failures?: number
          min_major_failures?: number
          min_minor_failures?: number
          remarks?: string | null
          rule_set_id: string
          score_from?: number | null
          score_to?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          decision_status?: string
          id?: string
          max_major_failures?: number
          max_minor_failures?: number
          min_major_failures?: number
          min_minor_failures?: number
          remarks?: string | null
          rule_set_id?: string
          score_from?: number | null
          score_to?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lender_decision_matrix_rule_set_id_fkey"
            columns: ["rule_set_id"]
            isOneToOne: false
            referencedRelation: "lender_rule_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      lender_execution_results: {
        Row: {
          case_id: string
          decision_summary: string | null
          eligibility_status: string
          executed_at: string
          executed_by: string | null
          failed_rules: Json | null
          id: string
          is_active: boolean
          lender_id: string
          major_fail_count: number | null
          minor_fail_count: number | null
          pricing_band: string | null
          product_id: string
          recommended_limit: number | null
          recommended_tenure: number | null
          risk_flags: Json | null
          rule_set_id: string
          score: number | null
          summary_id: string | null
        }
        Insert: {
          case_id: string
          decision_summary?: string | null
          eligibility_status?: string
          executed_at?: string
          executed_by?: string | null
          failed_rules?: Json | null
          id?: string
          is_active?: boolean
          lender_id: string
          major_fail_count?: number | null
          minor_fail_count?: number | null
          pricing_band?: string | null
          product_id: string
          recommended_limit?: number | null
          recommended_tenure?: number | null
          risk_flags?: Json | null
          rule_set_id: string
          score?: number | null
          summary_id?: string | null
        }
        Update: {
          case_id?: string
          decision_summary?: string | null
          eligibility_status?: string
          executed_at?: string
          executed_by?: string | null
          failed_rules?: Json | null
          id?: string
          is_active?: boolean
          lender_id?: string
          major_fail_count?: number | null
          minor_fail_count?: number | null
          pricing_band?: string | null
          product_id?: string
          recommended_limit?: number | null
          recommended_tenure?: number | null
          risk_flags?: Json | null
          rule_set_id?: string
          score?: number | null
          summary_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_execution_summary"
            columns: ["summary_id"]
            isOneToOne: false
            referencedRelation: "combined_financial_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lender_execution_results_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "assessment_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lender_execution_results_lender_id_fkey"
            columns: ["lender_id"]
            isOneToOne: false
            referencedRelation: "onboarding_lenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lender_execution_results_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "lender_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lender_execution_results_rule_set_id_fkey"
            columns: ["rule_set_id"]
            isOneToOne: false
            referencedRelation: "lender_rule_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      lender_formula_configs: {
        Row: {
          base_field: string
          cap_value: number | null
          created_at: string
          floor_value: number | null
          formula_expression: string | null
          formula_name: string
          formula_type: string
          id: string
          is_active: boolean
          multiplier: number | null
          rule_set_id: string
          updated_at: string
        }
        Insert: {
          base_field: string
          cap_value?: number | null
          created_at?: string
          floor_value?: number | null
          formula_expression?: string | null
          formula_name: string
          formula_type?: string
          id?: string
          is_active?: boolean
          multiplier?: number | null
          rule_set_id: string
          updated_at?: string
        }
        Update: {
          base_field?: string
          cap_value?: number | null
          created_at?: string
          floor_value?: number | null
          formula_expression?: string | null
          formula_name?: string
          formula_type?: string
          id?: string
          is_active?: boolean
          multiplier?: number | null
          rule_set_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lender_formula_configs_rule_set_id_fkey"
            columns: ["rule_set_id"]
            isOneToOne: false
            referencedRelation: "lender_rule_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      lender_match_config: {
        Row: {
          base_probability_factor: number
          cheque_return_deduction: number
          config_name: string
          created_at: string
          created_by: string | null
          customer_concentration_deduction: number
          eligibility_weight: number
          id: string
          is_active: boolean
          limit_weight: number
          negative_balance_deduction: number
          risk_weight: number
          rule_pass_weight: number
          updated_at: string
          vat_mismatch_deduction: number
        }
        Insert: {
          base_probability_factor?: number
          cheque_return_deduction?: number
          config_name?: string
          created_at?: string
          created_by?: string | null
          customer_concentration_deduction?: number
          eligibility_weight?: number
          id?: string
          is_active?: boolean
          limit_weight?: number
          negative_balance_deduction?: number
          risk_weight?: number
          rule_pass_weight?: number
          updated_at?: string
          vat_mismatch_deduction?: number
        }
        Update: {
          base_probability_factor?: number
          cheque_return_deduction?: number
          config_name?: string
          created_at?: string
          created_by?: string | null
          customer_concentration_deduction?: number
          eligibility_weight?: number
          id?: string
          is_active?: boolean
          limit_weight?: number
          negative_balance_deduction?: number
          risk_weight?: number
          rule_pass_weight?: number
          updated_at?: string
          vat_mismatch_deduction?: number
        }
        Relationships: []
      }
      lender_match_results: {
        Row: {
          approval_probability: number
          case_id: string
          created_at: string
          created_by: string | null
          decision_status: string
          eligibility_score: number
          execution_result_id: string | null
          id: string
          is_best_match: boolean
          lender_id: string
          lender_name: string
          limit_score: number
          match_score: number
          product_id: string
          product_name: string | null
          rank_position: number
          recommendation_reasons: Json | null
          recommended_limit: number
          recommended_tenure: number | null
          risk_flags: Json | null
          risk_score: number
          rule_pass_score: number
          sales_pitch: string | null
        }
        Insert: {
          approval_probability?: number
          case_id: string
          created_at?: string
          created_by?: string | null
          decision_status?: string
          eligibility_score?: number
          execution_result_id?: string | null
          id?: string
          is_best_match?: boolean
          lender_id: string
          lender_name: string
          limit_score?: number
          match_score?: number
          product_id: string
          product_name?: string | null
          rank_position?: number
          recommendation_reasons?: Json | null
          recommended_limit?: number
          recommended_tenure?: number | null
          risk_flags?: Json | null
          risk_score?: number
          rule_pass_score?: number
          sales_pitch?: string | null
        }
        Update: {
          approval_probability?: number
          case_id?: string
          created_at?: string
          created_by?: string | null
          decision_status?: string
          eligibility_score?: number
          execution_result_id?: string | null
          id?: string
          is_best_match?: boolean
          lender_id?: string
          lender_name?: string
          limit_score?: number
          match_score?: number
          product_id?: string
          product_name?: string | null
          rank_position?: number
          recommendation_reasons?: Json | null
          recommended_limit?: number
          recommended_tenure?: number | null
          risk_flags?: Json | null
          risk_score?: number
          rule_pass_score?: number
          sales_pitch?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lender_match_results_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "assessment_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lender_match_results_execution_result_id_fkey"
            columns: ["execution_result_id"]
            isOneToOne: false
            referencedRelation: "lender_execution_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lender_match_results_lender_id_fkey"
            columns: ["lender_id"]
            isOneToOne: false
            referencedRelation: "onboarding_lenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lender_match_results_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "lender_products"
            referencedColumns: ["id"]
          },
        ]
      }
      lender_policy_audit_log: {
        Row: {
          action_done: string
          change_reason: string | null
          changed_at: string
          changed_by: string | null
          id: string
          lender_id: string | null
          new_value: Json | null
          old_value: Json | null
          product_id: string | null
          rule_set_id: string | null
        }
        Insert: {
          action_done: string
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          lender_id?: string | null
          new_value?: Json | null
          old_value?: Json | null
          product_id?: string | null
          rule_set_id?: string | null
        }
        Update: {
          action_done?: string
          change_reason?: string | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          lender_id?: string | null
          new_value?: Json | null
          old_value?: Json | null
          product_id?: string | null
          rule_set_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lender_policy_audit_log_lender_id_fkey"
            columns: ["lender_id"]
            isOneToOne: false
            referencedRelation: "onboarding_lenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lender_policy_audit_log_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "lender_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lender_policy_audit_log_rule_set_id_fkey"
            columns: ["rule_set_id"]
            isOneToOne: false
            referencedRelation: "lender_rule_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      lender_products: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          lender_id: string
          max_limit: number | null
          max_tenure: number | null
          min_limit: number | null
          min_tenure: number | null
          product_code: string
          product_name: string
          product_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          lender_id: string
          max_limit?: number | null
          max_tenure?: number | null
          min_limit?: number | null
          min_tenure?: number | null
          product_code: string
          product_name: string
          product_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          lender_id?: string
          max_limit?: number | null
          max_tenure?: number | null
          min_limit?: number | null
          min_tenure?: number | null
          product_code?: string
          product_name?: string
          product_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lender_products_lender_id_fkey"
            columns: ["lender_id"]
            isOneToOne: false
            referencedRelation: "onboarding_lenders"
            referencedColumns: ["id"]
          },
        ]
      }
      lender_rule_result_details: {
        Row: {
          created_at: string
          execution_id: string
          field_name: string | null
          id: string
          impact_type: string | null
          impact_value: string | null
          message: string | null
          observed_value: string | null
          operator: string | null
          pass_fail_status: string
          rule_code: string | null
          rule_id: string | null
          rule_name: string | null
          threshold_value: string | null
          threshold_value_secondary: string | null
        }
        Insert: {
          created_at?: string
          execution_id: string
          field_name?: string | null
          id?: string
          impact_type?: string | null
          impact_value?: string | null
          message?: string | null
          observed_value?: string | null
          operator?: string | null
          pass_fail_status?: string
          rule_code?: string | null
          rule_id?: string | null
          rule_name?: string | null
          threshold_value?: string | null
          threshold_value_secondary?: string | null
        }
        Update: {
          created_at?: string
          execution_id?: string
          field_name?: string | null
          id?: string
          impact_type?: string | null
          impact_value?: string | null
          message?: string | null
          observed_value?: string | null
          operator?: string | null
          pass_fail_status?: string
          rule_code?: string | null
          rule_id?: string | null
          rule_name?: string | null
          threshold_value?: string | null
          threshold_value_secondary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lender_rule_result_details_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "lender_execution_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lender_rule_result_details_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "lender_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      lender_rule_sets: {
        Row: {
          created_at: string
          created_by: string | null
          effective_from: string | null
          effective_to: string | null
          id: string
          is_active: boolean
          lender_id: string
          product_id: string
          remarks: string | null
          rule_set_name: string
          updated_at: string
          version_no: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          is_active?: boolean
          lender_id: string
          product_id: string
          remarks?: string | null
          rule_set_name: string
          updated_at?: string
          version_no?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          is_active?: boolean
          lender_id?: string
          product_id?: string
          remarks?: string | null
          rule_set_name?: string
          updated_at?: string
          version_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "lender_rule_sets_lender_id_fkey"
            columns: ["lender_id"]
            isOneToOne: false
            referencedRelation: "onboarding_lenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lender_rule_sets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "lender_products"
            referencedColumns: ["id"]
          },
        ]
      }
      lender_rules: {
        Row: {
          action_type: string
          action_value: string | null
          created_at: string
          failure_message: string | null
          field_name: string
          id: string
          is_active: boolean
          operator: string
          priority_order: number
          review_message: string | null
          rule_category: string
          rule_code: string
          rule_name: string
          rule_set_id: string
          severity: string
          threshold_type: string
          threshold_value: string | null
          threshold_value_secondary: string | null
          updated_at: string
        }
        Insert: {
          action_type?: string
          action_value?: string | null
          created_at?: string
          failure_message?: string | null
          field_name: string
          id?: string
          is_active?: boolean
          operator?: string
          priority_order?: number
          review_message?: string | null
          rule_category?: string
          rule_code: string
          rule_name: string
          rule_set_id: string
          severity?: string
          threshold_type?: string
          threshold_value?: string | null
          threshold_value_secondary?: string | null
          updated_at?: string
        }
        Update: {
          action_type?: string
          action_value?: string | null
          created_at?: string
          failure_message?: string | null
          field_name?: string
          id?: string
          is_active?: boolean
          operator?: string
          priority_order?: number
          review_message?: string | null
          rule_category?: string
          rule_code?: string
          rule_name?: string
          rule_set_id?: string
          severity?: string
          threshold_type?: string
          threshold_value?: string | null
          threshold_value_secondary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lender_rules_rule_set_id_fkey"
            columns: ["rule_set_id"]
            isOneToOne: false
            referencedRelation: "lender_rule_sets"
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
          remarks: string | null
          stage_entered_at: string | null
          status: Database["public"]["Enums"]["case_status"]
          submitted_at: string | null
          supervisor_id: string | null
          tags: string[] | null
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
          remarks?: string | null
          stage_entered_at?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          submitted_at?: string | null
          supervisor_id?: string | null
          tags?: string[] | null
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
          remarks?: string | null
          stage_entered_at?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          submitted_at?: string | null
          supervisor_id?: string | null
          tags?: string[] | null
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
          base_multiplier: number | null
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
          base_multiplier?: number | null
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
          base_multiplier?: number | null
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
          {
            foreignKeyName: "onboarding_eligibility_lender_id_fkey"
            columns: ["lender_id"]
            isOneToOne: false
            referencedRelation: "onboarding_lenders"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_lender_workflows: {
        Row: {
          created_at: string
          id: string
          include_account_opened: boolean
          lender_id: string
          required_docs_by_stage: Json | null
          stages: Json
          status_mappings: Json
          updated_at: string
          workflow_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          include_account_opened?: boolean
          lender_id: string
          required_docs_by_stage?: Json | null
          stages?: Json
          status_mappings?: Json
          updated_at?: string
          workflow_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          include_account_opened?: boolean
          lender_id?: string
          required_docs_by_stage?: Json | null
          stages?: Json
          status_mappings?: Json
          updated_at?: string
          workflow_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_lender_workflows_lender_id_fkey"
            columns: ["lender_id"]
            isOneToOne: true
            referencedRelation: "onboarding_lenders"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_lenders: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          description: string | null
          document_requirements: Json
          eligibility_rules: Json
          id: string
          is_active: boolean
          lender_type: Database["public"]["Enums"]["lender_type"]
          logo_url: string | null
          name: string
          short_code: string
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          document_requirements?: Json
          eligibility_rules?: Json
          id?: string
          is_active?: boolean
          lender_type?: Database["public"]["Enums"]["lender_type"]
          logo_url?: string | null
          name: string
          short_code: string
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          document_requirements?: Json
          eligibility_rules?: Json
          id?: string
          is_active?: boolean
          lender_type?: Database["public"]["Enums"]["lender_type"]
          logo_url?: string | null
          name?: string
          short_code?: string
          updated_at?: string
        }
        Relationships: []
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
