import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useOperations(activoId) {
  const [operaciones, setOperaciones] = useState([])
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)

  // Cargar operaciones del activo
  const cargarOperaciones = useCallback(async () => {
    if (!activoId) return
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('operaciones')
      .select('*')
      .eq('activo_id', activoId)
      .order('creado_en', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setOperaciones(data || [])
    }
    setLoading(false)
  }, [activoId])

  useEffect(() => {
    cargarOperaciones()
  }, [cargarOperaciones])

  // Registrar una venta
  async function registrarVenta({
    activoId,
    userId,
    precioOperacion,
    precioBase,
    montoUsdt,
    tokens,
    ganancia,
    gananciaAcumulada,
    capitalAntes,
    capitalDespues
  }) {
    const { data, error } = await supabase
      .from('operaciones')
      .insert([{
        user_id:            userId,
        activo_id:          activoId,
        tipo:               'venta',
        precio_operacion:   precioOperacion,
        precio_base:        precioBase,
        monto_usdt:         montoUsdt,
        tokens,
        ganancia,
        ahorro:             0,
        ganancia_acumulada: gananciaAcumulada,
        capital_antes:      capitalAntes,
        capital_despues:    capitalDespues
      }])
      .select()
      .single()

    if (error) return { error: error.message }
    await cargarOperaciones()
    return { data }
  }

  // Registrar una recompra
  async function registrarRecompra({
    activoId,
    userId,
    precioOperacion,
    precioBase,
    montoUsdt,
    tokens,
    ahorro,
    gananciaAcumulada,
    capitalAntes,
    capitalDespues
  }) {
    const { data, error } = await supabase
      .from('operaciones')
      .insert([{
        user_id:            userId,
        activo_id:          activoId,
        tipo:               'recompra',
        precio_operacion:   precioOperacion,
        precio_base:        precioBase,
        monto_usdt:         montoUsdt,
        tokens,
        ganancia:           0,
        ahorro,
        ganancia_acumulada: gananciaAcumulada,
        capital_antes:      capitalAntes,
        capital_despues:    capitalDespues
      }])
      .select()
      .single()

    if (error) return { error: error.message }
    await cargarOperaciones()
    return { data }
  }

  // Eliminar una operación por id
  async function eliminarOperacion(id) {
    const { error } = await supabase
      .from('operaciones')
      .delete()
      .eq('id', id)

    if (error) return { error: error.message }
    await cargarOperaciones()
    return { ok: true }
  }

  // Última venta registrada (para calcular ahorro en próxima recompra)
  const ultimaVenta = operaciones.find(op => op.tipo === 'venta') || null

  // Ganancia acumulada total
  const gananciaAcumuladaTotal = operaciones
    .filter(op => op.tipo === 'venta')
    .reduce((acc, op) => acc + (op.ganancia || 0), 0)

  return {
    operaciones,
    loading,
    error,
    ultimaVenta,
    gananciaAcumuladaTotal,
    registrarVenta,
    registrarRecompra,
    eliminarOperacion,
    recargar: cargarOperaciones
  }
}