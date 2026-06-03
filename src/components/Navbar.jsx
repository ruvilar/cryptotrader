import { useAuth } from '../hooks/useAuth'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0 2rem', height: '60px', background: '#0f0f0f',
      borderBottom: '1px solid #222', position: 'sticky', top: 0, zIndex: 100
    }}>
      <span style={{ color: '#00e5a0', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.05em' }}>
        ₿ CryptoTrader
      </span>

      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img
            src={user.user_metadata?.avatar_url}
            alt="avatar"
            style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #00e5a0' }}
          />
          <span style={{ color: '#aaa', fontSize: '0.85rem' }}>
            {user.user_metadata?.full_name || user.email}
          </span>
          <button onClick={logout} style={{
            background: 'transparent', border: '1px solid #333',
            color: '#666', padding: '0.3rem 0.8rem', borderRadius: '6px',
            cursor: 'pointer', fontSize: '0.8rem'
          }}>
            Salir
          </button>
        </div>
      )}
    </nav>
  )
}