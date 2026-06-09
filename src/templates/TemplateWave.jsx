import { calcItemAmount, calcTotals, formatINR, amountToWords } from '../utils';

export default function TemplateWave({ biz, invoice, forPdf = false }) {
  const isEstimate = invoice.isEstimate || false;
  const { subtotal, totalDisc, totalGST, grand } = calcTotals(invoice.items || []);
  const half = totalGST / 2;
  const docTitle = isEstimate ? 'ESTIMATE' : 'INVOICE';

  return (
    <div className="tw-wrap" style={forPdf ? { fontSize: '11px' } : {}}>
      {isEstimate && <div className="est-stamp" aria-hidden="true">ESTIMATE</div>}

      {/* Header row: logo | invoice number */}
      <div className="tw-header">
        <div className="tw-header-left">
          {biz.logo
            ? <img src={biz.logo} alt="logo" className="tw-logo-img" />
            : <div className="tw-logo-ph">YOUR<br />LOGO</div>}
        </div>
        <div className="tw-header-right">
          <span className="tw-inv-no">NO. {invoice.invoiceNumber || '000001'}</span>
        </div>
      </div>

      {/* Big title */}
      <div className="tw-title">{docTitle}</div>

      {/* Date */}
      <div className="tw-date">
        <strong>Date:</strong>&nbsp; {invoice.invoiceDate || ''}
        {invoice.dueDate && <>&emsp;<strong>Due:</strong>&nbsp; {invoice.dueDate}</>}
      </div>

      {/* Divider */}
      <div className="tw-divider" />

      {/* Parties */}
      <div className="tw-parties">
        <div className="tw-party">
          <div className="tw-party-label">Billed to:</div>
          <div className="tw-party-name">{invoice.customerName || 'Customer Name'}</div>
          {invoice.customerAddress && <div className="tw-party-detail">{invoice.customerAddress}</div>}
          {invoice.customerPhone   && <div className="tw-party-detail">{invoice.customerPhone}</div>}
        </div>
        <div className="tw-party">
          <div className="tw-party-label">From:</div>
          <div className="tw-party-name">{biz.name || 'Your Company'}</div>
          {biz.address && <div className="tw-party-detail">{biz.address}</div>}
          {biz.email   && <div className="tw-party-detail">{biz.email}</div>}
          {biz.phone   && <div className="tw-party-detail">{biz.phone}</div>}
          {biz.gstin   && <div className="tw-party-detail">GSTIN: {biz.gstin}</div>}
        </div>
      </div>

      {/* Table */}
      <table className="tw-table">
        <thead>
          <tr>
            <th className="tw-th">#</th>
            <th className="tw-th">Item</th>
            <th className="tw-th tw-r">Quantity</th>
            <th className="tw-th tw-r">Unit</th>
            <th className="tw-th tw-r">Price</th>
            <th className="tw-th tw-r">Disc%</th>
            <th className="tw-th tw-r">GST%</th>
            <th className="tw-th tw-r">Amount</th>
          </tr>
        </thead>
        <tbody>
          {(invoice.items || []).map((item, idx) => {
            const c = calcItemAmount(item);
            return (
              <tr key={item.id} className="tw-tr">
                <td className="tw-td tw-muted">{idx + 1}</td>
                <td className="tw-td">{item.name || ''}</td>
                <td className="tw-td tw-r">{item.qty}</td>
                <td className="tw-td tw-r">{item.unit}</td>
                <td className="tw-td tw-r">{formatINR(parseFloat(item.rate) || 0)}</td>
                <td className="tw-td tw-r">{item.discount || 0}%</td>
                <td className="tw-td tw-r">{item.gst || 0}%</td>
                <td className="tw-td tw-r tw-bold">{formatINR(c.total)}</td>
              </tr>
            );
          })}
          {!(invoice.items || []).length && (
            <tr><td colSpan={8} className="tw-td tw-empty">No items added</td></tr>
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div className="tw-totals-wrap">
        <div className="tw-totals">
          <div className="tw-totals-row"><span>Sub Total</span><span>{formatINR(subtotal)}</span></div>
          {totalDisc > 0 && <div className="tw-totals-row tw-disc"><span>Discount</span><span>− {formatINR(totalDisc)}</span></div>}
          {!invoice.igstMode ? (<>
            <div className="tw-totals-row"><span>CGST</span><span>{formatINR(half)}</span></div>
            <div className="tw-totals-row"><span>SGST</span><span>{formatINR(half)}</span></div>
          </>) : (
            <div className="tw-totals-row"><span>IGST</span><span>{formatINR(totalGST)}</span></div>
          )}
          <div className="tw-totals-grand">
            <span>Total</span><span>{formatINR(grand)}</span>
          </div>
        </div>
      </div>

      <div className="tw-words">{amountToWords(grand)}</div>

      {/* Payment + Notes */}
      {invoice.paymentMode && (
        <div className="tw-payment"><strong>Payment method:</strong>&nbsp; {invoice.paymentMode}</div>
      )}
      {invoice.notes && (
        <div className="tw-note"><strong>Note:</strong>&nbsp; {invoice.notes}</div>
      )}

      {/* Signature */}
      <div className="tw-sig-row">
        <div />
        <div className="tw-sig-box">
          <div className="tw-sig-area">
            {biz.stampImg
              ? <img src={biz.stampImg} alt="stamp" className="tw-stamp-img" />
              : <svg width="90" height="36" viewBox="0 0 90 36" fill="none">
                  <line x1="5" y1="33" x2="80" y2="6" stroke="#333" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="18" y1="33" x2="88" y2="9" stroke="#555" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
                </svg>
            }
          </div>
          <div className="tw-sig-line" />
          <div className="tw-sig-name">{biz.signName || biz.name || 'Authorised Signature'}</div>
        </div>
      </div>

      {/* Wave footer */}
      <div className="tw-wave-footer" aria-hidden="true">
        <svg viewBox="0 0 800 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" style={{ display:'block', width:'100%', height:'100%' }}>
          <path d="M0,70 C200,10 400,110 600,50 C700,20 780,60 800,70 L800,120 L0,120 Z" fill="#d8d8d8" opacity="0.6"/>
          <path d="M0,95 C180,55 380,115 560,75 C680,50 760,80 800,95 L800,120 L0,120 Z" fill="#444" opacity="0.85"/>
        </svg>
      </div>
    </div>
  );
}
