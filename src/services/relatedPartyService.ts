/**
 * Related Party Management Service
 * Handles CRUD for related parties, transaction detection, and flow summary calculation.
 */
import { supabase } from '@/integrations/supabase/client';

export interface RelatedParty {
  id: string;
  case_id: string;
  entity_name: string;
  relationship_type: string;
  trade_license_no: string | null;
  relationship_description: string | null;
  shareholder_link: string | null;
  ownership_percentage: number;
  shareholder_name: string | null;
  country: string | null;
  industry: string | null;
  active_status: boolean;
  remarks: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RelatedPartyTransaction {
  id: string;
  case_id: string;
  related_party_id: string;
  transaction_id: string | null;
  transaction_date: string | null;
  description: string | null;
  debit: number;
  credit: number;
  bank_name: string | null;
  account_number: string | null;
  detected_by: string;
  mapping_confidence: number;
  created_at: string;
}

export interface RelatedPartyFlowSummary {
  id: string;
  case_id: string;
  total_related_inflows: number;
  total_related_outflows: number;
  total_bank_credits: number;
  total_bank_debits: number;
  inflow_ratio: number;
  outflow_ratio: number;
  overall_ratio: number;
  risk_level: string;
  parties_detected: number;
  transactions_matched: number;
  created_at: string;
  updated_at: string;
}

export const ENTITY_TYPES = [
  { value: 'sister_concern', label: 'Sister Concern' },
  { value: 'parent_company', label: 'Parent Company' },
  { value: 'subsidiary', label: 'Subsidiary' },
  { value: 'common_shareholder', label: 'Common Shareholder' },
  { value: 'director_related', label: 'Director Related Entity' },
  { value: 'group_company', label: 'Group Company' },
  { value: 'affiliate', label: 'Affiliate' },
  { value: 'joint_venture', label: 'Joint Venture' },
  { value: 'other', label: 'Other Related Entity' },
] as const;

export class RelatedPartyService {
  /** Fetch all related parties for a case */
  static async getParties(caseId: string): Promise<RelatedParty[]> {
    const { data, error } = await (supabase.from('case_related_parties') as any)
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  /** Add a related party */
  static async addParty(caseId: string, party: {
    entity_name: string;
    relationship_type: string;
    trade_license_no?: string;
    relationship_description?: string;
    shareholder_link?: string;
    ownership_percentage?: number;
    shareholder_name?: string;
    country?: string;
    industry?: string;
    remarks?: string;
  }): Promise<RelatedParty> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await (supabase.from('case_related_parties') as any)
      .insert({
        case_id: caseId,
        ...party,
        created_by: user?.id || null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /** Update a related party */
  static async updateParty(partyId: string, updates: Partial<{
    entity_name: string;
    relationship_type: string;
    trade_license_no: string;
    relationship_description: string;
    shareholder_link: string;
    ownership_percentage: number;
    shareholder_name: string;
    country: string;
    industry: string;
    active_status: boolean;
    remarks: string;
  }>): Promise<void> {
    const { error } = await (supabase.from('case_related_parties') as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', partyId);
    if (error) throw error;
  }

  /** Delete a related party */
  static async deleteParty(partyId: string): Promise<void> {
    const { error } = await (supabase.from('related_party_transactions') as any)
      .delete()
      .eq('related_party_id', partyId);
    if (!error) {
      await (supabase.from('case_related_parties') as any)
        .delete()
        .eq('id', partyId);
    }
  }

  /**
   * Detect related party transactions by matching bank transaction descriptions
   * against the related party register names.
   */
  static async detectTransactions(caseId: string): Promise<{
    matched: number;
    summary: RelatedPartyFlowSummary;
  }> {
    // 1. Get related parties
    const parties = await this.getParties(caseId);
    const activeParties = parties.filter(p => p.active_status);
    if (activeParties.length === 0) {
      // Create empty summary
      const summary = await this.upsertSummary(caseId, {
        total_related_inflows: 0,
        total_related_outflows: 0,
        total_bank_credits: 0,
        total_bank_debits: 0,
        inflow_ratio: 0,
        outflow_ratio: 0,
        overall_ratio: 0,
        risk_level: 'low',
        parties_detected: 0,
        transactions_matched: 0,
      });
      return { matched: 0, summary };
    }

    // 2. Get all bank transactions for case
    const { data: txns, error } = await supabase
      .from('assessment_bank_transactions')
      .select('*')
      .eq('case_id', caseId);
    if (error) throw error;
    if (!txns || txns.length === 0) {
      const summary = await this.upsertSummary(caseId, {
        total_related_inflows: 0,
        total_related_outflows: 0,
        total_bank_credits: 0,
        total_bank_debits: 0,
        inflow_ratio: 0,
        outflow_ratio: 0,
        overall_ratio: 0,
        risk_level: 'low',
        parties_detected: 0,
        transactions_matched: 0,
      });
      return { matched: 0, summary };
    }

    // 3. Clear old detected transactions
    await (supabase.from('related_party_transactions') as any)
      .delete()
      .eq('case_id', caseId);

    // 4. Match transactions
    const matches: any[] = [];
    const partiesDetected = new Set<string>();

    // Build search terms from entity names, shareholder names, and group company names
    const partyTerms = activeParties.flatMap(p => {
      const names: { id: string; name: string; tokens: string[]; source: string }[] = [];
      
      // Entity name (primary)
      names.push({
        id: p.id,
        name: p.entity_name,
        tokens: p.entity_name.toLowerCase().split(/\s+/).filter(t => t.length >= 3),
        source: 'entity_name',
      });

      // Shareholder name
      if (p.shareholder_name) {
        names.push({
          id: p.id,
          name: p.shareholder_name,
          tokens: p.shareholder_name.toLowerCase().split(/\s+/).filter(t => t.length >= 3),
          source: 'shareholder_name',
        });
      }

      // Group company / relationship description (may contain company names)
      if (p.relationship_description) {
        names.push({
          id: p.id,
          name: p.relationship_description,
          tokens: p.relationship_description.toLowerCase().split(/\s+/).filter(t => t.length >= 3),
          source: 'group_company',
        });
      }

      return names;
    });

    for (const txn of txns) {
      const desc = (txn.description || '').toLowerCase();
      if (!desc) continue;

      for (const party of partyTerms) {
        // Full name match
        if (desc.includes(party.name.toLowerCase())) {
          matches.push({
            case_id: caseId,
            related_party_id: party.id,
            transaction_id: txn.id,
            transaction_date: txn.txn_date,
            description: txn.description,
            debit: txn.debit || 0,
            credit: txn.credit || 0,
            bank_name: txn.bank_name,
            account_number: txn.account_number_masked,
            detected_by: `full_name_match (${party.source})`,
            mapping_confidence: 0.95,
          });
          partiesDetected.add(party.id);
          continue;
        }

        // Token match (at least 2 tokens match or single long token)
        const tokenMatches = party.tokens.filter(t => desc.includes(t));
        if (
          (party.tokens.length >= 2 && tokenMatches.length >= 2) ||
          (party.tokens.length === 1 && tokenMatches.length === 1 && party.tokens[0].length >= 5)
        ) {
          matches.push({
            case_id: caseId,
            related_party_id: party.id,
            transaction_id: txn.id,
            transaction_date: txn.txn_date,
            description: txn.description,
            debit: txn.debit || 0,
            credit: txn.credit || 0,
            bank_name: txn.bank_name,
            account_number: txn.account_number_masked,
            detected_by: 'token_match',
            mapping_confidence: tokenMatches.length / party.tokens.length,
          });
          partiesDetected.add(party.id);
        }
      }
    }

    // 5. Insert matched transactions in batches
    if (matches.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < matches.length; i += batchSize) {
        await (supabase.from('related_party_transactions') as any)
          .insert(matches.slice(i, i + batchSize));
      }
    }

    // 6. Calculate summary
    const totalInflows = matches.reduce((s, m) => s + (m.credit || 0), 0);
    const totalOutflows = matches.reduce((s, m) => s + (m.debit || 0), 0);
    const totalBankCredits = txns.reduce((s, t) => s + (t.credit || 0), 0);
    const totalBankDebits = txns.reduce((s, t) => s + (t.debit || 0), 0);

    const inflowRatio = totalBankCredits > 0 ? totalInflows / totalBankCredits : 0;
    const outflowRatio = totalBankDebits > 0 ? totalOutflows / totalBankDebits : 0;
    const totalActivity = totalBankCredits + totalBankDebits;
    const overallRatio = totalActivity > 0 ? (totalInflows + totalOutflows) / totalActivity : 0;

    let riskLevel = 'low';
    if (overallRatio > 0.3) riskLevel = 'high';
    else if (overallRatio > 0.15) riskLevel = 'medium';

    const summary = await this.upsertSummary(caseId, {
      total_related_inflows: Math.round(totalInflows * 100) / 100,
      total_related_outflows: Math.round(totalOutflows * 100) / 100,
      total_bank_credits: Math.round(totalBankCredits * 100) / 100,
      total_bank_debits: Math.round(totalBankDebits * 100) / 100,
      inflow_ratio: Math.round(inflowRatio * 10000) / 10000,
      outflow_ratio: Math.round(outflowRatio * 10000) / 10000,
      overall_ratio: Math.round(overallRatio * 10000) / 10000,
      risk_level: riskLevel,
      parties_detected: partiesDetected.size,
      transactions_matched: matches.length,
    });

    return { matched: matches.length, summary };
  }

  /** Get flow summary for a case */
  static async getFlowSummary(caseId: string): Promise<RelatedPartyFlowSummary | null> {
    const { data, error } = await (supabase.from('related_party_flow_summary') as any)
      .select('*')
      .eq('case_id', caseId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  /** Get detected transactions */
  static async getDetectedTransactions(caseId: string): Promise<RelatedPartyTransaction[]> {
    const { data, error } = await (supabase.from('related_party_transactions') as any)
      .select('*')
      .eq('case_id', caseId)
      .order('transaction_date', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  private static async upsertSummary(caseId: string, values: Omit<RelatedPartyFlowSummary, 'id' | 'case_id' | 'created_at' | 'updated_at'>): Promise<RelatedPartyFlowSummary> {
    // Delete existing then insert (upsert workaround)
    await (supabase.from('related_party_flow_summary') as any)
      .delete()
      .eq('case_id', caseId);

    const { data, error } = await (supabase.from('related_party_flow_summary') as any)
      .insert({ case_id: caseId, ...values })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
