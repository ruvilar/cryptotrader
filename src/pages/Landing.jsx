import { useAuth } from '../hooks/useAuth'

export default function Landing() {
  const { loginConGoogle, loading } = useAuth()

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '2rem'
    }}>
      {/* Logo */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>₿</div>
        <h1 style={{
          color: '#fff', fontSize: '2.2rem', fontWeight: 800,
          letterSpacing: '-0.03em', margin: 0
        }}>
          Crypto<span style={{ color: '#00e5a0' }}>Trader</span>
        </h1>
        <p style={{ color: '#444', marginTop: '0.5rem', fontSize: '0.95rem' }}>
          Estrategia de trading personal
        </p>
      </div>

      {/* Card central */}
      <div style={{
        background: '#111', border: '1px solid #1e1e1e',
        borderRadius: '20px', padding: '2.5rem',
        maxWidth: '420px', width: '100%', textAlign: 'center'
      }}>
        <h2 style={{ color: '#ccc', fontWeight: 600, marginBottom: '0.5rem', fontSize: '1.2rem' }}>
          Tu capital, tu estrategia
        </h2>
        <p style={{ color: '#444', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
          Registrá tus operaciones de ETH y BTC,
          calculá ganancias automáticamente y
          seguí tu capital en tiempo real.
        </p>

        {/* Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginBottom: '2rem' }}>
          {[
            { icon: '📈', texto: 'Precio en vivo desde Binance' },
            { icon: '🧮', texto: 'Cálculo automático de ganancias' },
            { icon: '📋', texto: 'Historial completo de operaciones' },
            { icon: '🔐', texto: 'Datos privados con Google Login' },
          ].map(({ icon, texto }) => (
            <div key={texto} style={{
              display: 'flex', alignItems: 'center', gap: '0.8rem',
              background: '#0a0a0a', borderRadius: '10px',
              padding: '0.7rem 1rem', textAlign: 'left'
            }}>
              <span style={{ fontSize: '1.1rem' }}>{icon}</span>
              <span style={{ color: '#666', fontSize: '0.85rem' }}>{texto}</span>
            </div>
          ))}
        </div>

        {/* Botón Google */}
        <button
          onClick={loginConGoogle}
          disabled={loading}
          style={{
            width: '100%', padding: '0.9rem',
            background: loading ? '#1a1a1a' : '#fff',
            color: loading ? '#444' : '#111',
            border: 'none', borderRadius: '12px',
            fontWeight: 700, fontSize: '1rem',
            cursor: loading ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '0.7rem',
            transition: 'all 0.2s'
          }}
        >
          {!loading && (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {loading ? 'Cargando...' : 'Continuar con Google'}
        </button>
      </div>

      <p style={{ color: '#2a2a2a', fontSize: '0.75rem', marginTop: '2rem' }}>
        Datos almacenados de forma privada en Supabase
      </p>
    </div>
  )
}