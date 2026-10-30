import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

/**
 * Clickable UPI Payment Card & Pay Now button.
 * - Displays a scannable QR code alongside an attractive Pay Now button.
 * - Always visible on screen, print, and inside generated PDF.
 * - Inside PDF: jsPDF and print-to-pdf bind active hyperlinks over both button and QR.
 * - On mobile screen: tapping directly triggers UPI intent (Google Pay, PhonePe, Paytm, etc.).
 * - On desktop screen: click opens full QR modal for easy scanning.
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

  // Universal web payment URL for PDFs
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
      <div className="upi-pay-section" data-pay-section="true">
        <div className="upi-pay-card">
          {/* Scannable QR Code */}
          <div className="upi-qr-box" data-upi-qr="true" data-pay-url={payUrl}>
            <a href={payUrl} target="_blank" rel="noreferrer" title="Scan with any UPI app or tap to pay">
              <QRCodeSVG value={upiDirectUrl} size={74} level="M" />
            </a>
            <span className="upi-qr-label">Scan to Pay</span>
          </div>

          {/* Details + Attractive Pay Now Button */}
          <div className="upi-details-col">
            <div className="upi-meta-row">
              <span className="upi-id-tag">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                {upiId}
              </span>
              <span className="upi-apps-hint">GPay • PhonePe • Paytm</span>
            </div>

            <a
              href={payUrl}
              data-pay-btn="true"
              data-pay-url={payUrl}
              onClick={handleClick}
              className="upi-pay-btn"
              title={`Pay ${amtFormatted} via UPI`}
            >
              <span className="upi-pay-btn-icon">&#8377;</span>
              <span>Pay Now via UPI</span>
              {amtFormatted && <span className="upi-pay-btn-amt">{amtFormatted}</span>}
              <svg className="upi-pay-btn-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
          </div>
        </div>
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
