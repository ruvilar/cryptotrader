import PriceWidget from './PriceWidget'
import { calcularPorcentajeRecomendado } from '../lib/calculations'

export default function AssetPanel({ activo, onSeleccionar, seleccionado }) {
  const pctRecomendado = calcularPorcentajeRecomendado(activo.capital_actual)
  const ganancia = activo.capital_actual - activo.capital_inicial
  const gananciaPositiva = ganancia >= 0

  return (
    <div
      onClick={() => onSeleccionar(activo)}
      style={{
        background: seleccionado ? '#0d1f17' : '#111',
        border: `1px solid ${seleccionado ? '#00e5a0' : '#1e1e1e'}`,
        borderRadius: '14px', padding: '1.2rem', cursor: 'pointer',
        transition: 'all 0.2s', marginBottom: '0.8rem'
      }}
    >
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
            {activo.nombre}
          </div>
          <div style={{ color: '#555', fontSize: '0.75rem' }}>
            {activo.simbolo.toUpperCase()}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: gananciaPositiva ? '#00e5a0' : '#ff4d4d', fontWeight: 700 }}>
            {gananciaPositiva ? '+' : ''}${ganancia.toFixed(2)}
          </div>
          <div style={{ color: '#444', fontSize: '0.7rem' }}>
            {((ganancia / activo.capital_inicial) * 100).toFixed(1)}% total
          </div>
        </div>
      </div>

      {/* Precio en vivo */}
      <PriceWidget simbolo={activo.simbolo} />

      {/* Métricas */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        gap: '0.6rem', marginTop: '0.8rem'
      }}>
        <Metrica label="Capital inicial" valor={`$${activo.capital_inicial.toFixed(2)}`} />
        <Metrica label="Capital actual" valor={`$${activo.capital_actual.toFixed(2)}`} highlight />
        <Metrica label="% a operar" valor={`${activo.porcentaje_operacion}%`} dimmed={`rec. ${pctRecomendado}%`} />
      </div>
    </div>
  )
}

function Metrica({ label, valor, highlight, dimmed }) {
  return (
    <div style={{
      background: '#0a0a0a', borderRadius: '8px', padding: '0.5rem 0.7rem'
    }}>
      <div style={{ color: '#444', fontSize: '0.65rem', marginBottom: '0.2rem' }}>
        {label}
      </div>
      <div style={{ color: highlight ? '#00e5a0' : '#ccc', fontWeight: 600, fontSize: '0.9rem' }}>
        {valor}
      </div>
      {dimmed && (
        <div style={{ color: '#444', fontSize: '0.65rem' }}>{dimmed}</div>
      )}
    </div>
  )
}