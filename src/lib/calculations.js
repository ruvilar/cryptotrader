// =============================================
// CRYPTOTRADER - Lógica matemática central
// Toda la estrategia de trading en funciones puras
// =============================================


// =============================================
// 1. ESCALA DE PORCENTAJE SEGÚN CAPITAL
// A mayor capital, mayor % a operar
// =============================================
export function calcularPorcentajeRecomendado(capitalTotal) {
  if (capitalTotal <= 1000)  return 10
  if (capitalTotal <= 3000)  return 15
  if (capitalTotal <= 7000)  return 20
  if (capitalTotal <= 15000) return 25
  return 30
}


// =============================================
// 2. MONTO A OPERAR
// Cuántos USDT se usan en la operación
// =============================================
export function calcularMontoOperacion(capitalTotal, porcentaje) {
  return redondear(capitalTotal * (porcentaje / 100))
}


// =============================================
// 3. TOKENS A OPERAR
// Cuántas unidades del activo se compran o venden
// =============================================
export function calcularTokens(montoUsdt, precioActivo) {
  if (!precioActivo || precioActivo <= 0) return 0
  return montoUsdt / precioActivo
}


// =============================================
// 4. CÁLCULO DE VENTA
// El usuario vende tokens cuando el precio sube
// =============================================
export function calcularVenta({
  capitalTotal,
  porcentaje,
  precioActual,
  precioVenta
}) {
  const montoOperacion = calcularMontoOperacion(capitalTotal, porcentaje)
  const tokensCantidad  = calcularTokens(montoOperacion, precioActual)
  const montoRecibido   = redondear(tokensCantidad * precioVenta)
  const ganancia        = redondear(montoRecibido - montoOperacion)
  const capitalNuevo    = redondear(capitalTotal + ganancia)

  return {
    montoOperacion:  redondear(montoOperacion),
    tokens:          redondear8(tokensCantidad),
    montoRecibido,
    ganancia,
    capitalNuevo,
    porcentajeGanancia: redondear((ganancia / montoOperacion) * 100)
  }
}


// =============================================
// 5. CÁLCULO DE RECOMPRA
// El usuario recompra tokens cuando el precio baja
// =============================================
export function calcularRecompra({
  capitalTotal,
  porcentaje,
  precioVentaAnterior,
  precioRecompra
}) {
  const montoOperacion  = calcularMontoOperacion(capitalTotal, porcentaje)
  const tokensCantidad  = calcularTokens(montoOperacion, precioRecompra)

  // Ahorro: comprás más tokens con el mismo dinero porque el precio bajó
  const ahorro = precioVentaAnterior
    ? redondear((precioVentaAnterior - precioRecompra) * tokensCantidad)
    : 0

  // El capital USDT no baja al recomprar: convertís USDT → tokens ETH/BTC
  // El capital se mantiene igual, solo cambia de forma
  return {
    montoOperacion:  redondear(montoOperacion),
    tokens:          redondear8(tokensCantidad),
    ahorro,
    capitalNuevo:    capitalTotal  // no cambia al recomprar
  }
}


// =============================================
// 6. PRECIO OBJETIVO DE VENTA
// Dado un precio base y un % de intervalo,
// calcula el próximo precio de venta
// =============================================
export function calcularPrecioObjetivoVenta(precioBase, intervaloPorcentaje) {
  return redondear(precioBase * (1 + intervaloPorcentaje / 100))
}


// =============================================
// 7. PRECIO OBJETIVO DE RECOMPRA
// Dado un precio base y un % de intervalo,
// calcula el próximo precio de recompra
// =============================================
export function calcularPrecioObjetivoRecompra(precioBase, intervaloPorcentaje) {
  return redondear(precioBase * (1 - intervaloPorcentaje / 100))
}


// =============================================
// 8. EQUIVALENTE EN USD DE UN INTERVALO %
// Muestra cuántos USD equivale ese % al precio actual
// Ej: 25% con ETH a $2000 = $500
// =============================================
export function calcularIntervaloEnUsd(precioActual, intervaloPorcentaje) {
  return redondear(precioActual * (intervaloPorcentaje / 100))
}


// =============================================
// 9. GANANCIA ACUMULADA
// Suma de todas las ganancias de ventas anteriores
// más la ganancia de la operación actual
// =============================================
export function calcularGananciaAcumulada(gananciaAnterior, gananciaActual) {
  return redondear((gananciaAnterior || 0) + (gananciaActual || 0))
}


// =============================================
// 10. RESUMEN DE RENDIMIENTO
// Métricas globales para mostrar en el dashboard
// =============================================
export function calcularResumenRendimiento(operaciones) {
  const ventas    = operaciones.filter(op => op.tipo === 'venta')
  const recompras = operaciones.filter(op => op.tipo === 'recompra')

  const totalGanancia   = ventas.reduce((acc, op) => acc + (op.ganancia || 0), 0)
  const totalAhorro     = recompras.reduce((acc, op) => acc + (op.ahorro || 0), 0)
  const promedioGanancia = ventas.length > 0
    ? totalGanancia / ventas.length
    : 0

  return {
    totalOperaciones:  operaciones.length,
    totalVentas:       ventas.length,
    totalRecompras:    recompras.length,
    totalGanancia:     redondear(totalGanancia),
    totalAhorro:       redondear(totalAhorro),
    promedioGanancia:  redondear(promedioGanancia),
    mejorVenta:        ventas.length > 0
      ? redondear(Math.max(...ventas.map(op => op.ganancia || 0)))
      : 0
  }
}


// =============================================
// 11. VALIDACIONES
// Verifican que los datos sean correctos antes
// de calcular para evitar errores silenciosos
// =============================================
export function validarVenta({ capitalTotal, porcentaje, precioActual, precioVenta }) {
  const errores = []

  if (!capitalTotal || capitalTotal <= 0)
    errores.push('El capital total debe ser mayor a 0')

  if (!porcentaje || porcentaje <= 0 || porcentaje > 100)
    errores.push('El porcentaje debe estar entre 1 y 100')

  if (!precioActual || precioActual <= 0)
    errores.push('El precio actual debe ser mayor a 0')

  if (!precioVenta || precioVenta <= 0)
    errores.push('El precio de venta debe ser mayor a 0')

  if (precioVenta && precioActual && precioVenta <= precioActual)
    errores.push('El precio de venta debe ser mayor al precio actual')

  return errores
}

export function validarRecompra({ capitalTotal, porcentaje, precioRecompra }) {
  const errores = []

  if (!capitalTotal || capitalTotal <= 0)
    errores.push('El capital total debe ser mayor a 0')

  if (!porcentaje || porcentaje <= 0 || porcentaje > 100)
    errores.push('El porcentaje debe estar entre 1 y 100')

  if (!precioRecompra || precioRecompra <= 0)
    errores.push('El precio de recompra debe ser mayor a 0')

  return errores
}


// =============================================
// UTILIDADES INTERNAS
// =============================================

// Redondea a 2 decimales (para USDT y precios)
function redondear(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100
}

// Redondea a 8 decimales (para tokens como BTC/ETH)
function redondear8(valor) {
  return Math.round((valor + Number.EPSILON) * 100000000) / 100000000
}