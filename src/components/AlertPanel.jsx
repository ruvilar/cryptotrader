import { useState } from 'react'

export default function AlertPanel({ simbolos, userId, alertas, disparadas, agregarAlerta, descartarAlerta, eliminarAlerta }) {
  const [form, setForm] = useState({
    simbolo: simbolos[0] || 'ETHUSDT',
    condicion: 'supera',
    precioObjetivo: '',
    mensaje: ''
  })
  const [guardando, setGuardando] = useState(false)
  const [ok,        setOk]        = useState(false)

  const handleGuardar = async () => {
    if (!form.precioObjetivo) return
    setGuardando(true)
    const mensajeAuto = form.mensaje ||
      `${form.simbolo} ${form.condicion === 'supera' ? 'superó' : 'cayó a'} $${form.precioObjetivo}`
    const exito = await agregarAlerta({
      simbolo:       form.simbolo,
      condicion:     form.condicion,
      precioObjetivo: parseFloat(form.precioObjetivo),
      mensaje:       mensajeAuto
    })
    setGuardando(false)
    if (exito) { setOk(true); setTimeout(() => setOk(false), 2000) }
  }

  return (
    <div style={estiloCard}>
      <div style={{ color: '#ccc', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem' }}>
        🔔 Alertas de precio
      </div>

      {/* Alertas disparadas */}
      {disparadas.map(a => (
        <div key={a.id} style={{
          background: '#1a0a00', border: '1px solid #f0b42966',
          borderRadius: '10px', padding: '0.8rem 1rem',
          marginBottom: '0.8rem', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <div style={{ color: '#f0b429', fontWeight: 700, fontSize: '0.85rem' }}>
              ⚡ {a.mensaje}
            </div>
            <div style={{ color: '#666', fontSize: '0.7rem', marginTop: '0.2rem' }}>
              {a.simbolo} · ${a.precio_objetivo.toLocaleString()}
            </div>
          </div>
          <button onClick={() => descartarAlerta(a.id)} style={{
            background: 'transparent', border: '1px solid #333',
            color: '#666', borderRadius: '6px', padding: '0.3rem 0.6rem',
            cursor: 'pointer', fontSize: '0.75rem'
          }}>✕</button>
        </div>
      ))}

      {/* Alertas activas */}
      {alertas.length > 0 && (
        <div style={{ marginBottom: '0.8rem' }}>
          <div style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '0.4rem' }}>Activas</div>
            {alertas.map(a => (
              <div key={a.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.4rem 0', borderBottom: '2px solid #fff',
                fontSize: '0.78rem', color: '#888', fontWeight: 700
              }}>
                <span>{a.simbolo} {a.condicion === 'supera' ? '↑' : '↓'} ${a.precio_objetivo.toLocaleString()}</span>
                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                    <span style={{ color: '#eaddc0' }}>{a.mensaje}</span>
                    <button
                    onClick={() => eliminarAlerta(a.id)}
                    style={{
                        background: 'transparent', border: '1px solid #2a2a2a',
                        color: '#fff', borderRadius: '6px', padding: '0.2rem 0.5rem',
                        cursor: 'pointer', fontSize: '0.7rem'
                    }}
                    >✕</button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Formulario nueva alerta */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.6rem' }}>
        <div>
          <div style={estiloLabel}>Activo</div>
          <select value={form.simbolo}
            onChange={e => setForm(p => ({ ...p, simbolo: e.target.value }))}
            style={estiloInput}>
            {simbolos.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <div style={estiloLabel}>Condición</div>
          <select value={form.condicion}
            onChange={e => setForm(p => ({ ...p, condicion: e.target.value }))}
            style={estiloInput}>
            <option value="supera">Supera precio</option>
            <option value="cae_a">Cae a precio</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '0.6rem' }}>
        <div style={estiloLabel}>Precio objetivo (USDT)</div>
        <input
          type="number"
          placeholder="Ej: 2000"
          value={form.precioObjetivo}
          onChange={e => setForm(p => ({ ...p, precioObjetivo: e.target.value }))}
          style={estiloInput}
        />
      </div>

      <div style={{ marginBottom: '0.8rem' }}>
        <div style={estiloLabel}>Mensaje personalizado (opcional)</div>
        <input
          type="text"
          placeholder="Ej: ETH llegó a mi objetivo de venta"
          value={form.mensaje}
          onChange={e => setForm(p => ({ ...p, mensaje: e.target.value }))}
          style={estiloInput}
        />
      </div>

      <button onClick={handleGuardar} disabled={guardando} style={{
        width: '100%', background: ok ? '#00e5a0' : '#1a1a1a',
        border: '1px solid #333', borderRadius: '8px',
        color: ok ? '#000' : '#ccc', padding: '0.65rem',
        cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
        transition: 'all 0.3s'
      }}>
        {ok ? '✓ Alerta guardada' : guardando ? 'Guardando...' : '+ Agregar alerta'}
      </button>
    </div>
  )
}

const estiloCard = {
  background: '#111', border: '1px solid #1e1e1e',
  borderRadius: '14px', padding: '1.2rem', marginTop: '1rem'
}
const estiloLabel = { color: '#f0b429', fontSize: '0.75rem', marginBottom: '0.3rem' }
const estiloInput = {
  width: '100%', background: '#0a0a0a', border: '1px solid #222',
  borderRadius: '8px', padding: '0.5rem 0.7rem',
  color: '#ccc', fontSize: '0.85rem', boxSizing: 'border-box'
}