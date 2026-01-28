// Currency codes commonly found in bank statements
export type CurrencyCode = 
  | 'AED' | 'USD' | 'EUR' | 'GBP' | 'SAR' | 'KWD' | 'BHD' 
  | 'OMR' | 'QAR' | 'INR' | 'PKR' | 'PHP' | 'EGP' | 'JOD'
  | 'CHF' | 'JPY' | 'CNY' | 'AUD' | 'CAD' | 'SGD' | 'HKD';

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  decimals: number;
}

export interface ExchangeRate {
  from: CurrencyCode;
  to: CurrencyCode;
  rate: number;
  date: string;
}

// Currency definitions with symbols and names
export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', decimals: 2 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2 },
  SAR: { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', decimals: 2 },
  KWD: { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar', decimals: 3 },
  BHD: { code: 'BHD', symbol: 'د.ب', name: 'Bahraini Dinar', decimals: 3 },
  OMR: { code: 'OMR', symbol: 'ر.ع.', name: 'Omani Rial', decimals: 3 },
  QAR: { code: 'QAR', symbol: 'ر.ق', name: 'Qatari Riyal', decimals: 2 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimals: 2 },
  PKR: { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', decimals: 2 },
  PHP: { code: 'PHP', symbol: '₱', name: 'Philippine Peso', decimals: 2 },
  EGP: { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', decimals: 2 },
  JOD: { code: 'JOD', symbol: 'د.ا', name: 'Jordanian Dinar', decimals: 3 },
  CHF: { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', decimals: 2 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0 },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimals: 2 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimals: 2 },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimals: 2 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', decimals: 2 },
  HKD: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', decimals: 2 },
};

// Default exchange rates to AED (can be updated with live rates)
const DEFAULT_RATES_TO_AED: Partial<Record<CurrencyCode, number>> = {
  AED: 1.0,
  USD: 3.6725,
  EUR: 4.02,
  GBP: 4.68,
  SAR: 0.98,
  KWD: 12.0,
  BHD: 9.75,
  OMR: 9.54,
  QAR: 1.01,
  INR: 0.044,
  PKR: 0.013,
  PHP: 0.066,
  EGP: 0.075,
  JOD: 5.18,
  CHF: 4.28,
  JPY: 0.024,
  CNY: 0.51,
  AUD: 2.42,
  CAD: 2.72,
  SGD: 2.76,
  HKD: 0.47,
};

export class CurrencyService {
  private static exchangeRates: Map<string, number> = new Map();
  private static baseCurrency: CurrencyCode = 'AED';
  private static ratesDate: string = new Date().toISOString().split('T')[0];

  static initialize() {
    // Initialize with default rates
    Object.entries(DEFAULT_RATES_TO_AED).forEach(([currency, rate]) => {
      this.exchangeRates.set(`${currency}_AED`, rate);
      // Also set reverse rate
      if (rate > 0) {
        this.exchangeRates.set(`AED_${currency}`, 1 / rate);
      }
    });
  }

  // Detect currency from PDF text
  static detectCurrency(text: string): CurrencyCode {
    const upperText = text.toUpperCase();
    
    // Check for explicit currency mentions
    const currencyPatterns: { pattern: RegExp; currency: CurrencyCode }[] = [
      { pattern: /CURRENCY\s*:?\s*AED|UAE\s*DIRHAM|DIRHAMS?/i, currency: 'AED' },
      { pattern: /CURRENCY\s*:?\s*USD|US\s*DOLLAR|UNITED\s*STATES\s*DOLLAR/i, currency: 'USD' },
      { pattern: /CURRENCY\s*:?\s*EUR|EURO[S]?/i, currency: 'EUR' },
      { pattern: /CURRENCY\s*:?\s*GBP|BRITISH\s*POUND|POUND\s*STERLING/i, currency: 'GBP' },
      { pattern: /CURRENCY\s*:?\s*SAR|SAUDI\s*RIYAL/i, currency: 'SAR' },
      { pattern: /CURRENCY\s*:?\s*KWD|KUWAITI\s*DINAR/i, currency: 'KWD' },
      { pattern: /CURRENCY\s*:?\s*BHD|BAHRAINI\s*DINAR/i, currency: 'BHD' },
      { pattern: /CURRENCY\s*:?\s*OMR|OMANI\s*RIAL/i, currency: 'OMR' },
      { pattern: /CURRENCY\s*:?\s*QAR|QATARI\s*RIYAL/i, currency: 'QAR' },
      { pattern: /CURRENCY\s*:?\s*INR|INDIAN\s*RUPEE/i, currency: 'INR' },
      { pattern: /CURRENCY\s*:?\s*PKR|PAKISTANI\s*RUPEE/i, currency: 'PKR' },
      { pattern: /CURRENCY\s*:?\s*PHP|PHILIPPINE\s*PESO/i, currency: 'PHP' },
      { pattern: /CURRENCY\s*:?\s*EGP|EGYPTIAN\s*POUND/i, currency: 'EGP' },
      { pattern: /CURRENCY\s*:?\s*CHF|SWISS\s*FRANC/i, currency: 'CHF' },
      { pattern: /CURRENCY\s*:?\s*JPY|JAPANESE\s*YEN/i, currency: 'JPY' },
      { pattern: /CURRENCY\s*:?\s*CNY|CHINESE\s*YUAN|RMB/i, currency: 'CNY' },
      { pattern: /CURRENCY\s*:?\s*AUD|AUSTRALIAN\s*DOLLAR/i, currency: 'AUD' },
      { pattern: /CURRENCY\s*:?\s*CAD|CANADIAN\s*DOLLAR/i, currency: 'CAD' },
      { pattern: /CURRENCY\s*:?\s*SGD|SINGAPORE\s*DOLLAR/i, currency: 'SGD' },
      { pattern: /CURRENCY\s*:?\s*HKD|HONG\s*KONG\s*DOLLAR/i, currency: 'HKD' },
    ];

    for (const { pattern, currency } of currencyPatterns) {
      if (pattern.test(text)) {
        return currency;
      }
    }

    // Check for currency symbols in amounts
    if (/\$[\d,]+\.\d{2}/.test(text) && !upperText.includes('AED')) {
      // Could be USD, AUD, CAD, SGD, HKD - default to USD
      return 'USD';
    }
    if (/€[\d,]+\.\d{2}|[\d,]+\.\d{2}\s*€/.test(text)) {
      return 'EUR';
    }
    if (/£[\d,]+\.\d{2}|[\d,]+\.\d{2}\s*£/.test(text)) {
      return 'GBP';
    }
    if (/¥[\d,]+|[\d,]+\s*¥/.test(text)) {
      // Could be JPY or CNY
      return upperText.includes('JAPAN') ? 'JPY' : 'CNY';
    }
    if (/₹[\d,]+\.\d{2}|[\d,]+\.\d{2}\s*₹/.test(text)) {
      return 'INR';
    }

    // Check for bank-specific patterns (UAE banks)
    if (/ADCB|ABU\s*DHABI\s*COMMERCIAL|EMIRATES\s*NBD|FAB|FIRST\s*ABU\s*DHABI|MASHREQ|RAK\s*BANK|DIB|DUBAI\s*ISLAMIC/i.test(text)) {
      return 'AED';
    }

    // Default to AED for UAE bank statements
    return 'AED';
  }

  // Detect currency from individual transaction description
  static detectTransactionCurrency(description: string, defaultCurrency: CurrencyCode): CurrencyCode {
    const desc = description.toUpperCase();
    
    // Check for FCY (Foreign Currency) indicators
    if (desc.includes('FCY') || desc.includes('FOREIGN CURRENCY')) {
      // Try to detect specific currency from description
      const currencyCodes = Object.keys(CURRENCIES) as CurrencyCode[];
      for (const code of currencyCodes) {
        if (desc.includes(code)) {
          return code;
        }
      }
    }

    // Check for specific currency mentions in description
    if (desc.includes('USD') || desc.includes('US DOLLAR')) return 'USD';
    if (desc.includes('EUR') || desc.includes('EURO')) return 'EUR';
    if (desc.includes('GBP') || desc.includes('POUND')) return 'GBP';
    if (desc.includes('SAR') || desc.includes('SAUDI')) return 'SAR';
    if (desc.includes('INR') || desc.includes('INDIAN RUPEE')) return 'INR';
    
    return defaultCurrency;
  }

  // Convert amount from one currency to another
  static convert(
    amount: number, 
    fromCurrency: CurrencyCode, 
    toCurrency: CurrencyCode
  ): number {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    // Try direct conversion
    const directKey = `${fromCurrency}_${toCurrency}`;
    if (this.exchangeRates.has(directKey)) {
      return amount * this.exchangeRates.get(directKey)!;
    }

    // Try via AED (base currency)
    const toBaseKey = `${fromCurrency}_AED`;
    const fromBaseKey = `AED_${toCurrency}`;
    
    if (this.exchangeRates.has(toBaseKey) && this.exchangeRates.has(fromBaseKey)) {
      const amountInAED = amount * this.exchangeRates.get(toBaseKey)!;
      return amountInAED * this.exchangeRates.get(fromBaseKey)!;
    }

    // Fallback: use default rates
    const fromRate = DEFAULT_RATES_TO_AED[fromCurrency] || 1;
    const toRate = DEFAULT_RATES_TO_AED[toCurrency] || 1;
    
    return (amount * fromRate) / toRate;
  }

  // Get exchange rate between two currencies
  static getRate(fromCurrency: CurrencyCode, toCurrency: CurrencyCode): number {
    if (fromCurrency === toCurrency) return 1;
    
    const key = `${fromCurrency}_${toCurrency}`;
    if (this.exchangeRates.has(key)) {
      return this.exchangeRates.get(key)!;
    }

    // Calculate via AED
    const fromRate = DEFAULT_RATES_TO_AED[fromCurrency] || 1;
    const toRate = DEFAULT_RATES_TO_AED[toCurrency] || 1;
    
    return fromRate / toRate;
  }

  // Set custom exchange rate
  static setRate(fromCurrency: CurrencyCode, toCurrency: CurrencyCode, rate: number) {
    this.exchangeRates.set(`${fromCurrency}_${toCurrency}`, rate);
    if (rate > 0) {
      this.exchangeRates.set(`${toCurrency}_${fromCurrency}`, 1 / rate);
    }
  }

  // Format amount with currency
  static format(amount: number, currency: CurrencyCode): string {
    const info = CURRENCIES[currency];
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: info.decimals,
      maximumFractionDigits: info.decimals,
    }).format(amount);
    
    return `${currency} ${formatted}`;
  }

  // Format with symbol
  static formatWithSymbol(amount: number, currency: CurrencyCode): string {
    const info = CURRENCIES[currency];
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: info.decimals,
      maximumFractionDigits: info.decimals,
    }).format(amount);
    
    return `${info.symbol} ${formatted}`;
  }

  // Get currency info
  static getCurrencyInfo(code: CurrencyCode): CurrencyInfo {
    return CURRENCIES[code] || CURRENCIES.AED;
  }

  // Get all available currencies
  static getAvailableCurrencies(): CurrencyInfo[] {
    return Object.values(CURRENCIES);
  }

  // Get base currency
  static getBaseCurrency(): CurrencyCode {
    return this.baseCurrency;
  }

  // Set base currency for conversions
  static setBaseCurrency(currency: CurrencyCode) {
    this.baseCurrency = currency;
  }

  // Get rates date
  static getRatesDate(): string {
    return this.ratesDate;
  }
}

// Initialize service
CurrencyService.initialize();
