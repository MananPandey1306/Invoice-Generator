import { calcItemAmount, calcTotals, formatINR, amountToWords } from '../utils';

export default function TemplateMono({ biz, invoice, forPdf = false }) {
  const isEstimate = invoice.isEstimate || false;
  const paidItems = (invoice.items || []).map(i => i.free ? { ...i, rate: '0', discount: '0', gst: '0' } : i);
  const { subtotal, totalDisc, totalGST, grand } = calcTotals(paidItems);
  const half = totalGST / 2;
  const docTitle = isEstimate ? 'ESTIMATE' : 'INVOICE';

  return (
    <div className="tmono-wrap" style={forPdf ? { fontSize: '11px' } : {}}>
      {isEstimate && <div className="est-stamp" aria-hidden="true">ESTIMATE</div>}

      {/* Header */}
      <div className="tmono-header">
        <div className="tmono-header-left">
          <div className="tmono-title">{docTitle}</div>
          <div className="tmono-meta">
            <div className="tmono-meta-row">
              <span className="tmono-meta-k">Invoice no:</span>
              <span className="tmono-meta-v">{invoice.invoiceNumber || 'INV-0001'}</span>
            </div>
            <div className="tmono-meta-row">
              <span className="tmono-meta-k">Issued to:</span>
              <span className="tmono-meta-v">{invoice.customerName || 'Customer Name'}</span>
            </div>
            {invoice.invoiceDate && (
              <div className="tmono-meta-row">
                <span className="tmono-meta-k">Date:</span>
                <span className="tmono-meta-v">{invoice.invoiceDate}</span>
              </div>
            )}
            {invoice.dueDate && (
              <div className="tmono-meta-row">
                <span className="tmono-meta-k">Due date:</span>
                <span className="tmono-meta-v">{invoice.dueDate}</span>
              </div>
            )}
            {invoice.customerPhone && (
              <div className="tmono-meta-row">
                <span className="tmono-meta-k">Phone:</span>
                <span className="tmono-meta-v">{invoice.customerPhone}</span>
              </div>
            )}
            {invoice.customerAddress && (
              <div className="tmono-meta-row">
                <span className="tmono-meta-k">Address:</span>
                <span className="tmono-meta-v">{invoice.customerAddress}</span>
              </div>
            )}
          </div>
        </div>
        <div className="tmono-header-right">
          {biz.logo
            ? <img src={biz.logo} alt="logo" className="tmono-logo" />
            : <div className="tmono-logo-ph">
                <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                  <polygon points="26,4 50,40 2,40" fill="#ccc" opacity="0.5"/>
                  <polygon points="26,18 44,44 8,44" fill="#aaa" opacity="0.7"/>
                  <circle cx="26" cy="26" r="10" fill="#e0e0e0"/>
                </svg>
              </div>
          }
          <div className="tmono-company">{biz.name || 'Your Company'}</div>
          {biz.address && <div className="tmono-company-sub">{biz.address}</div>}
          {biz.gstin   && <div className="tmono-company-sub">GSTIN: {biz.gstin}</div>}
        </div>
      </div>

      {/* Items table */}
      <div className="tmono-table-wrap">
        <table className="tmono-table">
          <thead>
            <tr>
              <th className="tmono-th">DESCRIPTION</th>
              <th className="tmono-th tmono-r">QTY</th>
              <th className="tmono-th tmono-r">UNIT</th>
              <th className="tmono-th tmono-r">PRICE</th>
              <th className="tmono-th tmono-r">DISC%</th>
              <th className="tmono-th tmono-r">GST%</th>
              <th className="tmono-th tmono-r">SUBTOTAL</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((item, idx) => {
              const effItem = item.free ? { ...item, rate: '0', discount: '0', gst: '0' } : item;
              const c = calcItemAmount(effItem);
              return (
                <tr key={item.id} className={idx % 2 === 1 ? 'tmono-tr-alt' : 'tmono-tr'}>
                  <td className="tmono-td">{item.name || ''}</td>
                  <td className="tmono-td tmono-r">{item.qty}</td>
                  <td className="tmono-td tmono-r">{item.unit}</td>
                  <td className="tmono-td tmono-r">{item.free ? '—' : formatINR(parseFloat(item.rate) || 0)}</td>
                  <td className="tmono-td tmono-r">{item.free ? '—' : `${item.discount || 0}%`}</td>
                  <td className="tmono-td tmono-r">{item.free ? '—' : `${item.gst || 0}%`}</td>
                  <td className="tmono-td tmono-r tmono-bold" style={item.free ? { color: '#10b981' } : {}}>{item.free ? 'FREE' : formatINR(c.total)}</td>
                </tr>
              );
            })}
            {!(invoice.items || []).length && (
              <tr><td colSpan={7} className="tmono-td" style={{ textAlign:'center', color:'#bbb', fontStyle:'italic', padding:'18px' }}>No items added</td></tr>
            )}

            {/* Empty spacer rows */}
            {[...Array(Math.max(0, 3 - (invoice.items || []).length))].map((_, i) => (
              <tr key={`empty-${i}`} className={((invoice.items || []).length + i) % 2 === 1 ? 'tmono-tr-alt' : 'tmono-tr'}>
                <td className="tmono-td">&nbsp;</td>
                <td className="tmono-td tmono-r" />
                <td className="tmono-td tmono-r" />
                <td className="tmono-td tmono-r" />
                <td className="tmono-td tmono-r" />
                <td className="tmono-td tmono-r" />
                <td className="tmono-td tmono-r" />
              </tr>
            ))}

            {/* Tax rows */}
            {totalDisc > 0 && (
              <tr className="tmono-subtotal-row">
                <td colSpan={6} className="tmono-td tmono-r tmono-sub-label">DISCOUNT</td>
                <td className="tmono-td tmono-r" style={{ color: '#555', fontWeight: 700 }}>− {formatINR(totalDisc)}</td>
              </tr>
            )}
            {!invoice.igstMode ? (<>
              <tr className="tmono-subtotal-row">
                <td colSpan={6} className="tmono-td tmono-r tmono-sub-label">CGST</td>
                <td className="tmono-td tmono-r tmono-bold">{formatINR(half)}</td>
              </tr>
              <tr className="tmono-subtotal-row">
                <td colSpan={6} className="tmono-td tmono-r tmono-sub-label">SGST</td>
                <td className="tmono-td tmono-r tmono-bold">{formatINR(half)}</td>
              </tr>
            </>) : (
              <tr className="tmono-subtotal-row">
                <td colSpan={6} className="tmono-td tmono-r tmono-sub-label">IGST</td>
                <td className="tmono-td tmono-r tmono-bold">{formatINR(totalGST)}</td>
              </tr>
            )}
            <tr className="tmono-grand-row">
              <td colSpan={6} className="tmono-td tmono-r">GRAND TOTAL</td>
              <td className="tmono-td tmono-r tmono-grand-val">{formatINR(grand)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="tmono-words">{amountToWords(grand)}</div>

      {/* Footer */}
      <div className="tmono-footer">
        <div className="tmono-footer-left">
          <div className="tmono-footer-heading">Payment info:</div>
          {invoice.paymentMode && <div className="tmono-footer-item"><span className="tmono-fi-k">Method:</span> {invoice.paymentMode}</div>}
          {biz.gstin   && <div className="tmono-footer-item"><span className="tmono-fi-k">GSTIN:</span> {biz.gstin}</div>}
          {biz.email   && <div className="tmono-footer-item"><span className="tmono-fi-k">Email:</span> {biz.email}</div>}
          {biz.phone   && <div className="tmono-footer-item"><span className="tmono-fi-k">Phone:</span> {biz.phone}</div>}
          {invoice.notes && (
            <div style={{ marginTop: 10 }}>
              <div className="tmono-footer-heading">Note:</div>
              <div className="tmono-footer-note">{invoice.notes}</div>
            </div>
          )}
        </div>
        <div className="tmono-footer-right">
          <div className="tmono-sig-area">
            {biz.stampImg
              ? <img src={biz.stampImg} alt="stamp" className="tmono-stamp-img" />
              : <svg width="100" height="42" viewBox="0 0 100 42" fill="none" style={{ overflow: 'visible' }}>
                  <text x="2" y="36" fill="#333" fontSize="30" fontFamily="Georgia, serif" fontStyle="italic">
                    {biz.signName || biz.name || 'Sign'}
                  </text>
                </svg>
            }
          </div>
          <div className="tmono-sig-line" />
          <div className="tmono-sig-label">{biz.signName || 'Finance Manager'}</div>
        </div>
      </div>
    </div>
  );
}
