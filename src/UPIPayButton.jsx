import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

/**
 * Standalone clickable UPI Pay Now button.
 * - On mobile: taps open the upi:// deep link directly (triggers GPay / PhonePe etc.)
 * - On desktop: opens a modal with a scannable QR code
 * Hidden on print via the no-print class.
 */
export default function UPIPayButton({ upiId, payeeName, amount }) {
  const [showModal, setShowModal] = useState(false);

  if (!upiId) return null;

  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName || 'Business')}&am=${encodeURIComponent(amount || 0)}&cu=INR`;
  const amtFormatted = amount ? `₹${parseFloat(amount).toFixed(2)}` : '';

  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  const handleClick = (e) => {
    if (isMobile) {
      // Let the native anchor href="upi://..." do its job — don't prevent default
      return;
    }
    // Desktop: prevent navigation and show QR modal instead
    e.preventDefault();
    setShowModal(true);
  };

  return (
    <>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
        <a
          href={upiUrl}
          onClick={handleClick}
          className="upi-pay-btn"
          title={`Pay ${amtFormatted} via UPI`}
        >
          <span className="upi-pay-btn-icon">&#8377;</span>
          Pay Now via UPI{amtFormatted ? ` — ${amtFormatted}` : ''}
        </a>
      </div>

      {/* Desktop QR modal */}
      {showModal && (
        <div
          className="no-print"
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: '#fff', borderRadius: '16px', padding: '32px 28px',
              textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
              minWidth: '260px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: '16px', color: '#1a1a2e' }}>
              Scan to Pay via UPI
            </p>
            {amtFormatted && (
              <p style={{ margin: '0 0 16px', fontSize: '22px', fontWeight: 800, color: '#16a34a' }}>
                {amtFormatted}
              </p>
            )}
            <QRCodeSVG value={upiUrl} size={200} includeMargin />
            <p style={{ margin: '12px 0 0', fontSize: '12px', color: '#555', wordBreak: 'break-all' }}>
              {upiId}
            </p>
            <button
              onClick={() => setShowModal(false)}
              style={{
                marginTop: '18px', padding: '8px 28px', border: 'none',
                borderRadius: '8px', background: '#16a34a', color: '#fff',
                fontWeight: 700, fontSize: '14px', cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
