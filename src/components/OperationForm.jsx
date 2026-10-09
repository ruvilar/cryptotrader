import { useState, useEffect } from 'react'
import { useTrading } from '../hooks/useTrading'
import { useBinancePrice } from '../hooks/useBinancePrice'
import { calcularEstadoEstrategia } from '../lib/calculations'

export default function OperationForm({ activo, userId, onOperacionCompletada }) {
  const [modo, setModo]               = useState('venta')   // 'venta' | 'recompra'
  const [porcentaje, setPorcentaje]   = useState(activo?.porcentaje_operacion || 25)
  const [precioVenta, setPrecioVenta] = useState('')
  const [precioCompra, setPrecioCompra] = useState('')
  const [precioRecompra, setPrecioRecompra] = useState('')
  const [preview, setPreview]         = useState(null)

  const { precio: precioActual } = useBinancePrice(activo?.simbolo)

  const {
    procesando, errores, resultado,
    porcentajeRecomendado, ultimaVenta, operaciones,
    previsualizarVenta, previsualizarRecompra,
    ejecutarVenta, ejecutarRecompra,
    limpiarResultado, limpiarErrores
  } = useTrading(activo, userId)

  const estadoActual = calcularEstadoEstrategia({
    operaciones,
    precioActual: precioActual || 0,
    capitalActual: activo?.capital_actual || 0,
    porcentaje
  })

  // Previsualización actualizada en tiempo real
  useEffect(() => {
    if (!activo) return
    if (modo === 'venta' && precioVenta && precioCompra) {
      const prev = previsualizarVenta({
        porcentaje,
        precioActual: parseFloat(precioCompra),
        precioVenta:  parseFloat(precioVenta)
      })
      setPreview(prev)
    } else if (modo === 'recompra' && precioRecompra) {
      const prev = previsualizarRecompra({
        porcentaje,
        precioRecompra: parseFloat(precioRecompra)
      })
      setPreview(prev)
    } else {
      setPreview(null)
    }
  }, [modo, precioVenta, precioRecompra, porcentaje, precioActual])

  async function handleSubmit() {
    limpiarErrores()
    let res = null

    if (modo === 'venta') {
      res = await ejecutarVenta({
        porcentaje,
        precioActual: ultimaVenta
          ? parseFloat(ultimaVenta.precio_operacion)
          : parseFloat(precioCompra),
        precioVenta: parseFloat(precioVenta)
      })
    } else {
      res = await ejecutarRecompra({
        porcentaje,
        precioRecompra: parseFloat(precioRecompra)
      })
    }

    if (res) {
      setPrecioVenta('')
      setPrecioRecompra('')
      setPreview(null)
      onOperacionCompletada?.()
    }
  }

  if (resultado) {
    return (
      <ResultadoOperacion
        resultado={resultado}
        onCerrar={limpiarResultado}
      />
    )
  }

  return (
    <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '14px', padding: '1.5rem' }}>
      <div style={{ marginBottom: '1.2rem', color: '#ccc', fontWeight: 600 }}>
        Registrar operación · {activo?.nombre}
      </div>

      {/* Selector venta / recompra */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem' }}>
        {['venta', 'recompra'].map(m => (
          <button
            key={m}
            onClick={() => { setModo(m); setPreview(null); limpiarErrores() }}
            style={{
              flex: 1, padding: '0.6rem',
              background: modo === m ? (m === 'venta' ? '#00e5a0' : '#4d79ff') : '#1a1a1a',
              color: modo === m ? '#000' : '#ccc',
              border: 'none', borderRadius: '8px',
              fontWeight: 600, cursor: 'pointer',
              textTransform: 'capitalize', transition: 'all 0.2s'
            }}
          >
            {m === 'venta' ? '↑ Venta' : '↓ Recompra'}
          </button>
        ))}
      </div>

      {/* Porcentaje */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ color: '#ccc', fontSize: '0.75rem', display: 'block', marginBottom: '0.4rem' }}>
          % a operar (recomendado: {porcentajeRecomendado}%)
        </label>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[10, 15, 20, 25, 30].map(p => (
            <button
              key={p}
              onClick={() => setPorcentaje(p)}
              style={{
                padding: '0.3rem 0.7rem', borderRadius: '6px',
                background: porcentaje === p ? '#1a2e1a' : '#1a1a1a',
                border: `1px solid ${porcentaje === p ? '#00e5a0' : '#2a2a2a'}`,
                color: porcentaje === p ? '#00e5a0' : '#ccc',
                cursor: 'pointer', fontSize: '0.8rem'
              }}
            >
              {p}%
            </button>
          ))}
        </div>
      </div>

      {precioActual && (
        <div style={{
          background: '#0a0a0a', border: '1px solid #1f1f1f',
          borderRadius: '10px', padding: '0.9rem', marginBottom: '1rem'
        }}>
          <div style={{ color: '#f0b429', fontSize: '0.75rem', marginBottom: '0.6rem' }}>
            Estado actual de la estrategia
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <MiniCard
              label="Valor activo"
              valor={`$${estadoActual.valorActivo.toFixed(2)}`}
              sub={`${estadoActual.saldoTokens.toFixed(6)} ETH`}
            />
            <MiniCard
              label="USD disponible"
              valor={`$${estadoActual.reservaUsd.toFixed(2)}`}
              sub="para recompra"
            />
            <MiniCard
              label="Vender"
              valor={`$${estadoActual.montoVenta.toFixed(2)}`}
              sub={`${estadoActual.tokensVenta.toFixed(6)} ETH`}
            />
            <MiniCard
              label="Recomprar"
              valor={`$${estadoActual.montoRecompra.toFixed(2)}`}
              sub={`${estadoActual.tokensCompra.toFixed(6)} ETH`}
            />
          </div>
        </div>
      )}

      {/* Campo de precio */}
      {modo === 'venta' && (
        <div style={{ marginBottom: '1rem' }}>
          {!ultimaVenta && (
            <>
              <label style={{ color: '#f0b429', fontSize: '0.87rem', display: 'block', marginBottom: '0.4rem' }}>
                Precio de compra (USDT)
                {precioActual && (
                  <span style={{ color: '#999', marginLeft: '0.5rem', fontSize: '0.8rem' }}>
                    · en vivo: ${precioActual.toFixed(2)}
                  </span>
                )}
              </label>
              <input
                type="number"
                value={precioCompra}
                onChange={e => setPrecioCompra(e.target.value)}
                placeholder="Ej: 2000"
                style={{
                  width: '100%', padding: '0.7rem 1rem',
                  background: '#0a0a0a', border: '1px solid #2a2a2a',
                  borderRadius: '8px', color: '#fff', fontSize: '0.85rem',
                  outline: 'none', boxSizing: 'border-box', marginBottom: '0.8rem'
                }}
              />
            </>
          )}
          <label style={{ color: '#f0b429', fontSize: '0.87rem', display: 'block', marginBottom: '0.4rem' }}>
            Precio de venta objetivo (USDT)
          </label>
          <input
            type="number"
            value={precioVenta}
            onChange={e => setPrecioVenta(e.target.value)}
            placeholder="Ej: 2500"
            style={{
              width: '100%', padding: '0.7rem 1rem',
              background: '#0a0a0a', border: '1px solid #2a2a2a',
              borderRadius: '8px', color: '#fff', fontSize: '0.85rem',
              outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>
      )}

      {modo === 'recompra' && (
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ color: '#555', fontSize: '0.75rem', display: 'block', marginBottom: '0.4rem' }}>
            Precio de recompra (USDT)
            {ultimaVenta && (
              <span style={{ color: '#4d79ff', marginLeft: '0.5rem' }}>
                Última venta: ${ultimaVenta.precio_operacion?.toFixed(2)}
              </span>
            )}
          </label>
          <input
            type="number"
            value={precioRecompra}
            onChange={e => setPrecioRecompra(e.target.value)}
            placeholder="Ej: 2000"
            style={{
              width: '100%', padding: '0.7rem 1rem',
              background: '#0a0a0a', border: '1px solid #2a2a2a',
              borderRadius: '8px', color: '#fff', fontSize: '1rem',
              outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>
      )}

      {/* Errores */}
      {errores.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          {errores.map((e, i) => (
            <div key={i} style={{ color: '#ff4d4d', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
              ⚠ {e}
            </div>
          ))}
        </div>
      )}

      {/* Botón ejecutar */}
      <button
        onClick={handleSubmit}
        disabled={procesando || (!precioVenta && !precioRecompra)}
        style={{
          width: '100%', padding: '0.8rem',
          background: procesando
            ? '#1a1a1a'
            : modo === 'venta' ? '#00e5a0' : '#4d79ff',
          color: procesando ? '#444' : '#000',
          border: 'none', borderRadius: '10px',
          fontWeight: 700, fontSize: '1rem',
          cursor: procesando ? 'default' : 'pointer',
          transition: 'all 0.2s'
        }}
      >
        {procesando ? 'Procesando...' : modo === 'venta' ? '↑ Ejecutar Venta' : '↓ Ejecutar Recompra'}
      </button>
    </div>
  )
}

function MiniCard({ label, valor, sub }) {
  return (
    <div style={{ background: '#111', borderRadius: '8px', padding: '0.6rem 0.7rem', border: '1px solid #1f1f1f' }}>
      <div style={{ color: '#f0b429', fontSize: '0.65rem', marginBottom: '0.2rem' }}>{label}</div>
      <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}>{valor}</div>
      {sub && <div style={{ color: '#aaa', fontSize: '0.65rem', marginTop: '0.1rem' }}>{sub}</div>}
    </div>
  )
}

function PreviewItem({ label, valor, positivo }) {
  return (
    <div>
      <div style={{ color: '#444', fontSize: '0.65rem' }}>{label}</div>
      <div style={{ color: positivo ? '#00e5a0' : '#ccc', fontWeight: 600, fontSize: '0.9rem' }}>
        {valor}
      </div>
    </div>
  )
}

function ResultadoOperacion({ resultado, onCerrar }) {
  return (
    <div style={{
      background: '#0d1f17', border: '1px solid #00e5a0',
      borderRadius: '14px', padding: '1.5rem', textAlign: 'center'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
        {resultado.tipo === 'venta' ? '✅' : '🔄'}
      </div>
      <div style={{ color: '#00e5a0', fontWeight: 700, fontSize: '1.1rem', marginBottom: '1rem' }}>
        {resultado.tipo === 'venta' ? 'Venta registrada' : 'Recompra registrada'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1.2rem' }}>
        <Metrica label="Monto" valor={`$${resultado.montoOperacion}`} />
        <Metrica label="Tokens" valor={resultado.tokens} />
        {resultado.tipo === 'venta' && (
          <>
            <Metrica label="Ganancia" valor={`+$${resultado.ganancia}`} verde />
            <Metrica label="Capital nuevo" valor={`$${resultado.capitalNuevo}`} />
          </>
        )}
        {resultado.tipo === 'recompra' && resultado.ahorro > 0 && (
          <Metrica label="Ahorro" valor={`+$${resultado.ahorro}`} verde />
        )}
      </div>

      <button onClick={onCerrar} style={{
        background: '#1a1a1a', border: '1px solid #333',
        color: '#ccc', padding: '0.6rem 1.5rem',
        borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem'
      }}>
        Nueva operación
      </button>
    </div>
  )
}

function Metrica({ label, valor, verde }) {
  return (
    <div style={{ background: '#0a0a0a', borderRadius: '8px', padding: '0.5rem' }}>
      <div style={{ color: '#444', fontSize: '0.65rem' }}>{label}</div>
      <div style={{ color: verde ? '#00e5a0' : '#ccc', fontWeight: 600 }}>{valor}</div>
    </div>
  )
}