export default function History({ operaciones, onEliminar, loading }) {
    if (loading) {
      return <div style={{ color: '#444', padding: '1rem', textAlign: 'center' }}>Cargando historial...</div>
    }
  
    if (!operaciones?.length) {
      return (
        <div style={{
          background: '#111', border: '1px solid #1e1e1e',
          borderRadius: '14px', padding: '2rem', textAlign: 'center'
        }}>
          <div style={{ color: '#333', fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
          <div style={{ color: '#444' }}>Sin operaciones aún</div>
        </div>
      )
    }
  
    const totalGanancia = operaciones
      .filter(op => op.tipo === 'venta')
      .reduce((acc, op) => acc + (op.ganancia || 0), 0)
  
    const totalAhorro = operaciones
      .filter(op => op.tipo === 'recompra')
      .reduce((acc, op) => acc + (op.ahorro || 0), 0)
  
    return (
      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '14px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <div style={{ color: '#ccc', fontWeight: 600 }}>
            Historial · {operaciones.length} operaciones
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span style={{ color: '#00e5a0', fontSize: '0.85rem' }}>
              +${totalGanancia.toFixed(2)} ganancia
            </span>
            {totalAhorro > 0 && (
              <span style={{ color: '#4d79ff', fontSize: '0.85rem' }}>
                +${totalAhorro.toFixed(2)} ahorro
              </span>
            )}
          </div>
        </div>
  
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {operaciones.map((op, i) => (
            <FilaOperacion
              key={op.id}
              op={op}
              numero={operaciones.length - i}
              onEliminar={onEliminar}
            />
          ))}
        </div>
      </div>
    )
  }
  
  function FilaOperacion({ op, numero, onEliminar }) {
    const esVenta = op.tipo === 'venta'
    const fecha = new Date(op.creado_en).toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    })
  
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: '24px 80px 1fr 1fr 1fr auto',
        alignItems: 'center', gap: '0.8rem',
        background: '#0a0a0a', borderRadius: '10px',
        padding: '0.7rem 1rem',
        borderLeft: `3px solid ${esVenta ? '#00e5a0' : '#4d79ff'}`
      }}>
        <span style={{ color: '#444', fontSize: '0.75rem' }}>#{numero}</span>
  
        <span style={{
          background: esVenta ? '#00e5a011' : '#4d79ff11',
          color: esVenta ? '#00e5a0' : '#4d79ff',
          padding: '0.2rem 0.5rem', borderRadius: '5px',
          fontSize: '0.75rem', fontWeight: 600, textAlign: 'center'
        }}>
          {esVenta ? '↑ Venta' : '↓ Recompra'}
        </span>
  
        <div>
          <div style={{ color: '#ccc', fontSize: '0.85rem', fontWeight: 600 }}>
            ${op.precio_operacion?.toFixed(2)}
          </div>
          <div style={{ color: '#444', fontSize: '0.7rem' }}>{fecha}</div>
        </div>
  
        <div>
          <div style={{ color: '#888', fontSize: '0.8rem' }}>${op.monto_usdt?.toFixed(2)} USDT</div>
          <div style={{ color: '#444', fontSize: '0.7rem' }}>{op.tokens} tokens</div>
        </div>
  
        <div>
          {esVenta && op.ganancia > 0 && (
            <div style={{ color: '#00e5a0', fontSize: '0.85rem', fontWeight: 600 }}>
              +${op.ganancia?.toFixed(2)}
            </div>
          )}
          {!esVenta && op.ahorro > 0 && (
            <div style={{ color: '#4d79ff', fontSize: '0.85rem', fontWeight: 600 }}>
              ahorro +${op.ahorro?.toFixed(2)}
            </div>
          )}
          <div style={{ color: '#444', fontSize: '0.7rem' }}>
            cap. ${op.capital_despues?.toFixed(2)}
          </div>
        </div>
  
        <button
          onClick={() => {
            if (window.confirm('¿Eliminar esta operación?')) onEliminar?.(op.id)
          }}
          style={{
            background: 'transparent', border: 'none',
            color: '#333', cursor: 'pointer', fontSize: '1rem',
            padding: '0.2rem'
          }}
          title="Eliminar"
        >
          ✕
        </button>
      </div>
    )
  }