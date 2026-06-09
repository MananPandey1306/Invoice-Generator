import { calcItemAmount, calcTotals, formatINR, amountToWords } from '../utils';

export default function TemplateMinimal({ biz, invoice, forPdf = false }) {
  const isEstimate = invoice.isEstimate || false;
  const { subtotal, totalDisc, totalGST, grand } = calcTotals(invoice.items || []);
  const half = totalGST / 2;
  const docTitle = isEstimate ? 'Estimate' : 'Invoice';

  return (
    <div className="tmin-wrap" style={forPdf ? { fontSize: '11px' } : {}}>
      {isEstimate && <div className="est-stamp" aria-hidden="true">ESTIMATE</div>}

      {/* Header: big title left, meta right */}
      <div className="tmin-header">
        <div className="tmin-title">{docTitle}</div>
        <div className="tmin-meta">
          <div className="tmin-meta-row">
            <span className="tmin-meta-label">Date</span>
            <span className="tmin-meta-val">{invoice.invoiceDate || ''}</span>
          </div>
          <div className="tmin-meta-row">
            <span className="tmin-meta-label">{isEstimate ? 'Est. No.' : 'Invoice No.'}</span>
            <span className="tmin-meta-val tmin-bold">{invoice.invoiceNumber || 'INV-0001'}</span>
          </div>
          {invoice.dueDate && (
            <div className="tmin-meta-row">
              <span className="tmin-meta-label">{isEstimate ? 'Valid Till' : 'Due Date'}</span>
              <span className="tmin-meta-val">{invoice.dueDate}</span>
            </div>
          )}
        </div>
      </div>

      <hr className="tmin-hr" />

      {/* Billed to */}
      <div className="tmin-bill-row">
        <div className="tmin-bill-to">
          <div className="tmin-section-label">Billed to:</div>
          <div className="tmin-cust-name">{invoice.customerName || 'Customer Name'}</div>
          {invoice.customerPhone   && <div className="tmin-detail">{invoice.customerPhone}</div>}
          {invoice.customerAddress && <div className="tmin-detail">{invoice.customerAddress}</div>}
        </div>
        <div className="tmin-bill-from">
          <div className="tmin-section-label">From:</div>
          <div className="tmin-cust-name">{biz.name || 'Your Company'}</div>
          {biz.phone   && <div className="tmin-detail">{biz.phone}</div>}
          {biz.address && <div className="tmin-detail">{biz.address}</div>}
          {biz.email   && <div className="tmin-detail">{biz.email}</div>}
          {biz.gstin   && <div className="tmin-detail">GSTIN: {biz.gstin}</div>}
        </div>
      </div>

      <hr className="tmin-hr" />

      {/* Items table */}
      <table className="tmin-table">
        <thead>
          <tr>
            <th className="tmin-th">Description</th>
            <th className="tmin-th tmin-r">Qty</th>
            <th className="tmin-th tmin-r">Unit</th>
            <th className="tmin-th tmin-r">Rate</th>
            <th className="tmin-th tmin-r">Disc%</th>
            <th className="tmin-th tmin-r">GST%</th>
            <th className="tmin-th tmin-r">Amount</th>
          </tr>
        </thead>
        <tbody>
          {(invoice.items || []).map((item, idx) => {
            const c = calcItemAmount(item);
            return (
              <tr key={item.id} className="tmin-tr">
                <td className="tmin-td">{item.name || ''}</td>
                <td className="tmin-td tmin-r">{item.qty}</td>
                <td className="tmin-td tmin-r">{item.unit}</td>
                <td className="tmin-td tmin-r">{formatINR(parseFloat(item.rate) || 0)}</td>
                <td className="tmin-td tmin-r">{item.discount || 0}%</td>
                <td className="tmin-td tmin-r">{item.gst || 0}%</td>
                <td className="tmin-td tmin-r tmin-bold">{formatINR(c.total)}</td>
              </tr>
            );
          })}
          {!(invoice.items || []).length && (
            <tr><td colSpan={7} className="tmin-td tmin-empty">No items added</td></tr>
          )}
        </tbody>
      </table>

      {/* Totals */}
      <div className="tmin-totals-wrap">
        <div className="tmin-totals">
          <div className="tmin-totals-row"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
          {totalDisc > 0 && (
            <div className="tmin-totals-row tmin-disc"><span>Discount</span><span>− {formatINR(totalDisc)}</span></div>
          )}
          {!invoice.igstMode ? (<>
            <div className="tmin-totals-row"><span>CGST</span><span>{formatINR(half)}</span></div>
            <div className="tmin-totals-row"><span>SGST</span><span>{formatINR(half)}</span></div>
          </>) : (
            <div className="tmin-totals-row"><span>IGST</span><span>{formatINR(totalGST)}</span></div>
          )}
          <div className="tmin-totals-grand"><span>Total</span><span>{formatINR(grand)}</span></div>
        </div>
      </div>

      <div className="tmin-words">{amountToWords(grand)}</div>

      <hr className="tmin-hr" />

      {/* Footer */}
      <div className="tmin-footer">
        <div className="tmin-footer-left">
          {invoice.paymentMode && (
            <div className="tmin-footer-block">
              <div className="tmin-footer-heading">Payment Information</div>
              <div className="tmin-footer-text">{invoice.paymentMode}</div>
              {biz.gstin && <div className="tmin-footer-text">GSTIN: {biz.gstin}</div>}
            </div>
          )}
          {invoice.notes && (
            <div className="tmin-footer-block">
              <div className="tmin-footer-heading">Note</div>
              <div className="tmin-footer-text">{invoice.notes}</div>
            </div>
          )}
        </div>
        <div className="tmin-footer-right">
          <div className="tmin-sig-area">
            {biz.stampImg
              ? <img src={biz.stampImg} alt="stamp" className="tmin-stamp-img" />
              : <svg width="90" height="36" viewBox="0 0 90 36" fill="none">
                  <line x1="5" y1="33" x2="80" y2="6" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="18" y1="33" x2="88" y2="9" stroke="#444" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
                </svg>
            }
          </div>
          <div className="tmin-sig-bar" />
          <div className="tmin-sig-name">{biz.signName || biz.name || ''}</div>
          <div className="tmin-sig-role">Authorised Signatory</div>
        </div>
      </div>
    </div>
  );
}
