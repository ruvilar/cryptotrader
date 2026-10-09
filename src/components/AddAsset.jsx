import { useState } from 'react'
import { supabase } from '../lib/supabase'

const ACTIVOS_DISPONIBLES = [
  { simbolo: 'ETHUSDT', nombre: 'Ethereum' },
  { simbolo: 'BTCUSDT', nombre: 'Bitcoin' },
  { simbolo: 'SOLUSDT', nombre: 'Solana' },
  { simbolo: 'BNBUSDT', nombre: 'BNB' },
  { simbolo: 'XRPUSDT', nombre: 'XRP' },
]

const COMISIONES_PLATAFORMA = {
  Hapi: 1,
  Binance: 0.1,
  Kraken: 0.16
}

export default function AddAsset({ userId, onActivoAgregado }) {
  const [abierto, setAbierto]           = useState(false)
  const [simbolo, setSimbolo]           = useState('ETHUSDT')
  const [cantidadActivo, setCantidad]   = useState('')
  const [precioEntrada, setPrecioEntrada] = useState('')
  const [plataforma, setPlataforma]     = useState('Hapi')
  const [porcentaje, setPorcentaje]     = useState(25)
  const [guardando, setGuardando]       = useState(false)
  const [error, setError]               = useState(null)

  const valorEquivalente = cantidadActivo && precioEntrada
    ? parseFloat(cantidadActivo) * parseFloat(precioEntrada)
    : 0
  const comisionActual = COMISIONES_PLATAFORMA[plataforma] || 1

  async function handleAgregar() {
    if (!cantidadActivo || parseFloat(cantidadActivo) <= 0) {
      setError('Ingresá una cantidad válida del activo')
      return
    }

    if (!precioEntrada || parseFloat(precioEntrada) <= 0) {
      setError('Ingresá el precio de entrada del activo')
      return
    }

    setGuardando(true)
    setError(null)

    const seleccionado = ACTIVOS_DISPONIBLES.find(a => a.simbolo === simbolo)
    const capital = valorEquivalente

    const { error: err } = await supabase
      .from('activos')
      .insert([{
        user_id:              userId,
        simbolo,
        nombre:               seleccionado.nombre,
        capital_inicial:      capital,
        capital_actual:       capital,
        porcentaje_operacion: porcentaje,
        activo:               true,
        intervalo_precio:     500,
        precio_entrada:       parseFloat(precioEntrada) || 0
      }])

    if (err) {
      setError(err.message.includes('unique')
        ? 'Ya tenés ese activo agregado'
        : err.message
      )
    } else {
      setAbierto(false)
      setCantidad('')
      setPrecioEntrada('')
      setPlataforma('Hapi')
      onActivoAgregado?.()
    }

    setGuardando(false)
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        style={{
          width: '100%', padding: '0.8rem',
          background: 'transparent',
          border: '1px dashed #2a2a2a', borderRadius: '12px',
          color: '#f7f6f3', fontWeight: 'bold', cursor: 'pointer',
          fontSize: '0.9rem', transition: 'all 0.2s'
        }}
      >
        + Agregar activo
      </button>
    )
  }

  return (
    <div style={{
      background: '#111', border: '1px solid #2a2a2a',
      borderRadius: '14px', padding: '1.5rem'
    }}>
      <div style={{ color: '#ccc', fontWeight: 600, marginBottom: '1.2rem' }}>
        Nuevo activo
      </div>

      {/* Selector de activo */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ color: '#555', fontSize: '0.75rem', display: 'block', marginBottom: '0.4rem' }}>
          Activo
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {ACTIVOS_DISPONIBLES.map(a => (
            <button
              key={a.simbolo}
              onClick={() => setSimbolo(a.simbolo)}
              style={{
                padding: '0.4rem 0.8rem', borderRadius: '8px',
                background: simbolo === a.simbolo ? '#0d1f17' : '#1a1a1a',
                border: `1px solid ${simbolo === a.simbolo ? '#00e5a0' : '#2a2a2a'}`,
                color: simbolo === a.simbolo ? '#00e5a0' : '#555',
                cursor: 'pointer', fontSize: '0.8rem'
              }}
            >
              {a.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Cantidad del activo */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ color: '#555', fontSize: '0.75rem', display: 'block', marginBottom: '0.4rem' }}>
          Cantidad del activo
        </label>
        <input
          type="number"
          value={cantidadActivo}
          onChange={e => setCantidad(e.target.value)}
          placeholder="Ej: 0.37445494"
          style={{
            width: '100%', padding: '0.7rem 1rem',
            background: '#0a0a0a', border: '1px solid #2a2a2a',
            borderRadius: '8px', color: '#fff', fontSize: '1rem',
            outline: 'none', boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Precio de entrada */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ color: '#555', fontSize: '0.75rem', display: 'block', marginBottom: '0.4rem' }}>
          Precio de entrada (USDT por unidad)
        </label>
        <input
          type="number"
          value={precioEntrada}
          onChange={e => setPrecioEntrada(e.target.value)}
          placeholder="Ej: 2500"
          style={{
            width: '100%', padding: '0.7rem 1rem',
            background: '#0a0a0a', border: '1px solid #2a2a2a',
            borderRadius: '8px', color: '#fff', fontSize: '1rem',
            outline: 'none', boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ color: '#555', fontSize: '0.75rem', display: 'block', marginBottom: '0.4rem' }}>
          Plataforma de operación
        </label>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {Object.keys(COMISIONES_PLATAFORMA).map(p => (
            <button
              key={p}
              onClick={() => setPlataforma(p)}
              style={{
                padding: '0.4rem 0.8rem', borderRadius: '8px',
                background: plataforma === p ? '#0d1f17' : '#1a1a1a',
                border: `1px solid ${plataforma === p ? '#00e5a0' : '#2a2a2a'}`,
                color: plataforma === p ? '#00e5a0' : '#555',
                cursor: 'pointer', fontSize: '0.8rem'
              }}
            >
              {p} · {COMISIONES_PLATAFORMA[p]}%
            </button>
          ))}
        </div>
      </div>

      {valorEquivalente > 0 && (
        <div style={{
          background: '#0d1f17', border: '1px solid #00e5a0',
          borderRadius: '10px', padding: '0.8rem 1rem', marginBottom: '1rem'
        }}>
          <div style={{ color: '#aaa', fontSize: '0.7rem', marginBottom: '0.2rem' }}>Valor inicial equivalente</div>
          <div style={{ color: '#00e5a0', fontWeight: 700, fontSize: '1rem' }}>
            ${valorEquivalente.toFixed(2)} USD
          </div>
          <div style={{ color: '#f0b429', fontSize: '0.72rem', marginTop: '0.2rem' }}>
            {parseFloat(cantidadActivo).toFixed(6)} {simbolo.replace('USDT', '')} · precio ${parseFloat(precioEntrada).toFixed(2)}
          </div>
          <div style={{ color: '#aaa', fontSize: '0.7rem', marginTop: '0.25rem' }}>
            Comisión estimada en {plataforma}: {comisionActual}%
          </div>
        </div>
      )}

      {/* Porcentaje */}
      <div style={{ marginBottom: '1.2rem' }}>
        <label style={{ color: '#555', fontSize: '0.75rem', display: 'block', marginBottom: '0.4rem' }}>
          % a operar por defecto
        </label>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {[10, 15, 20, 25, 30].map(p => (
            <button
              key={p}
              onClick={() => setPorcentaje(p)}
              style={{
                flex: 1, padding: '0.4rem',
                background: porcentaje === p ? '#0d1f17' : '#1a1a1a',
                border: `1px solid ${porcentaje === p ? '#00e5a0' : '#2a2a2a'}`,
                color: porcentaje === p ? '#00e5a0' : '#555',
                borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem'
              }}
            >
              {p}%
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ color: '#ff4d4d', fontSize: '0.8rem', marginBottom: '0.8rem' }}>
          ⚠ {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.8rem' }}>
        <button
          onClick={() => setAbierto(false)}
          style={{
            flex: 1, padding: '0.7rem',
            background: 'transparent', border: '1px solid #2a2a2a',
            color: '#555', borderRadius: '8px', cursor: 'pointer'
          }}
        >
          Cancelar
        </button>
        <button
          onClick={handleAgregar}
          disabled={guardando}
          style={{
            flex: 2, padding: '0.7rem',
            background: guardando ? '#1a1a1a' : '#00e5a0',
            color: guardando ? '#444' : '#000',
            border: 'none', borderRadius: '8px',
            fontWeight: 700, cursor: guardando ? 'default' : 'pointer'
          }}
        >
          {guardando ? 'Guardando...' : 'Agregar activo'}
        </button>
      </div>
    </div>
  )
}