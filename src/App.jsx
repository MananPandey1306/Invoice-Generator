import { useState, useEffect, useRef } from 'react';
import {
  loadLS, saveLS, defaultItem, defaultInvoice,
  calcItemAmount, calcTotals, formatINR, amountToWords
} from './utils';
import InvoiceDocument from './InvoiceDocument';

const UNITS = ['pcs', 'kg', 'g', 'litre', 'ml', 'box', 'bag', 'roll', 'pair', 'set', 'dozen', 'metre'];
const GST_OPTIONS = ['-', '5', '12', '18', '28'];
const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Credit'];

//  Phone helpers 
function cleanPhone(raw) {
  if (!raw) return null;
  let d = raw.replace(/\D/g, '');
  if (d.length === 10)                          d = '91' + d;
  else if (d.startsWith('0') && d.length === 11) d = '91' + d.slice(1);
  else if (d.startsWith('+')) d = d.slice(1);
  if (d.length < 10) return null;
  return d;
}

//  WhatsApp message builder 
function buildWhatsAppMsg(biz, invoice) {
  const isEst = invoice.isEstimate;
  const label = isEst ? 'Estimate' : 'Invoice';
  const { grand } = calcTotals(invoice.items || []);
  const itemLines = (invoice.items || [])
    .filter(i => i.name)
    .map((i, idx) => {
      const c = calcItemAmount(i);
      return `  ${idx + 1}. ${i.name}  ${i.qty} ${i.unit}    ${c.total.toFixed(2)}`;
    }).join('\n');

  return `Hello ${invoice.customerName || 'Sir/Madam'} \n\nHere are your *${label}* details from *${biz.name || 'Our Store'}*:\n\n *${label} No:* ${invoice.invoiceNumber}\n *Date:* ${invoice.invoiceDate}${invoice.dueDate ? `\n *Due:* ${invoice.dueDate}` : ''}\n\n*Items:*\n${itemLines || '  (no items)'}\n\n *Grand Total: ${grand.toFixed(2)}*\n${amountToWords(grand)}\n\n *Payment:* ${invoice.paymentMode}${invoice.notes ? `\n\n _${invoice.notes}_` : ''}\n\nThank you for your business! ${biz.phone ? `\n ${biz.phone}` : ''}${biz.email ? `\n ${biz.email}` : ''}`.trim();
}

//  PDF generator using html2canvas + jsPDF 
async function generatePDF(element, invoice) {
  const { default: html2canvas } = await import('html2canvas');
  const { jsPDF } = await import('jspdf');

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    removeContainer: true,
  });

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const A4_W = 210;  // mm
  const A4_H = 297;  // mm
  const MARGIN = 0;  // no margin  we control content sizing

  const imgData   = canvas.toDataURL('image/jpeg', 0.92);
  const contentH  = (canvas.height / canvas.width) * A4_W;

  if (contentH <= A4_H) {
    // Fits naturally
    pdf.addImage(imgData, 'JPEG', MARGIN, MARGIN, A4_W - MARGIN * 2, contentH);
  } else {
    // Scale to fit one page
    const scale    = A4_H / contentH;
    const scaledW  = (A4_W - MARGIN * 2) * scale;
    const xOffset  = (A4_W - scaledW) / 2;
    pdf.addImage(imgData, 'JPEG', xOffset, MARGIN, scaledW, A4_H - MARGIN * 2);
  }

  const label    = invoice.isEstimate ? 'Estimate' : 'Invoice';
  const filename = `${label}-${invoice.invoiceNumber}.pdf`;
  return { pdf, blob: pdf.output('blob'), filename };
}

//  Toast 
function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, []);
  return <div className="save-toast"> {msg}</div>;
}

//  WhatsApp Send Modal 
function WhatsAppModal({ biz, invoice, pdfRef, onClose }) {
  const [phone,  setPhone]  = useState(invoice.customerPhone || '');
  const [step,   setStep]   = useState('form'); // form | generating | done | error
  const [errMsg, setErrMsg] = useState('');

  const num = cleanPhone(phone);

  async function handleSend() {
    setStep('generating');
    try {
      const el = pdfRef.current;
      const { pdf, blob, filename } = await generatePDF(el, invoice);
      const file = new File([blob], filename, { type: 'application/pdf' });

      //  Mobile: Web Share API (can share file directly to WhatsApp app) 
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: filename,
          text: buildWhatsAppMsg(biz, invoice),
        });
        setStep('done');
        return;
      }

      //  Desktop: auto-download PDF + open WhatsApp web 
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);

      // Open WhatsApp chat (with number if available, else web.whatsapp.com)
      const msg     = buildWhatsAppMsg(biz, invoice);
      const waUrl   = num
        ? `https://wa.me/${num}?text=${encodeURIComponent(msg)}`
        : `https://web.whatsapp.com`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');

      setStep('done');
    } catch (err) {
      console.error(err);
      setErrMsg(err.message || 'Something went wrong.');
      setStep('error');
    }
  }

  const isMobileShare = typeof navigator.canShare === 'function';

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="wa-modal">

        {/* Header */}
        <div className="wa-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}></span>
            <div>
              <div className="wa-modal-title">Send via WhatsApp</div>
              <div className="wa-modal-sub">
                {isMobileShare
                  ? 'PDF will be shared directly to WhatsApp'
                  : 'PDF will download  attach it in WhatsApp'}
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}></button>
        </div>

        {/* Body */}
        <div className="wa-modal-body">

          {step === 'form' && (<>
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label>
                WhatsApp Number
                {phone && (
                  <span className={`wa-status ${num ? 'detected' : 'missing'}`} style={{ marginLeft: 8 }}>
                    {num ? ' Valid' : ' Invalid'}
                  </span>
                )}
              </label>
              <input
                id="wa-phone-input"
                placeholder="+91 98765 43210  (leave blank to choose in WhatsApp)"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                autoFocus
              />
              {!phone && (
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                  You can leave this blank and pick the contact inside WhatsApp manually.
                </div>
              )}
            </div>

            {!isMobileShare && (
              <div className="wa-steps">
                <div className="wa-step">
                  <span className="wa-step-num">1</span>
                  <span>PDF will be <strong>auto-downloaded</strong> to your device</span>
                </div>
                <div className="wa-step">
                  <span className="wa-step-num">2</span>
                  <span>WhatsApp {num ? 'chat' : 'Web'} will open automatically</span>
                </div>
                <div className="wa-step">
                  <span className="wa-step-num">3</span>
                  <span>Click the <strong> attachment icon</strong> in WhatsApp and attach the downloaded PDF</span>
                </div>
              </div>
            )}

            {isMobileShare && (
              <div className="wa-info">
                 Your device supports direct sharing  the PDF will be attached automatically when you select WhatsApp!
              </div>
            )}
          </>)}

          {step === 'generating' && (
            <div className="wa-loading">
              <div className="wa-spinner" />
              <div>Generating A4 PDF please wait</div>
            </div>
          )}

          {step === 'done' && (
            <div className="wa-done">
              <div style={{ fontSize: 40 }}></div>
              <div className="wa-done-text">
                {isMobileShare
                  ? 'Shared successfully!'
                  : 'PDF downloaded! Attach it in the WhatsApp window that just opened.'}
              </div>
            </div>
          )}

          {step === 'error' && (
            <div className="wa-done" style={{ color: '#f87171' }}>
              <div style={{ fontSize: 36 }}></div>
              <div style={{ fontWeight: 600 }}>Could not generate PDF</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{errMsg}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="wa-modal-footer">
          {step === 'form' && (
            <button id="wa-send-btn" className="btn btn-whatsapp btn-lg" onClick={handleSend}>
               {isMobileShare ? 'Share PDF on WhatsApp' : 'Download PDF & Open WhatsApp'}
            </button>
          )}
          {step === 'done' && (
            <button className="btn btn-whatsapp" onClick={() => setStep('form')}>Send Again</button>
          )}
          {step === 'error' && (
            <button className="btn btn-whatsapp" onClick={() => setStep('form')}>Try Again</button>
          )}
          <button id="wa-cancel-btn" className="btn btn-secondary" onClick={onClose}>
            {step === 'done' ? 'Close' : 'Cancel'}
          </button>
        </div>

      </div>
    </div>
  );
}

//  Business Setup Panel 
function BusinessPanel({ biz, onChange }) {
  const fileRef = useRef();
  function handleLogo(e) {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = ev => onChange({ ...biz, logo: ev.target.result });
    r.readAsDataURL(file);
  }
  return (
    <div className="section-card">
      <div className="section-title"><div className="section-title-icon"></div>Business Profile</div>
      <div style={{ display: 'flex', gap: 14, marginBottom: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '0 0 auto' }}>
          <label style={{ marginBottom: 6, display: 'block' }}>Logo</label>
          <div className="logo-upload-area" style={{ width: 96, height: 76 }}>
            <input id="logo-upload" type="file" accept="image/*" ref={fileRef} onChange={handleLogo} />
            {biz.logo
              ? <img src={biz.logo} alt="logo" className="logo-preview" style={{ height: 54, width: '100%' }} />
              : <><div style={{ fontSize: 22 }}></div><div className="logo-upload-text">Upload</div></>
            }
          </div>
          {biz.logo && (
            <button className="btn btn-danger btn-sm"
              style={{ marginTop: 6, width: '100%', justifyContent: 'center' }}
              onClick={() => onChange({ ...biz, logo: '' })}>Remove</button>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div className="form-grid">
            <div className="form-group span-2">
              <label htmlFor="biz-name">Business Name *</label>
              <input id="biz-name" placeholder="e.g. Sharma Hardware Store"
                value={biz.name} onChange={e => onChange({ ...biz, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="biz-phone">Phone</label>
              <input id="biz-phone" placeholder="+91 98765 43210"
                value={biz.phone} onChange={e => onChange({ ...biz, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="biz-email">Email</label>
              <input id="biz-email" type="email" placeholder="shop@email.com"
                value={biz.email} onChange={e => onChange({ ...biz, email: e.target.value })} />
            </div>
          </div>
        </div>
      </div>
      <div className="form-grid three">
        <div className="form-group span-2">
          <label htmlFor="biz-address">Address</label>
          <input id="biz-address" placeholder="Shop No., Street, City, State - PIN"
            value={biz.address} onChange={e => onChange({ ...biz, address: e.target.value })} />
        </div>
        <div className="form-group">
          <label htmlFor="biz-gstin">GSTIN (optional)</label>
          <input id="biz-gstin" placeholder="22AAAAA0000A1Z5" maxLength={15}
            value={biz.gstin} onChange={e => onChange({ ...biz, gstin: e.target.value.toUpperCase() })} />
        </div>
      </div>
    </div>
  );
}

//  Customer & Invoice Details 
function CustomerPanel({ invoice, onChange }) {
  const isEst = invoice.isEstimate;
  const num   = cleanPhone(invoice.customerPhone);
  return (
    <div className="section-card">
      <div className="section-title"><div className="section-title-icon"></div>Customer &amp; Invoice Details</div>

      {/* Estimate toggle */}
      <div className={`estimate-banner${isEst ? ' active' : ''}`}>
        <div style={{ flex: 1 }}>
          <div className="estimate-banner-label">
            {isEst ? ' Estimate Mode  stamp will appear on document' : ' Invoice Mode'}
          </div>
          <div className="estimate-banner-sub">
            {isEst ? 'Prints as ESTIMATE with red watermark.' : 'Toggle to create an estimate instead.'}
          </div>
        </div>
        <label className="toggle">
          <input id="estimate-toggle" type="checkbox" checked={isEst}
            onChange={e => {
              const est = e.target.checked;
              let num = invoice.invoiceNumber || '';
              if (est && num.startsWith('INV-')) num = 'EST-' + num.slice(4);
              if (!est && num.startsWith('EST-')) num = 'INV-' + num.slice(4);
              onChange({ ...invoice, isEstimate: est, invoiceNumber: num });
            }} />
          <span className="toggle-slider" />
        </label>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="inv-number">{isEst ? 'Estimate' : 'Invoice'} Number</label>
          <input id="inv-number" value={invoice.invoiceNumber}
            onChange={e => onChange({ ...invoice, invoiceNumber: e.target.value })} />
        </div>
        <div className="form-group">
          <label htmlFor="inv-date">{isEst ? 'Estimate' : 'Invoice'} Date</label>
          <input id="inv-date" type="date" value={invoice.invoiceDate}
            onChange={e => onChange({ ...invoice, invoiceDate: e.target.value })} />
        </div>
        <div className="form-group">
          <label htmlFor="due-date">{isEst ? 'Valid Till' : 'Due Date'}</label>
          <input id="due-date" type="date" value={invoice.dueDate}
            onChange={e => onChange({ ...invoice, dueDate: e.target.value })} />
        </div>
        <div className="form-group">
          <label htmlFor="cust-phone">
            Customer Phone
            {invoice.customerPhone && (
              <span className={`wa-status ${num ? 'detected' : 'missing'}`} style={{ marginLeft: 8 }}>
                {num ? ' WhatsApp OK' : ' Invalid'}
              </span>
            )}
          </label>
          <input id="cust-phone" placeholder="+91 98765 43210" value={invoice.customerPhone}
            onChange={e => onChange({ ...invoice, customerPhone: e.target.value })} />
        </div>
        <div className="form-group span-2">
          <label htmlFor="cust-name">Customer Name *</label>
          <input id="cust-name" placeholder="Customer / company name" value={invoice.customerName}
            onChange={e => onChange({ ...invoice, customerName: e.target.value })} />
        </div>
        <div className="form-group span-2">
          <label htmlFor="cust-addr">Customer Address</label>
          <input id="cust-addr" placeholder="Address" value={invoice.customerAddress}
            onChange={e => onChange({ ...invoice, customerAddress: e.target.value })} />
        </div>
      </div>
    </div>
  );
}

//  Item Row 
function ItemRow({ item, onChange, onDelete, idx }) {
  const c   = calcItemAmount(item);
  const set = (f, v) => onChange({ ...item, [f]: v });
  return (
    <tr>
      <td style={{ color: '#94a3b8', fontWeight: 600, width: 30 }}>{idx + 1}</td>
      <td style={{ minWidth: 140 }}>
        <input id={`item-name-${item.id}`} placeholder="Item description"
          value={item.name} onChange={e => set('name', e.target.value)} style={{ minWidth: 120 }} />
      </td>
      <td style={{ width: 65 }}>
        <input id={`item-qty-${item.id}`} type="number" min="0" step="any"
          value={item.qty} onChange={e => set('qty', e.target.value)} />
      </td>
      <td style={{ width: 80 }}>
        <select id={`item-unit-${item.id}`} value={item.unit} onChange={e => set('unit', e.target.value)}>
          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </td>
      <td style={{ width: 90 }}>
        <input id={`item-rate-${item.id}`} type="number" min="0" step="any" placeholder="0.00"
          value={item.rate} onChange={e => set('rate', e.target.value)} />
      </td>
      <td style={{ width: 70 }}>
        <input id={`item-disc-${item.id}`} type="number" min="0" max="100" step="any"
          value={item.discount} onChange={e => set('discount', e.target.value)} />
      </td>
      <td style={{ width: 72 }}>
        <select id={`item-gst-${item.id}`} value={item.gst} onChange={e => set('gst', e.target.value)}>
          {GST_OPTIONS.map(g => <option key={g} value={g}>{g === '-' ? '-' : `${g}%`}</option>)}
        </select>
      </td>
      <td className="amount-cell">{formatINR(c.total)}</td>
      <td style={{ textAlign: 'center', width: 36 }}>
        <button id={`del-${item.id}`} className="delete-row-btn" onClick={onDelete} title="Remove"></button>
      </td>
    </tr>
  );
}

//  Items Panel 
function ItemsPanel({ invoice, onChange }) {
  const items = invoice.items || [];
  const upd   = (idx, v) => { const n = [...items]; n[idx] = v; onChange({ ...invoice, items: n }); };
  const del   = idx => onChange({ ...invoice, items: items.filter((_, i) => i !== idx) });
  const add   = () => onChange({ ...invoice, items: [...items, defaultItem()] });
  const { subtotal, totalDisc, totalGST, grand } = calcTotals(items);
  const half  = totalGST / 2;
  return (
    <div className="section-card">
      <div className="section-title"><div className="section-title-icon"></div>Items</div>
      <div className="items-table-wrapper">
        <table className="items-table">
          <thead>
            <tr>
              <th>#</th><th>Item Description</th><th>Qty</th><th>Unit</th>
              <th>Rate ()</th><th>Disc%</th><th>GST%</th><th>Amount</th>
              <th style={{ textAlign: 'center' }}>Del</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <ItemRow key={item.id} item={item} idx={idx}
                onChange={v => upd(idx, v)} onDelete={() => del(idx)} />
            ))}
            {items.length === 0 && (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontStyle: 'italic' }}>
                No items yet.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="add-item-row">
        <button id="add-item-btn" className="btn btn-secondary btn-sm" onClick={add}> Add Item</button>
      </div>
      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
        <div className="gst-toggle-row" style={{ width: '100%', maxWidth: 340 }}>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>GST Type:</span>
          <div className="toggle-wrap">
            <span style={{ opacity: invoice.igstMode ? 0.5 : 1 }}>CGST + SGST</span>
            <label className="toggle">
              <input id="gst-toggle" type="checkbox" checked={invoice.igstMode}
                onChange={e => onChange({ ...invoice, igstMode: e.target.checked })} />
              <span className="toggle-slider" />
            </label>
            <span style={{ opacity: invoice.igstMode ? 1 : 0.5 }}>IGST</span>
          </div>
        </div>
        <div className="totals-box">
          <div className="totals-row"><span className="totals-label">Subtotal</span><span className="totals-val">{formatINR(subtotal)}</span></div>
          {totalDisc > 0 && <div className="totals-row" style={{ color: '#ef4444' }}><span className="totals-label">Discount</span><span className="totals-val">{formatINR(totalDisc)}</span></div>}
          {!invoice.igstMode ? <>
            <div className="totals-row"><span className="totals-label">CGST</span><span className="totals-val">{formatINR(half)}</span></div>
            <div className="totals-row"><span className="totals-label">SGST</span><span className="totals-val">{formatINR(half)}</span></div>
          </> : <div className="totals-row"><span className="totals-label">IGST</span><span className="totals-val">{formatINR(totalGST)}</span></div>}
          <div className="totals-row grand"><span>Grand Total</span><span>{formatINR(grand)}</span></div>
        </div>
        <div className="amount-words">{amountToWords(grand)}</div>
      </div>
    </div>
  );
}

//  Payment & Notes 
function PaymentPanel({ invoice, onChange }) {
  return (
    <div className="section-card">
      <div className="section-title"><div className="section-title-icon"></div>Payment &amp; Notes</div>
      <div className="form-grid full">
        <div className="form-group">
          <label>Payment Mode</label>
          <div className="payment-modes">
            {PAYMENT_MODES.map(m => (
              <button key={m} id={`payment-${m.toLowerCase()}`}
                className={`payment-chip ${invoice.paymentMode === m ? 'active' : ''}`}
                onClick={() => onChange({ ...invoice, paymentMode: m })}>
                {m === 'Cash' ? ' ' : m === 'UPI' ? ' ' : m === 'Card' ? ' ' : ' '}{m}
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="notes">Terms &amp; Notes</label>
          <textarea id="notes" placeholder="e.g. Goods once sold will not be returned."
            value={invoice.notes} onChange={e => onChange({ ...invoice, notes: e.target.value })} rows={3} />
        </div>
      </div>
    </div>
  );
}

//  Preview Modal 
function PreviewModal({ biz, invoice, onClose }) {
  const invoiceRef  = useRef();
  const [showWA, setShowWA] = useState(false);
  const isEst = invoice.isEstimate;

  return (
    <>
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && !showWA && onClose()}>
        <div className="modal-box">
          <div className="modal-header no-print">
            <span className="modal-title">{isEst ? ' Estimate Preview' : ' Invoice Preview'}</span>
            <button id="modal-close" className="modal-close" onClick={onClose}></button>
          </div>

          <div className="modal-body" ref={invoiceRef}>
            <InvoiceDocument biz={biz} invoice={invoice} forPdf={false} />
          </div>

          <div className="modal-actions no-print">
            {/* WhatsApp  always available */}
            <button id="modal-wa-btn" className="btn btn-whatsapp btn-lg"
              onClick={() => setShowWA(true)}>
               Send PDF on WhatsApp
            </button>

            {/* Print / Download PDF */}
            <button id="modal-pdf-btn"
              className={`btn btn-lg ${isEst ? 'btn-estimate' : 'btn-primary'}`}
              onClick={() => window.print()}>
              {isEst ? ' Print Estimate' : ' Download PDF'}
            </button>

            <button id="modal-close-btn" className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>

      {/* WhatsApp Modal */}
      {showWA && (
        <WhatsAppModal
          biz={biz}
          invoice={invoice}
          pdfRef={invoiceRef}
          onClose={() => setShowWA(false)}
        />
      )}
    </>
  );
}

//  Main App 
export default function App() {
  const [biz,         setBiz]        = useState(() => loadLS('biz', { name:'', phone:'', email:'', address:'', gstin:'', logo:'' }));
  const [invoiceNum,  setInvoiceNum] = useState(() => loadLS('invoiceNum', 1));
  const [invoice,     setInvoice]    = useState(() => loadLS('draft', defaultInvoice(loadLS('invoiceNum', 1))));
  const [showPreview, setShowPreview]= useState(false);
  const [showWA,      setShowWA]     = useState(false);
  const [toast,       setToast]      = useState(null);

  // Hidden A4-width div for PDF capture from bottom bar (without opening modal)
  const hiddenRef = useRef();

  useEffect(() => { saveLS('draft', invoice); }, [invoice]);
  useEffect(() => { saveLS('biz',   biz);     }, [biz]);

  const showToast = msg => { setToast(null); setTimeout(() => setToast(msg), 10); };

  function newInvoice() {
    const next = invoiceNum + 1;
    setInvoiceNum(next); saveLS('invoiceNum', next);
    const fresh = defaultInvoice(next);
    setInvoice(fresh); saveLS('draft', fresh);
    showToast('New invoice started');
  }
  function saveDraft() {
    saveLS('draft', invoice); saveLS('biz', biz);
    showToast('Draft saved!');
  }

  const isEst = invoice.isEstimate;

  return (
    <>
      {/*  Top Bar  */}
      <div className="topbar no-print">
        <div className="topbar-logo">
          <div className="topbar-logo-icon"></div>
          <div>
            <div className="topbar-title">InvoiceForge</div>
            <div className="topbar-sub">{isEst ? ' Estimate Mode Active' : 'Professional Invoice Generator'}</div>
          </div>
        </div>
        <div className="topbar-actions">
          <button id="save-draft-btn" className="btn btn-ghost btn-sm" onClick={saveDraft}> Save</button>
          <button id="new-invoice-btn" className="btn btn-ghost btn-sm" onClick={newInvoice}> New</button>
        </div>
      </div>

      {/*  App Shell  */}
      <div className="app-shell">
        {/* LEFT: Editor */}
        <div className="editor-panel no-print">
          <BusinessPanel biz={biz} onChange={setBiz} />
          <CustomerPanel invoice={invoice} onChange={setInvoice} />
          <ItemsPanel    invoice={invoice} onChange={setInvoice} />
          <PaymentPanel  invoice={invoice} onChange={setInvoice} />
        </div>

        {/* RIGHT: Live preview */}
        <div className="preview-panel no-print">
          <div className="preview-panel-label">
            <span></span>
            {isEst ? 'Estimate Preview' : 'Live Invoice Preview'}
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#64748b', fontStyle: 'italic' }}>Real-time</span>
          </div>
          <div id="inline-preview" style={{ overflowX: 'hidden' }}>
            <div style={{ transform: 'scale(0.76)', transformOrigin: 'top left', width: '132%' }}>
              <InvoiceDocument biz={biz} invoice={invoice} />
            </div>
          </div>
        </div>
      </div>

      {/*  Hidden A4 render target for PDF (bottom-bar WhatsApp)  */}
      <div
        ref={hiddenRef}
        aria-hidden="true"
        style={{
          position: 'fixed', left: '-300%', top: 0,
          width: '794px', background: 'white',
          pointerEvents: 'none', zIndex: -1,
        }}
      >
        <InvoiceDocument biz={biz} invoice={invoice} forPdf={true} />
      </div>

      {/*  Bottom Actions  */}
      <div className="bottom-actions no-print">
        <button id="preview-btn" className={`btn btn-lg ${isEst ? 'btn-estimate' : 'btn-primary'}`}
          onClick={() => setShowPreview(true)}>
           {isEst ? 'Preview Estimate' : 'Preview Invoice'}
        </button>

        {/* WhatsApp  always clickable, opens dialog */}
        <button id="wa-bottom-btn" className="btn btn-whatsapp btn-lg"
          onClick={() => setShowWA(true)}>
           Send PDF on WhatsApp
        </button>

        <button id="print-btn" className="btn btn-navy btn-lg"
          onClick={() => { setShowPreview(true); setTimeout(window.print, 500); }}>
           {isEst ? 'Print Estimate' : 'Download PDF'}
        </button>

        <button id="new-btn"  className="btn btn-secondary btn-lg" onClick={newInvoice}> New Invoice</button>
        <button id="save-btn" className="btn btn-secondary btn-lg" onClick={saveDraft}> Save Draft</button>
      </div>

      {/*  Preview Modal  */}
      {showPreview && (
        <PreviewModal biz={biz} invoice={invoice} onClose={() => setShowPreview(false)} />
      )}

      {/*  WhatsApp from bottom bar (uses hidden div)  */}
      {showWA && !showPreview && (
        <WhatsAppModal
          biz={biz}
          invoice={invoice}
          pdfRef={hiddenRef}
          onClose={() => setShowWA(false)}
        />
      )}

      {/*  Toast  */}
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </>
  );
}
