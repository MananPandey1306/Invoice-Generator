import { calcItemAmount, calcTotals, formatINR, amountToWords } from '../utils';

export default function TemplateCorporate({ biz, invoice, forPdf = false }) {
  const isEstimate = invoice.isEstimate || false;
  const paidItems = (invoice.items || []).map(i => i.free ? { ...i, rate: '0', discount: '0', gst: '0' } : i);
  const { subtotal, totalDisc, totalGST, grand } = calcTotals(paidItems);
  const half = totalGST / 2;
  const docTitle = isEstimate ? 'ESTIMATE' : 'INVOICE';

  return (
    <div className="tcorp-wrap" style={forPdf ? { fontSize: '11px' } : {}}>
      {isEstimate && <div className="est-stamp" aria-hidden="true">ESTIMATE</div>}

      {/* Navy blue wave header */}
      <div className="tcorp-header">
        <div className="tcorp-header-content">
          <div className="tcorp-header-left">
            {biz.logo && <img src={biz.logo} alt="logo" className="tcorp-logo" />}
            <div className="tcorp-title">{docTitle}</div>
          </div>
          <div className="tcorp-header-right">
            <div className="tcorp-inv-no">NO: {invoice.invoiceNumber || 'INV-0001'}</div>
            {invoice.invoiceDate && <div className="tcorp-inv-date">{invoice.invoiceDate}</div>}
          </div>
        </div>
        {/* Wave bottom of header */}
        <svg className="tcorp-wave" viewBox="0 0 800 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,0 L800,0 L800,30 C600,70 200,0 0,40 Z" fill="#1a2744"/>
          <path d="M0,40 C200,0 600,70 800,30 L800,60 L0,60 Z" fill="white"/>
        </svg>
      </div>

      {/* Body */}
      <div className="tcorp-body">

        {/* Bill To / From */}
        <div className="tcorp-parties">
          <div>
            <div className="tcorp-party-label">Bill To:</div>
            <div className="tcorp-party-name">{invoice.customerName || 'Customer Name'}</div>
            {invoice.customerPhone   && <div className="tcorp-party-detail">{invoice.customerPhone}</div>}
            {invoice.customerAddress && <div className="tcorp-party-detail">{invoice.customerAddress}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="tcorp-party-label">From:</div>
            <div className="tcorp-party-name">{biz.name || 'Your Company'}</div>
            {biz.phone   && <div className="tcorp-party-detail">{biz.phone}</div>}
            {biz.address && <div className="tcorp-party-detail">{biz.address}</div>}
            {biz.email   && <div className="tcorp-party-detail">{biz.email}</div>}
          </div>
        </div>

        {/* Date row */}
        {invoice.invoiceDate && (
          <div className="tcorp-date-row">
            Date: {invoice.invoiceDate}
            {invoice.dueDate && <>&emsp; Due: {invoice.dueDate}</>}
          </div>
        )}

        {/* Items table */}
        <table className="tcorp-table">
          <thead>
            <tr>
              <th className="tcorp-th">Description</th>
              <th className="tcorp-th tcorp-r">Qty</th>
              <th className="tcorp-th tcorp-r">Unit</th>
              <th className="tcorp-th tcorp-r">Price</th>
              <th className="tcorp-th tcorp-r">Disc%</th>
              <th className="tcorp-th tcorp-r">GST%</th>
              <th className="tcorp-th tcorp-r">Total</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((item, idx) => {
              const effItem = item.free ? { ...item, rate: '0', discount: '0', gst: '0' } : item;
              const c = calcItemAmount(effItem);
              return (
                <tr key={item.id} className={idx % 2 === 1 ? 'tcorp-tr-alt' : 'tcorp-tr'}>
                  <td className="tcorp-td">{item.name || ''}</td>
                  <td className="tcorp-td tcorp-r">{item.qty}</td>
                  <td className="tcorp-td tcorp-r">{item.unit}</td>
                  <td className="tcorp-td tcorp-r">{item.free ? '—' : formatINR(parseFloat(item.rate) || 0)}</td>
                  <td className="tcorp-td tcorp-r">{item.free ? '—' : `${item.discount || 0}%`}</td>
                  <td className="tcorp-td tcorp-r">{item.free ? '—' : `${item.gst || 0}%`}</td>
                  <td className="tcorp-td tcorp-r tcorp-bold" style={item.free ? { color: '#10b981' } : {}}>{item.free ? 'FREE' : formatINR(c.total)}</td>
                </tr>
              );
            })}
            {!(invoice.items || []).length && (
              <tr><td colSpan={7} className="tcorp-td" style={{ textAlign:'center', color:'#bbb', fontStyle:'italic', padding:'18px' }}>No items added</td></tr>
            )}
          </tbody>
        </table>

        {/* Sub Total block */}
        <div className="tcorp-subtotals">
          {totalDisc > 0 && (
            <div className="tcorp-sub-row tcorp-disc"><span>Discount</span><span>− {formatINR(totalDisc)}</span></div>
          )}
          {!invoice.igstMode ? (<>
            <div className="tcorp-sub-row"><span>CGST</span><span>{formatINR(half)}</span></div>
            <div className="tcorp-sub-row"><span>SGST</span><span>{formatINR(half)}</span></div>
          </>) : (
            <div className="tcorp-sub-row"><span>IGST</span><span>{formatINR(totalGST)}</span></div>
          )}
          <div className="tcorp-sub-grand">
            <span>Sub Total</span><span>{formatINR(grand)}</span>
          </div>
        </div>

        <div className="tcorp-words">{amountToWords(grand)}</div>

        {/* Note + Thank You */}
        <div className="tcorp-note-row">
          <div className="tcorp-note-left">
            {invoice.notes && (
              <>
                <div className="tcorp-note-label">Note:</div>
                <div className="tcorp-note-lines">
                  {invoice.notes.split('\n').map((l, i) => <div key={i}>{l}</div>)}
                </div>
              </>
            )}
          </div>
          <div className="tcorp-thankyou">Thank You!</div>
        </div>

        {/* Footer payment info */}
        <div className="tcorp-footer">
          <div className="tcorp-footer-left">
            <div className="tcorp-footer-heading">Payment Information:</div>
            {invoice.paymentMode && <div className="tcorp-footer-item"><strong>Method:</strong> {invoice.paymentMode}</div>}
            {biz.gstin && <div className="tcorp-footer-item"><strong>GSTIN:</strong> {biz.gstin}</div>}
            {biz.email && <div className="tcorp-footer-item"><strong>Email:</strong> {biz.email}</div>}
            {biz.phone && <div className="tcorp-footer-item"><strong>Phone:</strong> {biz.phone}</div>}
          </div>
          <div className="tcorp-footer-right">
            <div className="tcorp-sig-area">
              {biz.stampImg
                ? <img src={biz.stampImg} alt="stamp" className="tcorp-stamp-img" />
                : <svg width="80" height="32" viewBox="0 0 80 32" fill="none">
                    <line x1="4" y1="28" x2="72" y2="5" stroke="#1a2744" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="16" y1="28" x2="76" y2="8" stroke="#1a2744" strokeWidth="1" strokeLinecap="round" opacity="0.35"/>
                  </svg>
              }
            </div>
            <div className="tcorp-sig-line" />
            <div className="tcorp-sig-name">{biz.signName || biz.name || 'Authorised Sign'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
