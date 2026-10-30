import React from 'react';

/**
 * Standalone clickable UPI Pay Now button.
 * Renders only on screen (hidden on print via no-print class).
 * Place this directly below the Grand Total amount.
 */
export default function UPIPayButton({ upiId, payeeName, amount }) {
  if (!upiId) return null;

  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName || 'Business')}&am=${encodeURIComponent(amount || 0)}&cu=INR`;
  const amtFormatted = amount ? `\u20B9${parseFloat(amount).toFixed(2)}` : '';

  return (
    <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
      <a
        href={upiUrl}
        className="upi-pay-btn"
        title={`Pay ${amtFormatted} via UPI`}
      >
        <span className="upi-pay-btn-icon">&#8377;</span>
        Pay Now via UPI{amtFormatted ? ` \u2014 ${amtFormatted}` : ''}
      </a>
    </div>
  );
}
