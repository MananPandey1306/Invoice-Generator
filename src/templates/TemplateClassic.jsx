import { calcItemAmount, calcTotals, formatINR, amountToWords } from '../utils';

export default function TemplateClassic({ biz, invoice, forPdf = false }) {
  const isEstimate = invoice.isEstimate || false;
  const { subtotal, totalDisc, totalGST, grand } = calcTotals(invoice.items || []);
  const half = totalGST / 2;
  const docTitle = isEstimate ? 'ESTIMATE' : 'INVOICE';

  const s = forPdf ? { fontSize: '11.5px' } : {};

  return (
    <div className="inv-wrap" style={{ position: 'relative', overflow: 'hidden', ...s }}>

      {isEstimate && (
        <div className="est-stamp" aria-hidden="true">ESTIMATE</div>
      )}

      {/* HEADER */}
      <div className="inv-header">
        <div className="inv-header-left">
          <div className="inv-deco-slash" aria-hidden="true" />
          {biz.logo && <img src={biz.logo} alt="logo" className="inv-logo-img" />}
          <div className="inv-company-name">
            {biz.name ? biz.name.toUpperCase() : 'COMPANY\nNAME'}
          </div>
          {biz.address && <div className="inv-company-sub">{biz.address}</div>}
        </div>
        <div className="inv-header-right">
          <div className={`inv-doc-title${isEstimate ? ' inv-doc-title-est' : ''}`}>
            {docTitle}
          </div>
          <div className="inv-biz-contacts">
            {biz.phone && <span> {biz.phone}</span>}
            {biz.email && <span> {biz.email}</span>}
          </div>
        </div>
      </div>

      {/* META BAR */}
      <div className="inv-meta-bar">
        <div>
          <span className="inv-meta-bold">{docTitle}#&nbsp;&nbsp;</span>
          <span className="inv-meta-val">{invoice.invoiceNumber || 'INV-0001'}</span>
        </div>
        <div className="inv-meta-right">
          <span className="inv-meta-bold">Date: </span>
          <span className="inv-meta-val">{invoice.invoiceDate || ''}</span>
          {invoice.dueDate && <>
            &emsp;
            <span className="inv-meta-bold">Due: </span>
            <span className="inv-meta-val">{invoice.dueDate}</span>
          </>}
        </div>
      </div>

      {/* BILL TO */}
      <div className="inv-bill-section">
        <div>
          <div className="inv-bill-to-label">
            {isEstimate ? 'estimate to' : 'invoice to'} :{' '}
            <strong className="inv-bill-to-name">
              {invoice.customerName || 'Customer Name'}
            </strong>
          </div>
          {invoice.customerPhone  && <div className="inv-bill-detail"> {invoice.customerPhone}</div>}
          {invoice.customerAddress && <div className="inv-bill-detail">{invoice.customerAddress}</div>}
        </div>
        <div className="inv-bill-right">
          <div className="inv-payment-badge">
            {invoice.paymentMode === 'Cash' ? '' :
             invoice.paymentMode === 'UPI'  ? '' :
             invoice.paymentMode === 'Card' ? '' : ''}
            {' '}{invoice.paymentMode || 'Cash'}
          </div>
          {biz.gstin && <div className="inv-gstin-text">GSTIN: {biz.gstin}</div>}
        </div>
      </div>

      {/* ITEMS TABLE */}
      <table className="inv-table">
        <thead>
          <tr>
            <th className="inv-th" style={{ width: 38, textAlign: 'center' }}>SL.</th>
            <th className="inv-th">ITEM DESCRIPTION</th>
            <th className="inv-th inv-th-r">QTY</th>
            <th className="inv-th inv-th-r">UNIT</th>
            <th className="inv-th inv-th-r">PRICE</th>
            <th className="inv-th inv-th-r">DISC%</th>
            <th className="inv-th inv-th-r">GST%</th>
            <th className="inv-th inv-th-r">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {(invoice.items || []).map((item, idx) => {
            const c = calcItemAmount(item);
            return (
              <tr key={item.id} className={idx % 2 === 1 ? 'inv-row-alt' : ''}>
                <td className="inv-td" style={{ textAlign: 'center', fontWeight: 800, color: '#222' }}>{idx + 1}</td>
                <td className="inv-td" style={{ fontWeight: 500 }}>{item.name || ''}</td>
                <td className="inv-td inv-td-r">{item.qty}</td>
                <td className="inv-td inv-td-r">{item.unit}</td>
                <td className="inv-td inv-td-r">{formatINR(parseFloat(item.rate) || 0)}</td>
                <td className="inv-td inv-td-r">{item.discount || 0}%</td>
                <td className="inv-td inv-td-r">{item.gst || 0}%</td>
                <td className="inv-td inv-td-r" style={{ fontWeight: 700, color: '#111' }}>{formatINR(c.total)}</td>
              </tr>
            );
          })}
          {(invoice.items || []).length === 0 && (
            <tr>
              <td colSpan={8} className="inv-td"
                style={{ textAlign: 'center', color: '#bbb', fontStyle: 'italic', padding: '20px' }}>
                No items added
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* TOTALS */}
      <div className="inv-totals-section">
        <div className="inv-totals-box">
          <div className="inv-totals-row">
            <span>SUB TOTAL</span><span>{formatINR(subtotal)}</span>
          </div>
          {totalDisc > 0 && (
            <div className="inv-totals-row" style={{ color: '#e53e3e' }}>
              <span>DISCOUNT</span><span> {formatINR(totalDisc)}</span>
            </div>
          )}
          {!invoice.igstMode ? (<>
            <div className="inv-totals-row"><span>CGST</span><span>{formatINR(half)}</span></div>
            <div className="inv-totals-row"><span>SGST</span><span>{formatINR(half)}</span></div>
          </>) : (
            <div className="inv-totals-row"><span>IGST</span><span>{formatINR(totalGST)}</span></div>
          )}
          <div className="inv-totals-grand">
            <span>GRAND TOTAL</span><span>{formatINR(grand)}</span>
          </div>
        </div>
      </div>

      {/* AMOUNT IN WORDS */}
      <div className="inv-amount-words">{amountToWords(grand)}</div>

      {/* THANK YOU */}
      <div className="inv-thankyou">
        {isEstimate ? ' This is an estimate only — not a final invoice.' : 'Thank you for business with us!'}
      </div>

      {/* FOOTER */}
      <div className="inv-footer">
        <div className="inv-footer-left">
          {invoice.notes && (
            <div style={{ marginBottom: 8 }}>
              <div className="inv-footer-heading">Terms &amp; Conditions</div>
              <div className="inv-footer-text">{invoice.notes}</div>
            </div>
          )}
          {invoice.paymentMode && (
            <div>
              <div className="inv-footer-heading">Payment Method</div>
              <div className="inv-footer-text">{invoice.paymentMode}</div>
            </div>
          )}
        </div>
        <div className="inv-footer-right">
          <div className="inv-auth-label">Authorised Sign</div>
          <div className="inv-auth-area">
            {biz.stampImg
              ? <img src={biz.stampImg} alt="signature" className="inv-stamp-img" />
              : <svg width="90" height="36" viewBox="0 0 90 36" fill="none">
                  <line x1="5" y1="33" x2="80" y2="6" stroke="#0ec8c8" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="18" y1="33" x2="88" y2="9" stroke="#0ec8c8" strokeWidth="1.2" strokeLinecap="round" opacity="0.45"/>
                </svg>
            }
          </div>
          <div className="inv-sign-bar" />
          <div className="inv-sign-name">{biz.signName || biz.name || ''}</div>
        </div>
      </div>

      {/* Bottom-right teal corner */}
      <div className="inv-corner-br" />
    </div>
  );
}
