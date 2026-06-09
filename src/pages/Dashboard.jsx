import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import AssetPanel from '../components/AssetPanel'
import OperationForm from '../components/OperationForm'
import History from '../components/History'
import AddAsset from '../components/AddAsset'
import { calcularResumenRendimiento } from '../lib/calculations'
import MarketContext from '../components/MarketContext'
import { useBinancePrice } from '../hooks/useBinancePrice'
import { useAlerts }  from '../hooks/useAlerts'
import AlertPanel     from '../components/AlertPanel'

export default function Dashboard() {
  const { user } = useAuth()
  const [activos, setActivos]             = useState([])
  const [activoSeleccionado, setActivo]   = useState(null)
  const [operaciones, setOperaciones]     = useState([])
  const [loadingActivos, setLoadingActivos] = useState(true)
  const [loadingOps, setLoadingOps]       = useState(false)
  const [vista, setVista]                 = useState('operar') // 'operar' | 'historial'

  const { precio: precioActual } = useBinancePrice(activoSeleccionado?.simbolo)
  const preciosPorSimbolo = activos.reduce((acc, a) => {
    if (activoSeleccionado?.simbolo === a.simbolo && precioActual) {
      acc[a.simbolo] = precioActual
    }
    return acc
  }, {})
  const { alertas, disparadas, agregarAlerta, descartarAlerta, eliminarAlerta } = useAlerts(user?.id, preciosPorSimbolo)

  // Cargar activos del usuario
  const cargarActivos = useCallback(async () => {
    if (!user) return
    setLoadingActivos(true)

    const { data } = await supabase
      .from('activos')
      .select('*')
      .eq('user_id', user.id)
      .eq('activo', true)
      .order('creado_en', { ascending: true })

    setActivos(data || [])

    // Seleccionar el primero automáticamente si no hay ninguno seleccionado
    if (data?.length && !activoSeleccionado) {
      setActivo(data[0])
    }

    // Actualizar el activo seleccionado con datos frescos
    if (activoSeleccionado && data?.length) {
      const fresco = data.find(a => a.id === activoSeleccionado.id)
      if (fresco) setActivo(fresco)
    }

    setLoadingActivos(false)
  }, [user])

  // Cargar operaciones del activo seleccionado
  const cargarOperaciones = useCallback(async () => {
    if (!activoSeleccionado) return
    setLoadingOps(true)

    const { data } = await supabase
      .from('operaciones')
      .select('*')
      .eq('activo_id', activoSeleccionado.id)
      .order('creado_en', { ascending: false })

    setOperaciones(data || [])
    setLoadingOps(false)
  }, [activoSeleccionado?.id])

  useEffect(() => { cargarActivos() }, [cargarActivos])
  useEffect(() => { cargarOperaciones() }, [cargarOperaciones])

  // Seleccionar activo y resetear vista
  function seleccionarActivo(activo) {
    setActivo(activo)
    setVista('operar')
    setOperaciones([])
  }

  // Eliminar operación
  async function eliminarOperacion(id) {
    await supabase.from('operaciones').delete().eq('id', id)
    await cargarOperaciones()
    await cargarActivos()
  }

  // Resumen global de todas las operaciones
  const resumen = calcularResumenRendimiento(operaciones)

  // Capital total sumando todos los activos
  const capitalTotal = activos.reduce((acc, a) => acc + (a.capital_actual || 0), 0)
  const capitalInicial = activos.reduce((acc, a) => acc + (a.capital_inicial || 0), 0)
  const gananciaTotal = capitalTotal - capitalInicial

  if (loadingActivos) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 60px)', background: '#0a0a0a',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ color: '#333' }}>Cargando...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#0a0a0a', padding: '1.5rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Resumen global */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem', marginBottom: '2rem'
        }}>
          <TarjetaResumen
            label="Capital total"
            valor={`$${capitalTotal.toFixed(2)}`}
            sub={`inicial $${capitalInicial.toFixed(2)}`}
          />
          <TarjetaResumen
            label="Ganancia total"
            valor={`${gananciaTotal >= 0 ? '+' : ''}$${gananciaTotal.toFixed(2)}`}
            positivo={gananciaTotal >= 0}
            sub={`${capitalInicial > 0 ? ((gananciaTotal / capitalInicial) * 100).toFixed(1) : '0.0'}% del capital`}
          />
          <TarjetaResumen
            label="Operaciones"
            valor={resumen.totalOperaciones}
            sub={`${resumen.totalVentas} ventas · ${resumen.totalRecompras} recompras`}
          />
          <TarjetaResumen
            label="Mejor venta"
            valor={resumen.mejorVenta > 0 ? `+$${resumen.mejorVenta}` : '—'}
            positivo={resumen.mejorVenta > 0}
            sub="ganancia única"
          />
        </div>

        {/* Layout principal: sidebar + contenido */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem' }}>

          {/* Sidebar: lista de activos */}
          <div>
            <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.75rem', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Mis activos
            </div>

            {activos.length === 0 ? (
              <div style={{
                background: '#111111', border: '1px solid #1e1e1e',
                borderRadius: '14px', padding: '2rem', textAlign: 'center',
                color: 'rgb(253, 233, 191)', marginBottom: '0.8rem'
              }}>
                No tenés activos todavía. Agregá uno para empezar a operar.
              </div>
            ) : (
              activos.map(activo => (
                <AssetPanel
                  key={activo.id}
                  activo={activo}
                  seleccionado={activoSeleccionado?.id === activo.id}
                  onSeleccionar={seleccionarActivo}
                  onEliminado={() => {
                    setActivo(null)
                    cargarActivos()
                  }}
                />
              ))
            )}

            <AddAsset
              userId={user.id}
              onActivoAgregado={cargarActivos}
            />
          </div>

          {/* Contenido principal */}
          <div>
            {!activoSeleccionado ? (
              <div style={{
                background: '#111', border: '1px solid #1e1e1e',
                borderRadius: '14px', padding: '3rem', textAlign: 'center'
              }}>
                <div style={{ color: '#fff', fontSize: '2rem', marginBottom: '0.5rem' }}>←</div>
                <div style={{ color: '#999', fontWeight: 'bold', }}>Selecciona un activo para operar</div>
              </div>
            ) : (
              <>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem' }}>
                  {[
                    { id: 'operar',    label: 'Panel de Operaciones' },
                    { id: 'historial', label: `Historial (${operaciones.length})` }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setVista(tab.id)}
                      style={{
                        padding: '0.5rem 1.2rem',
                        background: vista === tab.id ? '#1a2e1a' : 'transparent',
                        border: `1px solid ${vista === tab.id ? '#00e5a0' : '#2a2a2a'}`,
                        color: vista === tab.id ? '#00e5a0' : '#aaa',
                        borderRadius: '8px', cursor: 'pointer',
                        fontSize: '0.85rem', fontWeight: 600
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Panel operar */}
                {vista === 'operar' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'start' }}>
                    <div>
                      <OperationForm
                        activo={activoSeleccionado}
                        userId={user.id}
                        onOperacionCompletada={() => {
                          cargarActivos()
                          cargarOperaciones()
                        }}
                      />
                    </div>

                    <div>
                      <MarketContext
                        simbolo={activoSeleccionado.simbolo}
                        precioActual={precioActual}
                        precioEntrada={activoSeleccionado.precio_entrada || 2000}
                        intervaloUsd={activoSeleccionado.intervalo_precio || 500}
                        capitalTotal={activoSeleccionado.capital_actual}
                        porcentaje={activoSeleccionado.porcentaje_operacion}
                      />
                      <AlertPanel
                        simbolos={activos.map(a => a.simbolo)}
                        userId={user?.id}
                        alertas={alertas}
                        disparadas={disparadas}
                        agregarAlerta={agregarAlerta}
                        descartarAlerta={descartarAlerta}
                        eliminarAlerta={eliminarAlerta}
                      />
                    </div>
                  </div>
                )}

                {/* Panel historial */}
                {vista === 'historial' && (
                  <History
                    operaciones={operaciones}
                    loading={loadingOps}
                    onEliminar={eliminarOperacion}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function TarjetaResumen({ label, valor, sub, positivo }) {
  return (
    <div style={{
      background: '#111', border: '1px solid #1e1e1e',
      borderRadius: '14px', padding: '1.2rem'
    }}>
      <div style={{ color: '#fde9bf', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{
        color: positivo === true ? '#00e5a0' : positivo === false ? '#ff4d4d' : '#fff',
        fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.2rem'
      }}>
        {valor}
      </div>
      {sub && <div style={{ color: '#fde9bf', fontSize: '0.80rem', fontStyle: 'italic' }}>{sub}</div>}
    </div>
  )
}