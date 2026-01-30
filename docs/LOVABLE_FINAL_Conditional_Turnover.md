# LOVABLE FINAL PROMPT - CONDITIONAL TURNOVER CALCULATION

## 🎯 COMPLETE REQUIREMENT

### Turnover Formula (Conditional):
```typescript
Turnover = Total Credits - Cash Deposits - Sister Concern Credits

WITH CONDITIONS:
1. User can toggle exclusions ON/OFF (when allowed)
2. AUTOMATIC MANDATORY exclusion when:
   - Cash Deposits > 20% of Total Credits, OR
   - Sister Concern > 20% of Total Credits, OR
   - VAT Returns variance > 25%
3. Visual indicators when exclusions are mandatory
```

---

## 📋 PART 1: CONFIGURATION WITH CONDITIONAL LOGIC

### 1. Enhanced Configuration Interface

```typescript
interface TurnoverConfiguration {
  // User-controlled toggles (when allowed)
  excludeCashDeposits: boolean;
  excludeSisterConcern: boolean;
  
  // Automatic enforcement flags
  cashDepositsMandatory: boolean;    // TRUE if >20%
  sisterConcernMandatory: boolean;   // TRUE if >20%
  vatVarianceMandatory: boolean;     // TRUE if VAT variance >25%
  
  // Threshold values
  cashDepositThreshold: number;      // 20%
  sisterConcernThreshold: number;    // 20%
  vatVarianceThreshold: number;      // 25%
  
  // Sister companies list
  sisterCompanies: SisterCompany[];
  cashDepositKeywords: string[];
}

interface ExclusionStatus {
  cashDeposits: {
    amount: number;
    percentage: number;
    excluded: boolean;
    mandatory: boolean;
    reason: string;
  };
  sisterConcern: {
    amount: number;
    percentage: number;
    excluded: boolean;
    mandatory: boolean;
    reason: string;
  };
  vatVariance: {
    bankTurnover: number;
    vatSales: number;
    variance: number;
    percentageVariance: number;
    mandatory: boolean;
    reason: string;
  };
}
```

---

### 2. Configuration UI Component

```jsx
import { AlertTriangle, Info, Lock, Unlock } from 'lucide-react';

function TurnoverConfiguration({ config, onUpdate, exclusionStatus }) {
  const canToggleCash = !exclusionStatus.cashDeposits.mandatory;
  const canToggleSister = !exclusionStatus.sisterConcern.mandatory;
  
  return (
    <div className="turnover-config">
      <h2>Turnover Calculation Configuration</h2>
      
      {/* Formula Display */}
      <div className="formula-box">
        <h3>Current Formula:</h3>
        <code className="formula">
          Turnover = Total Credits
          {config.excludeCashDeposits && ' - Cash Deposits'}
          {config.excludeSisterConcern && ' - Sister Concern'}
        </code>
      </div>
      
      {/* Cash Deposits Toggle */}
      <div className="config-option">
        <div className="option-header">
          <label className={!canToggleCash ? 'disabled' : ''}>
            <input
              type="checkbox"
              checked={config.excludeCashDeposits}
              disabled={!canToggleCash}
              onChange={(e) => onUpdate({ excludeCashDeposits: e.target.checked })}
            />
            Exclude Cash Deposits from Turnover
            {!canToggleCash && <Lock className="lock-icon" />}
          </label>
          
          <div className="status-badge">
            Current: {formatCurrency(exclusionStatus.cashDeposits.amount)}
            ({exclusionStatus.cashDeposits.percentage.toFixed(2)}% of credits)
          </div>
        </div>
        
        {/* Mandatory Warning */}
        {exclusionStatus.cashDeposits.mandatory && (
          <div className="alert alert-warning mandatory">
            <AlertTriangle className="icon" />
            <div>
              <strong>MANDATORY EXCLUSION</strong>
              <p>{exclusionStatus.cashDeposits.reason}</p>
              <p className="rule">
                Rule: Cash deposits exceed 20% threshold ({exclusionStatus.cashDeposits.percentage.toFixed(2)}%)
              </p>
            </div>
          </div>
        )}
        
        {/* Info when optional */}
        {!exclusionStatus.cashDeposits.mandatory && (
          <div className="info-box">
            <Info className="icon" />
            <p>Cash deposits are {exclusionStatus.cashDeposits.percentage.toFixed(2)}% of total credits (below 20% threshold)</p>
            <p>You can choose whether to exclude them from turnover calculation.</p>
          </div>
        )}
      </div>
      
      {/* Sister Concern Toggle */}
      <div className="config-option">
        <div className="option-header">
          <label className={!canToggleSister ? 'disabled' : ''}>
            <input
              type="checkbox"
              checked={config.excludeSisterConcern}
              disabled={!canToggleSister}
              onChange={(e) => onUpdate({ excludeSisterConcern: e.target.checked })}
            />
            Exclude Sister Concern Transfers from Turnover
            {!canToggleSister && <Lock className="lock-icon" />}
          </label>
          
          <div className="status-badge">
            Current: {formatCurrency(exclusionStatus.sisterConcern.amount)}
            ({exclusionStatus.sisterConcern.percentage.toFixed(2)}% of credits)
          </div>
        </div>
        
        {/* Mandatory Warning */}
        {exclusionStatus.sisterConcern.mandatory && (
          <div className="alert alert-warning mandatory">
            <AlertTriangle className="icon" />
            <div>
              <strong>MANDATORY EXCLUSION</strong>
              <p>{exclusionStatus.sisterConcern.reason}</p>
              <p className="rule">
                Rule: Sister concern transfers exceed 20% threshold ({exclusionStatus.sisterConcern.percentage.toFixed(2)}%)
              </p>
            </div>
          </div>
        )}
        
        {/* Info when optional */}
        {!exclusionStatus.sisterConcern.mandatory && (
          <div className="info-box">
            <Info className="icon" />
            <p>Sister concern transfers are {exclusionStatus.sisterConcern.percentage.toFixed(2)}% of total credits (below 20% threshold)</p>
            <p>You can choose whether to exclude them from turnover calculation.</p>
          </div>
        )}
      </div>
      
      {/* VAT Variance Warning */}
      {exclusionStatus.vatVariance.mandatory && (
        <div className="alert alert-danger">
          <AlertTriangle className="icon" />
          <div>
            <strong>VAT VARIANCE ALERT - MANDATORY EXCLUSIONS ENFORCED</strong>
            <p>{exclusionStatus.vatVariance.reason}</p>
            <div className="variance-details">
              <p>Bank Turnover: {formatCurrency(exclusionStatus.vatVariance.bankTurnover)}</p>
              <p>VAT Sales: {formatCurrency(exclusionStatus.vatVariance.vatSales)}</p>
              <p>Variance: {formatCurrency(Math.abs(exclusionStatus.vatVariance.variance))} 
                 ({exclusionStatus.vatVariance.percentageVariance.toFixed(2)}%)</p>
            </div>
            <p className="rule">
              Rule: VAT variance exceeds 25% threshold - all cash deposits and sister concern transfers
              must be excluded to ensure accurate turnover reporting.
            </p>
          </div>
        </div>
      )}
      
      {/* Sister Companies Configuration */}
      <div className="sister-companies-section">
        <h3>Sister Companies / Related Parties</h3>
        <table className="companies-table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Active</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {config.sisterCompanies.map(company => (
              <tr key={company.id} className={company.active ? 'active' : 'inactive'}>
                <td>
                  <input 
                    value={company.name}
                    onChange={(e) => updateCompanyName(company.id, e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={company.active}
                    onChange={(e) => toggleCompany(company.id)}
                  />
                </td>
                <td>
                  <input
                    value={company.notes}
                    onChange={(e) => updateNotes(company.id, e.target.value)}
                  />
                </td>
                <td>
                  <button onClick={() => removeCompany(company.id)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={addNewCompany}>+ Add Sister Company</button>
      </div>
      
      {/* Cash Deposit Keywords */}
      <div className="keywords-section">
        <h3>Cash Deposit Keywords</h3>
        <input
          value={config.cashDepositKeywords.join(', ')}
          onChange={(e) => updateKeywords(e.target.value)}
          placeholder="CDM, CASH DEPOSIT, ATM DEPOSIT"
        />
      </div>
      
      {/* Threshold Configuration */}
      <div className="thresholds-section">
        <h3>Exclusion Thresholds</h3>
        <div className="threshold-inputs">
          <label>
            Cash Deposit Threshold:
            <input
              type="number"
              value={config.cashDepositThreshold}
              onChange={(e) => onUpdate({ cashDepositThreshold: parseFloat(e.target.value) })}
              min="0"
              max="100"
              step="1"
            />
            %
          </label>
          <label>
            Sister Concern Threshold:
            <input
              type="number"
              value={config.sisterConcernThreshold}
              onChange={(e) => onUpdate({ sisterConcernThreshold: parseFloat(e.target.value) })}
              min="0"
              max="100"
              step="1"
            />
            %
          </label>
          <label>
            VAT Variance Threshold:
            <input
              type="number"
              value={config.vatVarianceThreshold}
              onChange={(e) => onUpdate({ vatVarianceThreshold: parseFloat(e.target.value) })}
              min="0"
              max="100"
              step="1"
            />
            %
          </label>
        </div>
        <p className="info">
          Default thresholds: Cash (20%), Sister Concern (20%), VAT Variance (25%)
        </p>
      </div>
    </div>
  );
}
```

---

## 📊 PART 2: CONDITIONAL CALCULATION LOGIC

### 3. Exclusion Status Calculator

```typescript
function calculateExclusionStatus(
  transactions: Transaction[],
  config: TurnoverConfiguration,
  vatReturns: VATReturn[]
): ExclusionStatus {
  
  // Calculate totals
  const totalCredits = transactions
    .filter(t => t.credit > 0)
    .reduce((sum, t) => sum + t.credit, 0);
  
  // Identify cash deposits
  const cashDepositTransactions = transactions.filter(t => 
    t.credit > 0 && 
    config.cashDepositKeywords.some(keyword => 
      t.description.toLowerCase().includes(keyword.toLowerCase())
    )
  );
  const cashDepositsAmount = cashDepositTransactions.reduce((sum, t) => sum + t.credit, 0);
  const cashDepositsPercentage = (cashDepositsAmount / totalCredits) * 100;
  
  // Identify sister concern
  const activeSisters = config.sisterCompanies.filter(c => c.active);
  const sisterConcernTransactions = transactions.filter(t =>
    t.credit > 0 &&
    activeSisters.some(sister =>
      t.description.toLowerCase().includes(sister.name.toLowerCase())
    )
  );
  const sisterConcernAmount = sisterConcernTransactions.reduce((sum, t) => sum + t.credit, 0);
  const sisterConcernPercentage = (sisterConcernAmount / totalCredits) * 100;
  
  // Check thresholds
  const cashMandatory = cashDepositsPercentage > config.cashDepositThreshold;
  const sisterMandatory = sisterConcernPercentage > config.sisterConcernThreshold;
  
  // Calculate VAT variance
  const latestVAT = vatReturns[vatReturns.length - 1];
  let vatVarianceMandatory = false;
  let vatVarianceData = {
    bankTurnover: 0,
    vatSales: 0,
    variance: 0,
    percentageVariance: 0,
    mandatory: false,
    reason: ''
  };
  
  if (latestVAT) {
    const bankTurnover = totalCredits - 
      (config.excludeCashDeposits ? cashDepositsAmount : 0) -
      (config.excludeSisterConcern ? sisterConcernAmount : 0);
    
    const variance = Math.abs(bankTurnover - latestVAT.taxableSales);
    const percentageVariance = (variance / Math.max(bankTurnover, latestVAT.taxableSales)) * 100;
    
    vatVarianceMandatory = percentageVariance > config.vatVarianceThreshold;
    
    vatVarianceData = {
      bankTurnover,
      vatSales: latestVAT.taxableSales,
      variance,
      percentageVariance,
      mandatory: vatVarianceMandatory,
      reason: vatVarianceMandatory
        ? `VAT variance of ${percentageVariance.toFixed(2)}% exceeds ${config.vatVarianceThreshold}% threshold. ` +
          `All cash deposits and sister concern transfers must be excluded for accurate reporting.`
        : ''
    };
  }
  
  // Determine final mandatory status
  const finalCashMandatory = cashMandatory || vatVarianceMandatory;
  const finalSisterMandatory = sisterMandatory || vatVarianceMandatory;
  
  return {
    cashDeposits: {
      amount: cashDepositsAmount,
      percentage: cashDepositsPercentage,
      excluded: config.excludeCashDeposits || finalCashMandatory,
      mandatory: finalCashMandatory,
      reason: finalCashMandatory
        ? cashMandatory
          ? `Cash deposits represent ${cashDepositsPercentage.toFixed(2)}% of total credits, ` +
            `exceeding the ${config.cashDepositThreshold}% threshold. These must be excluded.`
          : `Excluded due to VAT variance exceeding ${config.vatVarianceThreshold}% threshold.`
        : ''
    },
    sisterConcern: {
      amount: sisterConcernAmount,
      percentage: sisterConcernPercentage,
      excluded: config.excludeSisterConcern || finalSisterMandatory,
      mandatory: finalSisterMandatory,
      reason: finalSisterMandatory
        ? sisterMandatory
          ? `Sister concern transfers represent ${sisterConcernPercentage.toFixed(2)}% of total credits, ` +
            `exceeding the ${config.sisterConcernThreshold}% threshold. These must be excluded.`
          : `Excluded due to VAT variance exceeding ${config.vatVarianceThreshold}% threshold.`
        : ''
    },
    vatVariance: vatVarianceData
  };
}
```

---

### 4. Final Turnover Calculation

```typescript
function calculateTurnover(
  transactions: Transaction[],
  exclusionStatus: ExclusionStatus
): TurnoverResult {
  
  const totalCredits = transactions
    .filter(t => t.credit > 0)
    .reduce((sum, t) => sum + t.credit, 0);
  
  const totalDebits = transactions
    .filter(t => t.debit > 0)
    .reduce((sum, t) => sum + t.debit, 0);
  
  // Calculate turnover based on exclusions
  let turnover = totalCredits;
  
  if (exclusionStatus.cashDeposits.excluded) {
    turnover -= exclusionStatus.cashDeposits.amount;
  }
  
  if (exclusionStatus.sisterConcern.excluded) {
    turnover -= exclusionStatus.sisterConcern.amount;
  }
  
  return {
    totalCredits,
    totalDebits,
    cashDeposits: exclusionStatus.cashDeposits.amount,
    cashDepositsExcluded: exclusionStatus.cashDeposits.excluded,
    sisterConcern: exclusionStatus.sisterConcern.amount,
    sisterConcernExcluded: exclusionStatus.sisterConcern.excluded,
    businessTurnover: turnover,
    exclusionRate: ((exclusionStatus.cashDeposits.amount + exclusionStatus.sisterConcern.amount) / totalCredits) * 100
  };
}
```

---

## 📊 PART 3: DISPLAY COMPONENTS

### 5. Turnover Summary Display

```jsx
function TurnoverSummary({ result, exclusionStatus }) {
  return (
    <div className="turnover-summary">
      <h2>Turnover Calculation Summary</h2>
      
      {/* Calculation Breakdown */}
      <div className="calculation-breakdown">
        <div className="breakdown-row total">
          <span>Total Credits</span>
          <span className="amount">{formatCurrency(result.totalCredits)}</span>
        </div>
        
        {/* Cash Deposits Row */}
        {result.cashDepositsExcluded && (
          <div className="breakdown-row exclusion">
            <span>
              Less: Cash Deposits
              {exclusionStatus.cashDeposits.mandatory && (
                <span className="badge mandatory">MANDATORY</span>
              )}
              {!exclusionStatus.cashDeposits.mandatory && (
                <span className="badge optional">OPTIONAL</span>
              )}
            </span>
            <span className="amount negative">
              -{formatCurrency(result.cashDeposits)}
            </span>
          </div>
        )}
        
        {/* Sister Concern Row */}
        {result.sisterConcernExcluded && (
          <div className="breakdown-row exclusion">
            <span>
              Less: Sister Concern
              {exclusionStatus.sisterConcern.mandatory && (
                <span className="badge mandatory">MANDATORY</span>
              )}
              {!exclusionStatus.sisterConcern.mandatory && (
                <span className="badge optional">OPTIONAL</span>
              )}
            </span>
            <span className="amount negative">
              -{formatCurrency(result.sisterConcern)}
            </span>
          </div>
        )}
        
        <div className="breakdown-row separator"></div>
        
        {/* Final Turnover */}
        <div className="breakdown-row final">
          <span className="label">Business Turnover</span>
          <span className="amount business">{formatCurrency(result.businessTurnover)}</span>
        </div>
        
        {/* Exclusion Rate */}
        <div className="breakdown-row info">
          <span>Total Exclusion Rate</span>
          <span className={`percentage ${result.exclusionRate > 30 ? 'high' : 'normal'}`}>
            {result.exclusionRate.toFixed(2)}%
          </span>
        </div>
      </div>
      
      {/* Status Cards */}
      <div className="status-cards">
        <StatusCard
          title="Cash Deposits"
          amount={result.cashDeposits}
          percentage={exclusionStatus.cashDeposits.percentage}
          excluded={result.cashDepositsExcluded}
          mandatory={exclusionStatus.cashDeposits.mandatory}
          threshold={20}
        />
        
        <StatusCard
          title="Sister Concern"
          amount={result.sisterConcern}
          percentage={exclusionStatus.sisterConcern.percentage}
          excluded={result.sisterConcernExcluded}
          mandatory={exclusionStatus.sisterConcern.mandatory}
          threshold={20}
        />
        
        {exclusionStatus.vatVariance.bankTurnover > 0 && (
          <StatusCard
            title="VAT Variance"
            amount={Math.abs(exclusionStatus.vatVariance.variance)}
            percentage={exclusionStatus.vatVariance.percentageVariance}
            mandatory={exclusionStatus.vatVariance.mandatory}
            threshold={25}
            type="variance"
          />
        )}
      </div>
    </div>
  );
}

function StatusCard({ title, amount, percentage, excluded, mandatory, threshold, type = 'exclusion' }) {
  const exceedsThreshold = percentage > threshold;
  
  return (
    <div className={`status-card ${exceedsThreshold ? 'warning' : 'normal'}`}>
      <div className="card-header">
        <h3>{title}</h3>
        {mandatory && <Lock className="mandatory-icon" />}
      </div>
      
      <div className="card-amount">
        {formatCurrency(amount)}
      </div>
      
      <div className="card-percentage">
        <span className={exceedsThreshold ? 'exceeds' : 'normal'}>
          {percentage.toFixed(2)}%
        </span>
        <span className="threshold-text">
          {exceedsThreshold ? `Exceeds ${threshold}%` : `Below ${threshold}%`}
        </span>
      </div>
      
      {type === 'exclusion' && (
        <div className="card-status">
          {excluded ? (
            <span className="status excluded">
              ✓ Excluded from Turnover
            </span>
          ) : (
            <span className="status included">
              ✗ Included in Turnover
            </span>
          )}
        </div>
      )}
      
      {mandatory && (
        <div className="mandatory-notice">
          <AlertTriangle className="icon" />
          <span>Mandatory Exclusion</span>
        </div>
      )}
    </div>
  );
}
```

---

### 6. Historical Analysis Table with Conditional Calculation

```jsx
function HistoricalAnalysisTable({ monthlyData, config }) {
  return (
    <div className="historical-analysis">
      <h2>Historical Turnover Analysis</h2>
      
      {/* Current Configuration Display */}
      <div className="config-display">
        <p>
          <strong>Current Configuration:</strong>
          Turnover = Total Credits
          {config.excludeCashDeposits && ' - Cash Deposits'}
          {config.excludeSisterConcern && ' - Sister Concern'}
        </p>
      </div>
      
      <table className="analysis-table">
        <thead>
          <tr>
            <th>Month</th>
            <th>Total Credits</th>
            <th>Cash Deposits</th>
            <th>Sister Concern</th>
            <th>Business Turnover</th>
            <th>Exclusion %</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {monthlyData.map(month => {
            const cashPct = (month.cashDeposits / month.totalCredits) * 100;
            const sisterPct = (month.sisterConcern / month.totalCredits) * 100;
            const totalExclusionPct = ((month.cashDeposits + month.sisterConcern) / month.totalCredits) * 100;
            
            const cashMandatory = cashPct > config.cashDepositThreshold;
            const sisterMandatory = sisterPct > config.sisterConcernThreshold;
            const anyMandatory = cashMandatory || sisterMandatory || month.vatVarianceMandatory;
            
            return (
              <tr key={month.month} className={anyMandatory ? 'mandatory-row' : ''}>
                <td>{month.month}</td>
                <td className="amount">{formatCurrency(month.totalCredits)}</td>
                <td className={`amount ${cashMandatory ? 'mandatory' : month.cashExcluded ? 'excluded' : ''}`}>
                  {formatCurrency(month.cashDeposits)}
                  {cashMandatory && <Lock className="icon-small" />}
                </td>
                <td className={`amount ${sisterMandatory ? 'mandatory' : month.sisterExcluded ? 'excluded' : ''}`}>
                  {formatCurrency(month.sisterConcern)}
                  {sisterMandatory && <Lock className="icon-small" />}
                </td>
                <td className="amount business">{formatCurrency(month.businessTurnover)}</td>
                <td className={`percentage ${totalExclusionPct > 30 ? 'high' : 'normal'}`}>
                  {totalExclusionPct.toFixed(2)}%
                </td>
                <td>
                  {anyMandatory ? (
                    <span className="badge mandatory">MANDATORY</span>
                  ) : (
                    <span className="badge optional">OPTIONAL</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="totals">
            <td>TOTAL</td>
            <td>{formatCurrency(sumField(monthlyData, 'totalCredits'))}</td>
            <td>{formatCurrency(sumField(monthlyData, 'cashDeposits'))}</td>
            <td>{formatCurrency(sumField(monthlyData, 'sisterConcern'))}</td>
            <td>{formatCurrency(sumField(monthlyData, 'businessTurnover'))}</td>
            <td>
              {((sumField(monthlyData, 'cashDeposits') + sumField(monthlyData, 'sisterConcern')) / 
                sumField(monthlyData, 'totalCredits') * 100).toFixed(2)}%
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
      
      {/* Legend */}
      <div className="table-legend">
        <div className="legend-item">
          <span className="indicator mandatory"></span>
          <span>Mandatory Exclusion (>20% threshold or VAT variance >25%)</span>
        </div>
        <div className="legend-item">
          <span className="indicator excluded"></span>
          <span>Optional Exclusion (user-selected)</span>
        </div>
        <div className="legend-item">
          <Lock className="icon-small" />
          <span>Locked (cannot be toggled)</span>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎨 PART 4: STYLING

```css
/* Configuration Page */
.turnover-config {
  padding: 2rem;
  max-width: 1200px;
}

.formula-box {
  background: #E8F4FD;
  border-left: 4px solid #1F4E78;
  padding: 1rem;
  margin-bottom: 2rem;
}

.formula {
  display: block;
  font-family: 'Courier New', monospace;
  font-size: 1.1rem;
  margin-top: 0.5rem;
  color: #1F4E78;
  font-weight: bold;
}

/* Config Options */
.config-option {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 1.5rem;
}

.option-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.option-header label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.option-header label.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.lock-icon {
  color: #F44336;
  width: 20px;
  height: 20px;
}

.status-badge {
  background: #F5F5F5;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
}

/* Alerts */
.alert {
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.alert.alert-warning {
  background: #FFF3E0;
  border-left: 4px solid #FF9800;
}

.alert.alert-warning.mandatory {
  background: #FFEBEE;
  border-left: 4px solid #F44336;
}

.alert.alert-danger {
  background: #FFEBEE;
  border-left: 4px solid #D32F2F;
}

.alert .icon {
  color: #F57C00;
  flex-shrink: 0;
}

.alert.mandatory .icon,
.alert.alert-danger .icon {
  color: #D32F2F;
}

.alert strong {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 1.05rem;
}

.alert .rule {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(0,0,0,0.1);
  font-style: italic;
  font-size: 0.95rem;
}

/* Info Box */
.info-box {
  background: #E8F5E9;
  border-left: 4px solid #4CAF50;
  padding: 1rem;
  margin-top: 1rem;
  display: flex;
  gap: 1rem;
}

.info-box .icon {
  color: #388E3C;
  flex-shrink: 0;
}

/* Status Cards */
.status-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.status-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border: 2px solid #E0E0E0;
}

.status-card.warning {
  border-color: #FF9800;
  background: #FFF3E0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-header h3 {
  font-size: 1.1rem;
  margin: 0;
}

.mandatory-icon {
  color: #F44336;
  width: 24px;
  height: 24px;
}

.card-amount {
  font-size: 1.8rem;
  font-weight: bold;
  color: #1F4E78;
  margin-bottom: 0.5rem;
}

.card-percentage {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-percentage .exceeds {
  color: #F44336;
  font-weight: bold;
  font-size: 1.2rem;
}

.card-percentage .normal {
  color: #4CAF50;
  font-weight: bold;
  font-size: 1.2rem;
}

.threshold-text {
  font-size: 0.85rem;
  color: #666;
}

.card-status {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #E0E0E0;
}

.status {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
}

.status.excluded {
  background: #FFC7CE;
  color: #C00000;
}

.status.included {
  background: #C6EFCE;
  color: #006100;
}

.mandatory-notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.5rem;
  background: #FFEBEE;
  border-radius: 6px;
  color: #D32F2F;
  font-weight: 600;
  font-size: 0.9rem;
}

/* Historical Table */
.analysis-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1.5rem;
}

.analysis-table thead th {
  background: #1F4E78;
  color: white;
  padding: 0.75rem;
  text-align: left;
}

.analysis-table tbody tr {
  border-bottom: 1px solid #E0E0E0;
}

.analysis-table tbody tr.mandatory-row {
  background: #FFEBEE;
}

.analysis-table td {
  padding: 0.75rem;
}

.amount {
  text-align: right;
  font-family: 'Courier New', monospace;
}

.amount.mandatory {
  background: #FFEBEE;
  color: #D32F2F;
  font-weight: bold;
}

.amount.excluded {
  background: #FFC7CE;
  color: #C00000;
}

.amount.business {
  background: #C6EFCE;
  color: #006100;
  font-weight: bold;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.badge.mandatory {
  background: #FFEBEE;
  color: #D32F2F;
}

.badge.optional {
  background: #E8F5E9;
  color: #388E3C;
}

.icon-small {
  width: 16px;
  height: 16px;
  margin-left: 0.25rem;
  vertical-align: middle;
}

/* Table Legend */
.table-legend {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #F5F5F5;
  border-radius: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.indicator {
  width: 30px;
  height: 20px;
  border-radius: 4px;
}

.indicator.mandatory {
  background: #FFEBEE;
  border: 2px solid #D32F2F;
}

.indicator.excluded {
  background: #FFC7CE;
  border: 2px solid #C00000;
}
```

---

## ✅ IMPLEMENTATION CHECKLIST

### Core Functionality:
- [ ] Configuration interface with toggles
- [ ] Threshold monitoring (20% for cash/sister, 25% for VAT)
- [ ] Automatic enforcement when thresholds exceeded
- [ ] Lock/unlock toggles based on conditions
- [ ] Visual indicators (mandatory vs optional)
- [ ] Warning messages with explanations

### Calculation Logic:
- [ ] Calculate cash deposit percentage
- [ ] Calculate sister concern percentage
- [ ] Calculate VAT variance percentage
- [ ] Determine mandatory status for each
- [ ] Apply exclusions conditionally
- [ ] Calculate final turnover

### UI Components:
- [ ] Configuration page
- [ ] Turnover summary display
- [ ] Status cards
- [ ] Historical analysis table
- [ ] Alerts and warnings
- [ ] Color coding

### Business Rules:
- [ ] Cash deposits >20% → Mandatory exclusion
- [ ] Sister concern >20% → Mandatory exclusion
- [ ] VAT variance >25% → Both mandatory
- [ ] User can toggle when below thresholds
- [ ] Clear messaging for all states

---

## 🧪 TEST SCENARIOS

### Scenario 1: All Optional (Normal Case)
```
Cash Deposits: 1,000 AED (0.5% of 200,000)
Sister Concern: 10,000 AED (5% of 200,000)
VAT Variance: 3%

Result:
✓ Both toggles enabled
✓ User can choose to include/exclude
✓ Green status indicators
```

### Scenario 2: Cash Deposits Mandatory
```
Cash Deposits: 50,000 AED (25% of 200,000) ← EXCEEDS 20%
Sister Concern: 10,000 AED (5% of 200,000)
VAT Variance: 3%

Result:
✗ Cash toggle locked ON
✓ Sister toggle enabled
⚠️ Warning: Cash mandatory
🔒 Cannot disable cash exclusion
```

### Scenario 3: Sister Concern Mandatory
```
Cash Deposits: 1,000 AED (0.5% of 200,000)
Sister Concern: 60,000 AED (30% of 200,000) ← EXCEEDS 20%
VAT Variance: 3%

Result:
✓ Cash toggle enabled
✗ Sister toggle locked ON
⚠️ Warning: Sister mandatory
🔒 Cannot disable sister exclusion
```

### Scenario 4: VAT Variance Forces Both
```
Cash Deposits: 1,000 AED (0.5% of 200,000)
Sister Concern: 10,000 AED (5% of 200,000)
VAT Variance: 30% ← EXCEEDS 25%

Result:
✗ Both toggles locked ON
⚠️ Critical warning: VAT variance
🔒 Cannot disable either exclusion
💡 Explanation: Variance too high
```

### Scenario 5: All Mandatory
```
Cash Deposits: 50,000 AED (25% of 200,000)
Sister Concern: 60,000 AED (30% of 200,000)
VAT Variance: 30%

Result:
✗ Both toggles locked ON
⚠️ Multiple warnings shown
🔒 Complete enforcement
```

---

**THIS IS THE FINAL, CORRECT IMPLEMENTATION with conditional logic and automatic enforcement!**
