import { useState, useRef } from 'react';

function readFile(file) {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = (e) => resolve(e.target.result);
    r.readAsDataURL(file);
  });
}

export default function RegisterScreen({ initial = {}, onComplete, isModal = false }) {
  const [biz, setBiz] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    logo: '',
    stampImg: '',
    signName: '',
    ...initial,
  });
  const [errors, setErrors]   = useState({});
  const [saving, setSaving]   = useState(false);
  const logoRef  = useRef();
  const stampRef = useRef();

  async function handleLogo(e) {
    const file = e.target.files[0];
    if (!file) return;
    const data = await readFile(file);
    setBiz(b => ({ ...b, logo: data }));
  }

  async function handleStamp(e) {
    const file = e.target.files[0];
    if (!file) return;
    const data = await readFile(file);
    setBiz(b => ({ ...b, stampImg: data }));
  }

  function validate() {
    const errs = {};
    if (!biz.name.trim()) errs.name = 'Business name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 400)); // brief save feel
    onComplete(biz);
    setSaving(false);
  }

  const field = (label, id, props = {}, error) => (
    <div className="rg-form-group">
      <label className="rg-label" htmlFor={id}>{label}</label>
      <input id={id} className={`rg-input${error ? ' rg-input-err' : ''}`} {...props}
        value={props.value ?? biz[id] ?? ''}
        onChange={e => { setBiz(b => ({ ...b, [id]: e.target.value })); if (error) setErrors(v => ({...v, [id]: ''})); }}
      />
      {error && <span className="rg-err-msg">{error}</span>}
    </div>
  );

  return (
    <div className={`rg-overlay${isModal ? ' rg-modal-mode' : ''}`}>
      <div className="rg-shell">

        {/* ── Left hero ── */}
        {!isModal && (
          <div className="rg-hero">
            <div className="rg-hero-badge">✦ InvoiceForge</div>
            <h1 className="rg-hero-title">
              Professional<br />
              <span className="rg-hero-accent">Invoices</span><br />
              in seconds.
            </h1>
            <p className="rg-hero-sub">
              Set up your business profile once.<br />
              Generate beautiful GST-ready invoices, estimates, and PDFs — forever.
            </p>
            <div className="rg-hero-features">
              {['GST / IGST ready', 'WhatsApp PDF sharing', 'Signature & Stamp', 'Estimate mode'].map(f => (
                <div key={f} className="rg-feat">
                  <span className="rg-feat-dot" />
                  {f}
                </div>
              ))}
            </div>
            <div className="rg-hero-glow" />
          </div>
        )}

        {/* ── Registration card ── */}
        <div className={`rg-card${isModal ? ' rg-card-modal' : ''}`}>
          <div className="rg-card-header">
            {isModal && <div className="rg-modal-logo-row"><div className="rg-modal-dot" />InvoiceForge</div>}
            <h2 className="rg-card-title">{isModal ? 'Business Profile' : 'Set up your Business'}</h2>
            <p className="rg-card-sub">{isModal ? 'Update your details — changes reflect immediately on invoices.' : 'Fill in your details to get started. You can update these anytime.'}</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>

            {/* Logo + Name row */}
            <div className="rg-logo-name-row">
              {/* Logo upload */}
              <div className="rg-upload-wrap">
                <label className="rg-label">Logo <span className="rg-optional">(optional)</span></label>
                <div className="rg-logo-drop" onClick={() => logoRef.current.click()}>
                  <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogo} />
                  {biz.logo
                    ? <img src={biz.logo} alt="logo" className="rg-logo-preview" />
                    : <div className="rg-upload-placeholder">
                        <div className="rg-upload-icon">🏢</div>
                        <div className="rg-upload-hint">Click to upload</div>
                      </div>
                  }
                </div>
                {biz.logo && (
                  <button type="button" className="rg-remove-btn" onClick={() => setBiz(b => ({ ...b, logo: '' }))}>Remove</button>
                )}
              </div>

              {/* Business name */}
              <div style={{ flex: 1 }}>
                {field('Business Name *', 'name', { placeholder: 'e.g. Sharma Hardware Store', autoFocus: !isModal }, errors.name)}
              </div>
            </div>

            {/* Contact grid */}
            <div className="rg-grid-2">
              {field('Phone', 'phone', { placeholder: '+91 98765 43210', type: 'tel' })}
              {field('Email', 'email', { placeholder: 'shop@email.com', type: 'email' })}
            </div>

            <div className="rg-grid-2">
              {field('Address', 'address', { placeholder: 'Shop No., Street, City, State — PIN' })}
              {field('GSTIN', 'gstin', {
                placeholder: '22AAAAA0000A1Z5',
                maxLength: 15,
                value: biz.gstin,
                onChange: e => setBiz(b => ({ ...b, gstin: e.target.value.toUpperCase() }))
              })}
            </div>

            {/* Signature / Stamp section */}
            <div className="rg-divider">
              <span className="rg-divider-label">Signature &amp; Stamp <span className="rg-optional">(optional)</span></span>
            </div>

            <div className="rg-sig-section">
              <div className="rg-sig-upload-col">
                <label className="rg-label">Signature / Stamp Image</label>
                <div className={`rg-stamp-drop${biz.stampImg ? ' rg-stamp-has-img' : ''}`}
                  onClick={() => stampRef.current.click()}>
                  <input ref={stampRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleStamp} />
                  {biz.stampImg
                    ? <img src={biz.stampImg} alt="stamp" className="rg-stamp-preview" />
                    : <div className="rg-upload-placeholder">
                        <div className="rg-upload-icon">✍️</div>
                        <div className="rg-upload-hint">Upload signature or stamp</div>
                        <div className="rg-upload-subhint">PNG with transparent background recommended</div>
                      </div>
                  }
                </div>
                {biz.stampImg && (
                  <button type="button" className="rg-remove-btn" onClick={() => setBiz(b => ({ ...b, stampImg: '' }))}>Remove</button>
                )}
              </div>

              <div className="rg-sig-name-col">
                {field('Signing Authority Name', 'signName', { placeholder: 'e.g. Ramesh Sharma (Owner)' })}
                <div className="rg-sig-note">
                  This name appears below the signature line on your invoices.
                </div>
              </div>
            </div>

            {/* CTA */}
            <button
              type="submit"
              className={`rg-cta${saving ? ' rg-cta-loading' : ''}`}
              disabled={saving || !biz.name.trim()}
            >
              {saving
                ? <><span className="rg-spinner" /> Saving…</>
                : isModal
                  ? '💾 Save Profile'
                  : '🚀 Start Creating Invoices'
              }
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
