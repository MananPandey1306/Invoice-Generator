import { calcItemAmount, calcTotals, formatINR, amountToWords } from '../utils';

export default function TemplateGeometric({ biz, invoice, forPdf = false }) {
  const isEstimate = invoice.isEstimate || false;
  const paidItems = (invoice.items || []).map(i => i.free ? { ...i, rate: '0', discount: '0', gst: '0' } : i);
  const { subtotal, totalDisc, totalGST, grand } = calcTotals(paidItems);
  const half = totalGST / 2;
  const docTitle = isEstimate ? 'ESTIMATE' : 'INVOICE';

  return (
    <div className="tgeo-wrap" style={forPdf ? { fontSize: '11px' } : {}}>
      {isEstimate && <div className="est-stamp" aria-hidden="true">ESTIMATE</div>}

      {/* Teal top-right triangle */}
      <div className="tgeo-corner-tr" aria-hidden="true" />
      {/* Pink bottom-left triangle */}
      <div className="tgeo-corner-bl" aria-hidden="true" />

      {/* Header */}
      <div className="tgeo-header">
        <div className="tgeo-title">{docTitle}</div>
        {biz.logo && <img src={biz.logo} alt="logo" className="tgeo-logo" />}
      </div>

      {/* Meta + parties */}
      <div className="tgeo-meta-row">
        <div className="tgeo-meta-left">
          <div className="tgeo-meta-item">
            <div className="tgeo-meta-label">Date Issued:</div>
            <div className="tgeo-meta-val">{invoice.invoiceDate || ''}</div>
          </div>
          <div className="tgeo-meta-item">
            <div className="tgeo-meta-label">Invoice No:</div>
            <div className="tgeo-meta-val tgeo-bold">{invoice.invoiceNumber || 'INV-0001'}</div>
          </div>
          {invoice.dueDate && (
            <div className="tgeo-meta-item">
              <div className="tgeo-meta-label">{isEstimate ? 'Valid Till' : 'Due Date'}:</div>
              <div className="tgeo-meta-val">{invoice.dueDate}</div>
            </div>
          )}
          {invoice.paymentMode && (
            <div className="tgeo-meta-item">
              <div className="tgeo-meta-label">Payment:</div>
              <div className="tgeo-meta-val">{invoice.paymentMode}</div>
            </div>
          )}
        </div>
        <div className="tgeo-meta-right">
          <div className="tgeo-meta-label">Issued to:</div>
          <div className="tgeo-party-name">{invoice.customerName || 'Customer Name'}</div>
          {invoice.customerAddress && <div className="tgeo-party-detail">{invoice.customerAddress}</div>}
          {invoice.customerPhone   && <div className="tgeo-party-detail">{invoice.customerPhone}</div>}
          <div style={{ marginTop: 12 }}>
            <div className="tgeo-meta-label">From:</div>
            <div className="tgeo-party-name">{biz.name || 'Your Company'}</div>
            {biz.address && <div className="tgeo-party-detail">{biz.address}</div>}
            {biz.gstin   && <div className="tgeo-party-detail">GSTIN: {biz.gstin}</div>}
          </div>
        </div>
      </div>

      {/* Items table */}
      <div className="tgeo-table-wrap">
        <table className="tgeo-table">
          <thead>
            <tr>
              <th className="tgeo-th" style={{ width: 40, textAlign: 'center' }}>NO</th>
              <th className="tgeo-th">DESCRIPTION</th>
              <th className="tgeo-th tgeo-r">QTY</th>
              <th className="tgeo-th tgeo-r">UNIT</th>
              <th className="tgeo-th tgeo-r">PRICE</th>
              <th className="tgeo-th tgeo-r">DISC%</th>
              <th className="tgeo-th tgeo-r">GST%</th>
              <th className="tgeo-th tgeo-r">SUBTOTAL</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((item, idx) => {
              const effItem = item.free ? { ...item, rate: '0', discount: '0', gst: '0' } : item;
              const c = calcItemAmount(effItem);
              return (
                <tr key={item.id} className="tgeo-tr">
                  <td className="tgeo-td" style={{ textAlign: 'center', color: '#888' }}>{idx + 1}</td>
                  <td className="tgeo-td">{item.name || ''}</td>
                  <td className="tgeo-td tgeo-r">{item.qty}</td>
                  <td className="tgeo-td tgeo-r">{item.unit}</td>
                  <td className="tgeo-td tgeo-r">{item.free ? '—' : formatINR(parseFloat(item.rate) || 0)}</td>
                  <td className="tgeo-td tgeo-r">{item.free ? '—' : `${item.discount || 0}%`}</td>
                  <td className="tgeo-td tgeo-r">{item.free ? '—' : `${item.gst || 0}%`}</td>
                  <td className="tgeo-td tgeo-r tgeo-bold" style={item.free ? { color: '#10b981' } : {}}>{item.free ? 'FREE' : formatINR(c.total)}</td>
                </tr>
              );
            })}
            {!(invoice.items || []).length && (
              <tr><td colSpan={8} className="tgeo-td" style={{ textAlign:'center', color:'#bbb', fontStyle:'italic', padding:'18px' }}>No items added</td></tr>
            )}
            {/* Subtotal rows */}
            {totalDisc > 0 && (
              <tr className="tgeo-total-row">
                <td colSpan={7} className="tgeo-td tgeo-r" style={{ fontWeight: 600 }}>DISCOUNT</td>
                <td className="tgeo-td tgeo-r" style={{ color: '#e53e3e', fontWeight: 700 }}>− {formatINR(totalDisc)}</td>
              </tr>
            )}
            {!invoice.igstMode ? (<>
              <tr className="tgeo-total-row">
                <td colSpan={7} className="tgeo-td tgeo-r" style={{ fontWeight: 600 }}>CGST</td>
                <td className="tgeo-td tgeo-r" style={{ fontWeight: 700 }}>{formatINR(half)}</td>
              </tr>
              <tr className="tgeo-total-row">
                <td colSpan={7} className="tgeo-td tgeo-r" style={{ fontWeight: 600 }}>SGST</td>
                <td className="tgeo-td tgeo-r" style={{ fontWeight: 700 }}>{formatINR(half)}</td>
              </tr>
            </>) : (
              <tr className="tgeo-total-row">
                <td colSpan={7} className="tgeo-td tgeo-r" style={{ fontWeight: 600 }}>IGST</td>
                <td className="tgeo-td tgeo-r" style={{ fontWeight: 700 }}>{formatINR(totalGST)}</td>
              </tr>
            )}
            <tr className="tgeo-grand-row">
              <td colSpan={7} className="tgeo-td tgeo-r">GRAND TOTAL</td>
              <td className="tgeo-td tgeo-r tgeo-grand-val">{formatINR(grand)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="tgeo-words">{amountToWords(grand)}</div>

      {/* Footer */}
      <div className="tgeo-footer">
        <div className="tgeo-footer-left">
          {invoice.notes && (
            <>
              <div className="tgeo-footer-label">Note:</div>
              <div className="tgeo-footer-text">{invoice.notes}</div>
            </>
          )}
          {biz.gstin && <div className="tgeo-footer-text" style={{ marginTop: 6 }}>GSTIN: {biz.gstin}</div>}
        </div>
        <div className="tgeo-footer-right">
          <div className="tgeo-sig-area">
            {biz.stampImg
              ? <img src={biz.stampImg} alt="stamp" className="tgeo-stamp-img" />
              : <svg width="90" height="40" viewBox="0 0 90 40" fill="none" style={{ fontFamily: 'cursive', overflow:'visible' }}>
                  <text x="5" y="35" fill="#1a2744" fontSize="28" fontFamily="Georgia, serif" fontStyle="italic">
                    {biz.signName || biz.name || 'Sign'}
                  </text>
                </svg>
            }
          </div>
          <div className="tgeo-sig-line" />
          <div className="tgeo-sig-name">{biz.signName || biz.name || 'Authorised Signatory'}</div>
        </div>
      </div>
    </div>
  );
}
