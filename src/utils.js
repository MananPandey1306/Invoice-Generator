//  Number to Words (Indian) 

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
  'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen',
  'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
  'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigit(n) {
  if (n < 20) return ones[n];
  return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
}

function numberToWords(n) {
  if (!n || n === 0) return 'Zero';
  n = Math.floor(n);
  let result = '';
  if (n >= 10000000) {
    result += twoDigit(Math.floor(n / 10000000)) + ' Crore ';
    n %= 10000000;
  }
  if (n >= 100000) {
    result += twoDigit(Math.floor(n / 100000)) + ' Lakh ';
    n %= 100000;
  }
  if (n >= 1000) {
    result += twoDigit(Math.floor(n / 1000)) + ' Thousand ';
    n %= 1000;
  }
  if (n >= 100) {
    result += ones[Math.floor(n / 100)] + ' Hundred ';
    n %= 100;
  }
  if (n > 0) result += twoDigit(n);
  return result.trim();
}

export function amountToWords(amount) {
  if (!amount || amount === 0) return 'Zero Rupees Only';
  const [rupees, paise] = amount.toFixed(2).split('.').map(Number);
  let result = 'Rupees ' + numberToWords(rupees);
  if (paise > 0) result += ' and ' + numberToWords(paise) + ' Paise';
  return result + ' Only';
}

//  Currency Format 

export function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 2
  }).format(amount || 0);
}

//  Item Calculation 

export function calcItemAmount(item) {
  const qty = parseFloat(item.qty) || 0;
  const rate = parseFloat(item.rate) || 0;
  const disc = parseFloat(item.discount) || 0;
  const gst = parseFloat(item.gst) || 0;

  const base = qty * rate;
  const discAmt = base * (disc / 100);
  const afterDisc = base - discAmt;
  const gstAmt = afterDisc * (gst / 100);
  return {
    base,
    discAmt,
    afterDisc,
    gstAmt,
    total: afterDisc + gstAmt,
  };
}

//  Invoice Totals 

export function calcTotals(items) {
  let subtotal = 0, totalDisc = 0, totalGST = 0;
  items.forEach(item => {
    const c = calcItemAmount(item);
    subtotal += c.base;
    totalDisc += c.discAmt;
    totalGST += c.gstAmt;
  });
  const grand = subtotal - totalDisc + totalGST;
  return { subtotal, totalDisc, totalGST, grand };
}

//  LocalStorage helpers 

export function loadLS(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

export function saveLS(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

//  ID Generator 

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

//  Default Item 

export function defaultItem() {
  return {
    id: uid(),
    name: '',
    qty: '1',
    unit: 'pcs',
    rate: '',
    discount: '0',
    gst: '18',
  };
}

//  Default Invoice State 

export function defaultInvoice(num) {
  const today = new Date();
  const due = new Date(today);
  due.setDate(due.getDate() + 15);
  const fmt = d => d.toISOString().split('T')[0];
  return {
    invoiceNumber: `INV-${String(num).padStart(4, '0')}`,
    invoiceDate: fmt(today),
    dueDate: fmt(due),
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    paymentMode: 'Cash',
    notes: 'Goods once sold will not be returned.',
    igstMode: false,
    isEstimate: false,
    items: [defaultItem()],
  };
}
