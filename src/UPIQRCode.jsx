import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function UPIQRCode({ upiId, payeeName, amount, invoiceNumber }) {
  if (!upiId) return null;

  const origin = (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost'))
    ? window.location.origin
    : 'https://invoice-generator-edsy.vercel.app';

  const amtNum = amount ? parseFloat(amount) : 0;
  const noteParam = invoiceNumber ? `Invoice ${invoiceNumber}` : '';

  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName || 'Business')}&am=${encodeURIComponent(amtNum > 0 ? amtNum.toFixed(2) : '')}&cu=INR${noteParam ? `&tn=${encodeURIComponent(noteParam)}` : ''}`;
  const payUrl = `${origin}/pay.html?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName || 'Business')}&am=${encodeURIComponent(amtNum > 0 ? amtNum.toFixed(2) : '')}&tn=${encodeURIComponent(noteParam)}&cu=INR`;

  return (
    <div
      data-upi-qr="true"
      data-pay-url={payUrl}
      style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}
    >
      <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>
        Scan to Pay
      </div>
      <a href={payUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', textDecoration: 'none' }} title="Scan or tap to pay">
        <div style={{ padding: '4px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px', display: 'inline-block' }}>
          <QRCodeSVG value={upiUrl} size={80} level="M" />
        </div>
      </a>
      <div style={{ fontSize: '10px', color: '#475569' }}>
        {upiId}
      </div>
    </div>
  );
}
