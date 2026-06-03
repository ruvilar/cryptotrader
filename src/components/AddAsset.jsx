import { useState } from 'react'
import { supabase } from '../lib/supabase'

const ACTIVOS_DISPONIBLES = [
  { simbolo: 'ETHUSDT', nombre: 'Ethereum' },
  { simbolo: 'BTCUSDT', nombre: 'Bitcoin' },
  { simbolo: 'SOLUSDT', nombre: 'Solana' },
  { simbolo: 'BNBUSDT', nombre: 'BNB' },
  { simbolo: 'XRPUSDT', nombre: 'XRP' },
]

export default function AddAsset({ userId, onActivoAgregado }) {
  const [abierto, setAbierto]           = useState(false)
  const [simbolo, setSimbolo]           = useState('ETHUSDT')
  const [capitalInicial, setCapital]    = useState('')
  const [porcentaje, setPorcentaje]     = useState(25)
  const [guardando, setGuardando]       = useState(false)
  const [error, setError]               = useState(null)

  async function handleAgregar() {
    if (!capitalInicial || parseFloat(capitalInicial) <= 0) {
      setError('Ingresá un capital inicial válido')
      return
    }

    setGuardando(true)
    setError(null)

    const seleccionado = ACTIVOS_DISPONIBLES.find(a => a.simbolo === simbolo)
    const capital = parseFloat(capitalInicial)

    const { error: err } = await supabase
      .from('activos')
      .insert([{
        user_id:              userId,
        simbolo,
        nombre:               seleccionado.nombre,
        capital_inicial:      capital,
        capital_actual:       capital,
        porcentaje_operacion: porcentaje,
        activo:               true
      }])

    if (err) {
      setError(err.message.includes('unique')
        ? 'Ya tenés ese activo agregado'
        : err.message
      )
    } else {
      setAbierto(false)
      setCapital('')
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
          color: '#444', cursor: 'pointer',
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

      {/* Capital inicial */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ color: '#555', fontSize: '0.75rem', display: 'block', marginBottom: '0.4rem' }}>
          Capital inicial (USDT)
        </label>
        <input
          type="number"
          value={capitalInicial}
          onChange={e => setCapital(e.target.value)}
          placeholder="Ej: 1180"
          style={{
            width: '100%', padding: '0.7rem 1rem',
            background: '#0a0a0a', border: '1px solid #2a2a2a',
            borderRadius: '8px', color: '#fff', fontSize: '1rem',
            outline: 'none', boxSizing: 'border-box'
          }}
        />
      </div>

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