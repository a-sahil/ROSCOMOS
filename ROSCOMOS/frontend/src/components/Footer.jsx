export default function Footer() {
  return (
    <footer style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)', padding: '48px 24px', position: 'relative', zIndex: 2 }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: '40px' }}>
        <div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '18px', background: 'linear-gradient(135deg, #d4a32d, #f0c040)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '12px' }}>
            ROSCOMOS
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>Community rotating savings, reimagined for Web3.</p>
        </div>
        <div>
          <p style={{ color: 'var(--text-faint)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>Quick Links</p>
          {['Circles', 'Dashboard', 'Create'].map((l) => (
            <div key={l} style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>{l}</div>
          ))}
        </div>
        <div>
          <p style={{ color: 'var(--text-faint)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>Contract</p>
          <code style={{ color: 'var(--teal)', fontSize: '12px', background: 'rgba(15,155,142,0.1)', padding: '8px 12px', borderRadius: '8px', display: 'block' }}>0xa89655a0f8e3d113</code>
          <p style={{ color: 'var(--text-faint)', fontSize: '12px', marginTop: '8px' }}>Flow Testnet</p>
        </div>
      </div>
      <div style={{ maxWidth: '1200px', margin: '32px auto 0', paddingTop: '24px', borderTop: '1px solid var(--border-subtle)', textAlign: 'center', color: 'var(--text-faint)', fontSize: '13px' }}>
        © 2026 ROSCOMOS. MIT License. Built for the Web3 community.
      </div>
    </footer>
  )
}
