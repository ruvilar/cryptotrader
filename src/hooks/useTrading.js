import { useState } from 'react'
import {
  calcularVenta,
  calcularRecompra,
  calcularPorcentajeRecomendado,
  calcularMontoOperacion,
  calcularIntervaloEnUsd,
  calcularGananciaAcumulada,
  validarVenta,
  validarRecompra
} from '../lib/calculations'
import { useOperations } from './useOperations'
import { supabase } from '../lib/supabase'

export function useTrading(activo, userId) {
  const [procesando, setProcesando] = useState(false)
  const [errores, setErrores]       = useState([])
  const [resultado, setResultado]   = useState(null)

  const {
    operaciones,
    ultimaVenta,
    gananciaAcumuladaTotal,
    registrarVenta,
    registrarRecompra,
    eliminarOperacion,
    recargar,
    loading: loadingOps
  } = useOperations(activo?.id)

  // Porcentaje recomendado según capital actual
  const porcentajeRecomendado = activo
    ? calcularPorcentajeRecomendado(activo.capital_actual)
    : 25

  // Previsualización de venta (sin guardar)
  function previsualizarVenta({ porcentaje, precioActual, precioVenta }) {
    if (!activo || !precioActual || !precioVenta) return null
    const erroresVal = validarVenta({
      capitalTotal: activo.capital_actual,
      porcentaje,
      precioCompra: precioActual,  // ← renombrado
      precioVenta
    })
    if (erroresVal.length) return null

    return calcularVenta({
      capitalTotal: activo.capital_actual,
      porcentaje,
      precioActual,
      precioVenta
    })
  }

  // Previsualización de recompra (sin guardar)
  function previsualizarRecompra({ porcentaje, precioRecompra }) {
    if (!activo || !precioRecompra) return null
    const erroresVal = validarRecompra({
      capitalTotal: activo.capital_actual,
      porcentaje,
      precioRecompra
    })
    if (erroresVal.length) return null

    return calcularRecompra({
      capitalTotal:        activo.capital_actual,
      porcentaje,
      precioVentaAnterior: ultimaVenta?.precio_operacion || null,
      precioRecompra
    })
  }

  // Ejecutar venta y guardar en Supabase
  async function ejecutarVenta({ porcentaje, precioActual, precioVenta }) {
    setErrores([])
    setResultado(null)

    const erroresVal = validarVenta({
      capitalTotal: activo.capital_actual,
      porcentaje,
      precioCompra: precioActual,
      precioVenta
    })
    if (erroresVal.length) { setErrores(erroresVal); return null }

    setProcesando(true)
    const calculo = calcularVenta({
      capitalTotal: activo.capital_actual,
      porcentaje,
      precioActual,
      precioVenta
    })

    const gananciaAcum = calcularGananciaAcumulada(
      gananciaAcumuladaTotal,
      calculo.ganancia
    )

    // Guardar operación
    const { data, error } = await registrarVenta({
      activoId:          activo.id,
      userId,
      precioOperacion:   precioVenta,
      precioBase:        precioActual,
      montoUsdt:         calculo.montoOperacion,
      tokens:            calculo.tokens,
      ganancia:          calculo.ganancia,
      gananciaAcumulada: gananciaAcum,
      capitalAntes:      activo.capital_actual,
      capitalDespues:    calculo.capitalNuevo
    })

    if (error) { setErrores([error]); setProcesando(false); return null }

    // Actualizar capital del activo en Supabase
    await supabase
      .from('activos')
      .update({ capital_actual: calculo.capitalNuevo })
      .eq('id', activo.id)

    setResultado({ tipo: 'venta', ...calculo, gananciaAcumulada: gananciaAcum })
    setProcesando(false)
    return calculo
  }

  // Ejecutar recompra y guardar en Supabase
  async function ejecutarRecompra({ porcentaje, precioRecompra }) {
    setErrores([])
    setResultado(null)

    const erroresVal = validarRecompra({
      capitalTotal: activo.capital_actual,
      porcentaje,
      precioRecompra
    })
    if (erroresVal.length) { setErrores(erroresVal); return null }

    setProcesando(true)
    const calculo = calcularRecompra({
      capitalTotal:        activo.capital_actual,
      porcentaje,
      precioVentaAnterior: ultimaVenta?.precio_operacion || null,
      precioRecompra
    })

    // Guardar operación
    const { data, error } = await registrarRecompra({
      activoId:          activo.id,
      userId,
      precioOperacion:   precioRecompra,
      precioBase:        ultimaVenta?.precio_operacion || precioRecompra,
      montoUsdt:         calculo.montoOperacion,
      tokens:            calculo.tokens,
      ahorro:            calculo.ahorro,
      gananciaAcumulada: gananciaAcumuladaTotal,
      capitalAntes:      activo.capital_actual,
      capitalDespues:    calculo.capitalNuevo
    })

    if (error) { setErrores([error]); setProcesando(false); return null }

    setResultado({ tipo: 'recompra', ...calculo })
    setProcesando(false)
    return calculo
  }

  // Intervalo en USD según precio actual
  function intervaloEnUsd(precioActual, intervaloPct) {
    return calcularIntervaloEnUsd(precioActual, intervaloPct)
  }

  return {
    // Estado
    procesando,
    errores,
    resultado,
    loadingOps,

    // Datos de operaciones
    operaciones,
    ultimaVenta,
    gananciaAcumuladaTotal,
    porcentajeRecomendado,

    // Acciones
    previsualizarVenta,
    previsualizarRecompra,
    ejecutarVenta,
    ejecutarRecompra,
    eliminarOperacion,
    intervaloEnUsd,
    recargar,

    // Limpiar estado
    limpiarResultado: () => setResultado(null),
    limpiarErrores:   () => setErrores([])
  }
}