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
          adjusted_turnover: number
          cash_adjustment: number
          created_at: string
          declared_turnover: number
          eligibility_status: string
          eligible_loan_amount: number
          eligible_multiplier: number
          id: string
          notes: string | null
          pos_annual_turnover: number
          pos_cap_adjusted: number
          pos_cap_rate: number
          pos_cap_vat: number
          pos_eligible_turnover: number
          pos_monthly_turnover: number
          product_type: string
          sister_concern_adjustment: number
          turnover_basis: number
          updated_at: string
          variance_bucket: string
          variance_percent: number
          vat_turnover: number
        }
        Insert: {
          adjusted_turnover?: number
          cash_adjustment?: number
          created_at?: string
          declared_turnover?: number
          eligibility_status?: string
          eligible_loan_amount?: number
          eligible_multiplier?: number
          id?: string
          notes?: string | null
          pos_annual_turnover?: number
          pos_cap_adjusted?: number
          pos_cap_rate?: number
          pos_cap_vat?: number
          pos_eligible_turnover?: number
          pos_monthly_turnover?: number
          product_type?: string
          sister_concern_adjustment?: number
          turnover_basis?: number
          updated_at?: string
          variance_bucket?: string
          variance_percent?: number
          vat_turnover?: number
        }
        Update: {
          adjusted_turnover?: number
          cash_adjustment?: number
          created_at?: string
          declared_turnover?: number
          eligibility_status?: string
          eligible_loan_amount?: number
          eligible_multiplier?: number
          id?: string
          notes?: string | null
          pos_annual_turnover?: number
          pos_cap_adjusted?: number
          pos_cap_rate?: number
          pos_cap_vat?: number
          pos_eligible_turnover?: number
          pos_monthly_turnover?: number
          product_type?: string
          sister_concern_adjustment?: number
          turnover_basis?: number
          updated_at?: string
          variance_bucket?: string
          variance_percent?: number
          vat_turnover?: number
        }
        Relationships: []
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      update_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
