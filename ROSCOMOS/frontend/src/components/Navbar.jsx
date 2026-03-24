import { Coins } from 'lucide-react'

export default function Navbar({ onNavigate }) {
  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: '64px',
        background: 'rgba(8,11,15,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => onNavigate('landing')} style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer' }}>
          <Coins className="w-6 h-6 text-[#d4a32d]" />
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '18px', background: 'linear-gradient(135deg, #d4a32d, #f0c040)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ROSCOMOS
          </span>
        </button>

        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }} className="desktop-nav">
          {[
            ['Dashboard', 'dashboard'],
            ['Create', 'create'],
          ].map(([label, route]) => (
            <button
              key={route}
              onClick={() => onNavigate(route)}
              style={{ color: '#9a9590', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.18s' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#d4a32d' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#9a9590' }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(15,155,142,0.1)', border: '1px solid rgba(15,155,142,0.3)', borderRadius: '99px', padding: '6px 12px' }}>
            <span className="pulse-dot" />
            <span style={{ color: '#14c4b4', fontSize: '12px', fontWeight: 500 }}>Flow Testnet</span>
          </div>
        </div>
      </div>
    </nav>
  )
}
