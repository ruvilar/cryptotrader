import { useState, useEffect, useRef, useCallback } from 'react'

const BINANCE_API = 'https://api.binance.com/api/v3/ticker/price'
const INTERVALO_REFRESCO = 15000 // actualiza cada 15 segundos

export function useBinancePrice(simbolo) {
  const [precio, setPrecio]         = useState(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null)
  const intervalRef = useRef(null)

  const fetchPrecio = useCallback(async () => {
    if (!simbolo) return
    setLoading(true)
    setError(null)

    try {
      const res  = await fetch(`${BINANCE_API}?symbol=${simbolo.toUpperCase()}`)
      if (!res.ok) throw new Error(`Error HTTP ${res.status}`)
      const data = await res.json()
      setPrecio(parseFloat(data.price))
      setUltimaActualizacion(new Date())
    } catch (err) {
      setError('No se pudo obtener el precio de Binance')
      console.error('Binance API error:', err.message)
    } finally {
      setLoading(false)
    }
  }, [simbolo])

  useEffect(() => {
    if (!simbolo) return

    fetchPrecio()

    // Refresca automáticamente cada 15 segundos
    intervalRef.current = setInterval(fetchPrecio, INTERVALO_REFRESCO)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [simbolo, fetchPrecio])

  // Formatea el precio según el activo
  function formatearPrecio(valor) {
    if (!valor) return '—'
    const sym = simbolo?.toUpperCase() || ''
    if (sym.startsWith('BTC')) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency', currency: 'USD', minimumFractionDigits: 0
      }).format(valor)
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 2
    }).format(valor)
  }

  return {
    precio,
    loading,
    error,
    ultimaActualizacion,
    formatearPrecio,
    refrescar: fetchPrecio
  }
}


// =============================================
// Hook para múltiples símbolos a la vez
// Usado en el Dashboard para ver todos los activos
// =============================================
export function useBinancePrecioMultiple(simbolos = []) {
  const [precios, setPrecios]   = useState({})
  const [loading, setLoading]   = useState(false)
  const intervalRef = useRef(null)

  const fetchTodos = useCallback(async () => {
    if (!simbolos.length) return
    setLoading(true)

    try {
      const promesas = simbolos.map(sim =>
        fetch(`${BINANCE_API}?symbol=${sim.toUpperCase()}`)
          .then(r => r.json())
          .then(d => ({ simbolo: sim, precio: parseFloat(d.price) }))
          .catch(() => ({ simbolo: sim, precio: null }))
      )
      const resultados = await Promise.all(promesas)
      const mapa = {}
      resultados.forEach(({ simbolo, precio }) => { mapa[simbolo] = precio })
      setPrecios(mapa)
    } catch (err) {
      console.error('Error precios múltiples:', err)
    } finally {
      setLoading(false)
    }
  }, [simbolos.join(',')])

  useEffect(() => {
    fetchTodos()
    intervalRef.current = setInterval(fetchTodos, INTERVALO_REFRESCO)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [fetchTodos])

  return { precios, loading, refrescar: fetchTodos }
}