import { useBinancePrice } from '../hooks/useBinancePrice'

export default function PriceWidget({ simbolo }) {
  const { precio, loading, error, ultimaActualizacion, formatearPrecio, refrescar } =
    useBinancePrice(simbolo)

  const hora = ultimaActualizacion
    ? ultimaActualizacion.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null

  return (
    <div style={{
      background: '#141414', border: '1px solid #222', borderRadius: '12px',
      padding: '1rem 1.5rem', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', gap: '1rem'
    }}>
      <div>
        <div style={{ color: '#f0b429', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
          Precio en vivo · {simbolo?.toUpperCase()}
        </div>
        {loading && !precio && (
          <div style={{ color: '#555', fontSize: '1.2rem' }}>Cargando...</div>
        )}
        {error && (
          <div style={{ color: '#ff4d4d', fontSize: '0.85rem' }}>{error}</div>
        )}
        {precio && (
          <div style={{ color: '#00e5a0', fontSize: '1.6rem', fontWeight: 700 }}>
            {formatearPrecio(precio)}
          </div>
        )}
        {hora && (
          <div style={{ color: '#999', fontSize: '0.7rem', marginTop: '0.2rem' }}>
            Actualizado {hora}
          </div>
        )}
      </div>

      <button onClick={refrescar} disabled={loading} style={{
        background: 'transparent', border: '1px solid #333',
        color: loading ? '#fff' : '#f0b429', padding: '0.4rem 0.8rem',
        borderRadius: '8px', cursor: loading ? 'default' : 'pointer',
        fontSize: '0.8rem', transition: 'all 0.2s'
      }}>
        ↻
      </button>
    </div>
  )
}