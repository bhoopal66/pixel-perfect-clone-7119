// Service for managing currency conversion rates and applying conversions
import { supabase } from '@/integrations/supabase/client';
import { ActivityLogService } from '@/services/permanentStorageService';
import type { AccountCurrencyConfig, CurrencyConversionRate } from '@/types/currency.types';

export class CurrencyConversionService {
  /**
   * Save conversion rates for a case
   */
  static async saveConversionRates(
    caseId: string,
    accounts: AccountCurrencyConfig[],
    baseReportingCurrency: string
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    // Deactivate existing rates for this case
    await supabase
      .from('case_currency_conversion_rates')
      .update({ is_active: false } as any)
      .eq('case_id', caseId);

    // Insert new rates for foreign currency accounts
    const foreignAccounts = accounts.filter(a => a.statementCurrencyCode !== baseReportingCurrency && a.exchangeRateEntered);

    if (foreignAccounts.length > 0) {
      await supabase.from('case_currency_conversion_rates').insert(
        foreignAccounts.map(a => ({
          case_id: caseId,
          document_id: a.documentId || null,
          account_number: a.accountNumber,
          from_currency: a.statementCurrencyCode,
          to_currency: baseReportingCurrency,
          exchange_rate: a.exchangeRate,
          conversion_method: 'manual_fixed',
          is_active: true,
          remarks: `Manual rate: 1 ${a.statementCurrencyCode} = ${a.exchangeRate} ${baseReportingCurrency}`,
          created_by: user?.id || null,
        }))
      );

      await ActivityLogService.log(
        caseId,
        'conversion_rate_added' as any,
        `Exchange rates saved for ${foreignAccounts.length} foreign currency account(s)`
      );
    }

    // Update case base currency and multi-currency flag
    const multiCurrency = accounts.some(a => a.statementCurrencyCode !== baseReportingCurrency);
    await supabase.from('assessment_cases').update({
      base_reporting_currency: baseReportingCurrency,
      multi_currency_flag: multiCurrency,
    } as any).eq('id', caseId);
  }

  /**
   * Save confirmed bank and currency info to document records
   */
  static async saveAccountConfirmations(
    caseId: string,
    accounts: AccountCurrencyConfig[]
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    for (const account of accounts) {
      if (!account.documentId) continue;

      const updates: Record<string, any> = {};

      if (account.bankConfirmed) {
        updates.bank_id = account.bankId || null;
        updates.bank_name_confirmed = account.bankNameConfirmed || account.bankName;
        updates.bank_detection_source = account.bankDetectionSource;
        updates.bank_confirmed_by = user?.id || null;
        updates.bank_confirmed_at = new Date().toISOString();
      }

      if (account.currencyConfirmed) {
        updates.statement_currency_code = account.statementCurrencyCode;
        updates.currency_detection_source = account.currencyDetectionSource;
        updates.currency_confirmed_by = user?.id || null;
        updates.currency_confirmed_at = new Date().toISOString();
      }

      if (Object.keys(updates).length > 0) {
        await supabase
          .from('assessment_documents')
          .update(updates as any)
          .eq('id', account.documentId);
      }
    }

    await ActivityLogService.log(
      caseId,
      'bank_currency_confirmed' as any,
      `Bank and currency confirmed for ${accounts.filter(a => a.bankConfirmed || a.currencyConfirmed).length} statement(s)`
    );
  }

  /**
   * Convert a numeric value using an exchange rate
   */
  static convert(amount: number, rate: number): number {
    return Math.round(amount * rate * 100) / 100;
  }

  /**
   * Apply conversion to all transactions for a given account
   */
  static convertTransactions(
    transactions: Array<{ debit: number; credit: number; balance: number }>,
    rate: number
  ): Array<{ converted_debit: number; converted_credit: number; converted_balance: number }> {
    return transactions.map(t => ({
      converted_debit: this.convert(t.debit, rate),
      converted_credit: this.convert(t.credit, rate),
      converted_balance: this.convert(t.balance, rate),
    }));
  }

  /**
   * Get the effective exchange rate for a given account/document in a case
   */
  static async getActiveRate(
    caseId: string,
    fromCurrency: string,
    toCurrency: string,
    documentId?: string
  ): Promise<number | null> {
    if (fromCurrency === toCurrency) return 1;

    let query = supabase
      .from('case_currency_conversion_rates')
      .select('exchange_rate')
      .eq('case_id', caseId)
      .eq('from_currency', fromCurrency)
      .eq('to_currency', toCurrency)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (documentId) {
      query = query.eq('document_id', documentId);
    }

    const { data } = await query;
    return data && data.length > 0 ? (data[0] as any).exchange_rate : null;
  }

  /**
   * Fetch all active rates for a case
   */
  static async getAllRates(caseId: string): Promise<CurrencyConversionRate[]> {
    const { data } = await supabase
      .from('case_currency_conversion_rates')
      .select('*')
      .eq('case_id', caseId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    return (data || []).map((r: any) => ({
      id: r.id,
      caseId: r.case_id,
      documentId: r.document_id,
      accountNumber: r.account_number,
      fromCurrency: r.from_currency,
      toCurrency: r.to_currency,
      exchangeRate: r.exchange_rate,
      effectiveFromDate: r.effective_from_date,
      effectiveToDate: r.effective_to_date,
      conversionMethod: r.conversion_method,
      isActive: r.is_active,
      remarks: r.remarks,
    }));
  }
}
