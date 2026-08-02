import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function UPIQRCode({ upiId, payeeName, amount }) {
  if (!upiId) return null;
  // UPI URI scheme
  // pa: Payee VPA (UPI ID)
  // pn: Payee Name
  // am: Amount
  // cu: Currency (INR)
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName || 'Business')}&am=${encodeURIComponent(amount || 0)}&cu=INR`;

  return (
    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
      <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>
        Scan to Pay
      </div>
      <div style={{ padding: '4px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px', display: 'inline-block' }}>
        <QRCodeSVG value={upiUrl} size={80} level="M" />
      </div>
      <div style={{ fontSize: '10px', color: '#475569' }}>
        {upiId}
      </div>
    </div>
  );
}
