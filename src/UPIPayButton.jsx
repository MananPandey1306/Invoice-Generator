import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

/**
 * Clickable UPI Pay Now button.
 * - Always visible both on screen and inside generated PDF
 * - Inside PDF: jsPDF and print-to-pdf bind the clickable payUrl
 * - On mobile screen: opens upi:// direct app deep-link
 * - On desktop screen: opens a clean QR modal for quick scanning
 */
export default function UPIPayButton({ upiId, payeeName, amount, invoiceNumber }) {
  const [showModal, setShowModal] = useState(false);

  if (!upiId) return null;

  const origin = (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost'))
    ? window.location.origin
    : 'https://invoice-generator-edsy.vercel.app';

  const amtNum = amount ? parseFloat(amount) : 0;
  const amtFormatted = amtNum > 0 ? `₹${amtNum.toFixed(2)}` : '';
  const noteParam = invoiceNumber ? `Invoice ${invoiceNumber}` : '';

  // Direct UPI URI for mobile intents
  const upiDirectUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName || 'Business')}&am=${encodeURIComponent(amtNum > 0 ? amtNum.toFixed(2) : '')}&cu=INR${noteParam ? `&tn=${encodeURIComponent(noteParam)}` : ''}`;

  // Universal web payment URL for PDFs (works on all mobile PDF viewers, WhatsApp, desktop, etc.)
  const payUrl = `${origin}/pay.html?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName || 'Business')}&am=${encodeURIComponent(amtNum > 0 ? amtNum.toFixed(2) : '')}&tn=${encodeURIComponent(noteParam)}&cu=INR`;

  const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  const handleClick = (e) => {
    if (isMobile) {
      // Mobile screen: let native anchor open UPI deep link
      window.location.href = upiDirectUrl;
      return;
    }
    // Desktop screen: show QR modal
    e.preventDefault();
    setShowModal(true);
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px', marginBottom: '8px' }}>
        <a
          href={payUrl}
          data-pay-btn="true"
          data-pay-url={payUrl}
          onClick={handleClick}
          className="upi-pay-btn"
          title={`Pay ${amtFormatted} via UPI`}
        >
          <span className="upi-pay-btn-icon">&#8377;</span>
          Pay Now via UPI{amtFormatted ? ` — ${amtFormatted}` : ''}
        </a>
      </div>

      {/* Desktop QR Modal (hidden on print / PDF capture) */}
      {showModal && (
        <div
          className="no-print"
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: '#fff', borderRadius: '18px', padding: '30px 24px',
              textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
              maxWidth: '320px', width: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
              UPI Payment
            </div>
            <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '17px', color: '#0f172a' }}>
              {payeeName || 'Scan to Pay'}
            </p>
            {amtFormatted && (
              <p style={{ margin: '4px 0 16px', fontSize: '26px', fontWeight: 900, color: '#16a34a' }}>
                {amtFormatted}
              </p>
            )}
            <div style={{ padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'inline-block' }}>
              <QRCodeSVG value={upiDirectUrl} size={190} level="M" />
            </div>
            <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#475569', wordBreak: 'break-all', fontWeight: 500 }}>
              {upiId}
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <a
                href={payUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: 1, padding: '10px 0', border: '1px solid #e2e8f0',
                  borderRadius: '10px', background: '#f1f5f9', color: '#0f172a',
                  fontWeight: 600, fontSize: '13px', textDecoration: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                Open Page
              </a>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1, padding: '10px 0', border: 'none',
                  borderRadius: '10px', background: '#16a34a', color: '#fff',
                  fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
