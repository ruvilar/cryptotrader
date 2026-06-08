import { useState, useEffect, useRef, useCallback } from 'react'

const BINANCE_TICKER  = 'https://api.binance.com/api/v3/ticker/24hr'
const BINANCE_KLINES  = 'https://api.binance.com/api/v3/klines'
const COINGECKO_CHART = 'https://api.coingecko.com/api/v3/coins'

// Mapa símbolo Binance → id CoinGecko
const COINGECKO_IDS = {
  ETHUSDT: 'ethereum',
  BTCUSDT: 'bitcoin',
  SOLUSDT: 'solana',
  BNBUSDT: 'binancecoin',
  XRPUSDT: 'ripple',
}

// Calcula RSI de 14 períodos
function calcularRSI(precios, periodos = 14) {
  if (precios.length < periodos + 1) return null
  let ganancias = 0, perdidas = 0
  for (let i = 1; i <= periodos; i++) {
    const diff = precios[i] - precios[i - 1]
    if (diff > 0) ganancias += diff
    else perdidas += Math.abs(diff)
  }
  const avgGanancia = ganancias / periodos
  const avgPerdida  = perdidas  / periodos
  if (avgPerdida === 0) return 100
  const rs = avgGanancia / avgPerdida
  return Math.round(100 - 100 / (1 + rs))
}

// Semáforo: ¿el intervalo del usuario es alcanzable hoy?
function evaluarIntervalo(rangoDia, intervaloUsd) {
  if (!rangoDia || !intervaloUsd) return null
  const ratio = intervaloUsd / rangoDia
  if (ratio <= 0.5)  return { color: '#00e5a0', emoji: '🟢', texto: 'Muy alcanzable hoy' }
  if (ratio <= 0.85) return { color: '#f0b429', emoji: '🟡', texto: 'Alcanzable con suerte' }
  return { color: '#ff4d4d', emoji: '🔴', texto: 'Difícil de alcanzar hoy' }
}

// Texto descriptivo del RSI
function textoRSI(rsi) {
  if (rsi === null) return { texto: '—', color: '#555' }
  if (rsi >= 70)   return { texto: `${rsi} — sobrecomprado (probable caída)`,  color: '#ff4d4d' }
  if (rsi <= 30)   return { texto: `${rsi} — sobrevendido (probable suba)`,    color: '#00e5a0' }
  if (rsi >= 55)   return { texto: `${rsi} — zona alcista`,                    color: '#f0b429' }
  if (rsi <= 45)   return { texto: `${rsi} — zona bajista`,                    color: '#f0b429' }
  return             { texto: `${rsi} — zona neutral`,                          color: '#888'    }
}

export default function MarketContext({ simbolo, precioActual, precioEntrada, intervaloUsd, capitalTotal, porcentaje }) {
  const [ticker,      setTicker]      = useState(null)
  const [rsi,         setRsi]         = useState(null)
  const [volat7d,     setVolat7d]     = useState(null)
  const [tendencia,   setTendencia]   = useState(null) // 'sube' | 'baja' | 'lateral'
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const intervalRef = useRef(null)

  const fetchDatos = useCallback(async () => {
    if (!simbolo) return
    setError(null)

    try {
      // 1. Ticker 24h de Binance
      const resTicker = await fetch(`${BINANCE_TICKER}?symbol=${simbolo.toUpperCase()}`)
      const dataTicker = await resTicker.json()

      const rangoDia     = parseFloat(dataTicker.highPrice) - parseFloat(dataTicker.lowPrice)
      const cambio24h    = parseFloat(dataTicker.priceChangePercent)
      const alto24h      = parseFloat(dataTicker.highPrice)
      const bajo24h      = parseFloat(dataTicker.lowPrice)
      const volumen      = parseFloat(dataTicker.quoteVolume)

      setTicker({ rangoDia, cambio24h, alto24h, bajo24h, volumen })

      // 2. Klines 1h — últimas 20 velas para RSI y tendencia
      const resKlines = await fetch(
        `${BINANCE_KLINES}?symbol=${simbolo.toUpperCase()}&interval=1h&limit=20`
      )
      const dataKlines = await resKlines.json()

      // Precios de cierre de cada vela
      const cierres = dataKlines.map(k => parseFloat(k[4]))
      setRsi(calcularRSI(cierres))

      // Tendencia: comparar las últimas 4 velas
      const ultimas4 = cierres.slice(-4)
      const suben = ultimas4.every((v, i) => i === 0 || v >= ultimas4[i - 1])
      const bajan = ultimas4.every((v, i) => i === 0 || v <= ultimas4[i - 1])
      setTendencia(suben ? 'sube' : bajan ? 'baja' : 'lateral')

      // 3. Volatilidad 7 días de CoinGecko
      const cgId = COINGECKO_IDS[simbolo.toUpperCase()]
      if (cgId) {
        try {
          const resCG = await fetch(
            `${COINGECKO_CHART}/${cgId}/market_chart?vs_currency=usd&days=7`
          )
          const dataCG = await resCG.json()
          if (dataCG.prices?.length > 1) {
            // Rango diario promedio de los últimos 7 días
            const precios7d = dataCG.prices.map(p => p[1])
            const max7d = Math.max(...precios7d)
            const min7d = Math.min(...precios7d)
            setVolat7d(Math.round((max7d - min7d) / 7))
          }
        } catch {
          // CoinGecko puede fallar con rate limit — no es crítico
        }
      }

    } catch (err) {
      setError('No se pudo cargar el contexto de mercado')
    } finally {
      setLoading(false)
    }
  }, [simbolo])

  useEffect(() => {
    setLoading(true)
    fetchDatos()
    // Refresca cada 60 segundos
    intervalRef.current = setInterval(fetchDatos, 60000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [fetchDatos])

  // Cálculos derivados
  const semaforo       = ticker ? evaluarIntervalo(ticker.rangoDia, intervaloUsd) : null
  const rsiInfo        = textoRSI(rsi)
  const montoOperar    = capitalTotal && porcentaje ? (capitalTotal * porcentaje / 100).toFixed(2) : null

  // Distancia al próximo objetivo (si hay precio actual e intervalo)
  const precioObjetivoVenta    = precioActual && intervaloUsd ? precioActual + intervaloUsd : null
  const precioObjetivoRecompra = precioActual && intervaloUsd ? precioActual - intervaloUsd : null
  const distanciaVenta         = precioObjetivoVenta    ? (precioObjetivoVenta    - precioActual) : null
  const distanciaRecompra      = precioObjetivoRecompra ? (precioActual - precioObjetivoRecompra) : null

  if (loading) {
    return (
      <div style={estiloCard}>
        <div style={{ color: '#333', fontSize: '0.8rem' }}>Cargando contexto de mercado...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={estiloCard}>
        <div style={{ color: '#ff4d4d', fontSize: '0.8rem' }}>{error}</div>
      </div>
    )
  }

  return (
    <div style={estiloCard}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ color: '#ccc', fontWeight: 600, fontSize: '0.9rem' }}>
          📊 Contexto de mercado · {simbolo?.toUpperCase()}
        </div>
        <button
          onClick={fetchDatos}
          style={{
            background: 'transparent', border: 'none',
            color: '#444', cursor: 'pointer', fontSize: '0.85rem'
          }}
          title="Actualizar"
        >↻</button>
      </div>

      {/* Fila superior: rango día + cambio 24h */}
      {ticker && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem', marginBottom: '0.8rem' }}>
          <Celda
            label="Rango hoy"
            valor={`$${ticker.rangoDia.toFixed(0)}`}
            sub={`$${ticker.bajo24h.toFixed(0)} — $${ticker.alto24h.toFixed(0)}`}
          />
          <Celda
            label="Cambio 24h"
            valor={`${ticker.cambio24h >= 0 ? '+' : ''}${ticker.cambio24h.toFixed(2)}%`}
            color={ticker.cambio24h >= 0 ? '#00e5a0' : '#ff4d4d'}
          />
          <Celda
            label="Tendencia 4h"
            valor={
              tendencia === 'sube'   ? '↑ Subiendo' :
              tendencia === 'baja'   ? '↓ Bajando'  : '→ Lateral'
            }
            color={
              tendencia === 'sube'   ? '#00e5a0' :
              tendencia === 'baja'   ? '#ff4d4d'  : '#888'
            }
          />
        </div>
      )}

      {/* RSI */}
      <div style={{ marginBottom: '0.8rem' }}>
        <div style={{ color: '#444', fontSize: '0.65rem', marginBottom: '0.2rem' }}>RSI (14 períodos · 1h)</div>
        <div style={{ color: rsiInfo.color, fontSize: '0.85rem', fontWeight: 600 }}>
          {rsiInfo.texto}
        </div>
        {rsi !== null && (
          <div style={{
            height: '4px', background: '#1a1a1a', borderRadius: '2px',
            marginTop: '0.4rem', overflow: 'hidden'
          }}>
            <div style={{
              height: '100%', width: `${rsi}%`,
              background: rsi >= 70 ? '#ff4d4d' : rsi <= 30 ? '#00e5a0' : '#f0b429',
              borderRadius: '2px', transition: 'width 0.5s'
            }} />
          </div>
        )}
      </div>

      {/* Volatilidad 7d */}
      {volat7d && (
        <div style={{ marginBottom: '0.8rem' }}>
          <div style={{ color: '#444', fontSize: '0.65rem', marginBottom: '0.2rem' }}>
            Volatilidad promedio — últimos 7 días
          </div>
          <div style={{ color: '#888', fontSize: '0.85rem' }}>
            ≈ ${volat7d.toLocaleString()} USD/día de movimiento
          </div>
        </div>
      )}

      {/* Semáforo de intervalo */}
      {semaforo && intervaloUsd && (
        <div style={{
          background: '#0a0a0a', borderRadius: '8px', padding: '0.7rem 1rem',
          marginBottom: '0.8rem',
          borderLeft: `3px solid ${semaforo.color}`
        }}>
          <div style={{ color: '#444', fontSize: '0.65rem', marginBottom: '0.2rem' }}>
            Tu intervalo de ${intervaloUsd.toLocaleString()} USD
          </div>
          <div style={{ color: semaforo.color, fontWeight: 600, fontSize: '0.85rem' }}>
            {semaforo.emoji} {semaforo.texto}
          </div>
          {volat7d && (
            <div style={{ color: '#444', fontSize: '0.7rem', marginTop: '0.2rem' }}>
              Intervalo sugerido según volatilidad 7d: ≈ ${Math.round(volat7d * 0.4).toLocaleString()} — ${Math.round(volat7d * 0.7).toLocaleString()} USD
            </div>
          )}
        </div>
      )}

    {/* Alerta de precio de entrada */}
    {precioEntrada && precioActual && (() => {
    const diff       = precioActual - precioEntrada
    const diffPct    = ((diff / precioEntrada) * 100).toFixed(1)
    const enGanancia = diff >= 0
    const cerca      = Math.abs(diff) <= precioEntrada * 0.05 // dentro del 5%

    return (
        <div style={{
        background: '#0a0a0a',
        border: `1px solid ${enGanancia ? '#00e5a033' : cerca ? '#f0b42933' : '#ff4d4d33'}`,
        borderRadius: '10px', padding: '0.8rem 1rem', marginBottom: '0.8rem'
        }}>
        <div style={{ color: '#444', fontSize: '0.65rem', marginBottom: '0.4rem' }}>
            Estado respecto a tu entrada
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div>
            <div style={{ color: '#444', fontSize: '0.62rem' }}>Tu entrada</div>
            <div style={{ color: '#ccc', fontWeight: 600, fontSize: '0.85rem' }}>${precioEntrada.toLocaleString()}</div>
            </div>
            <div>
            <div style={{ color: '#444', fontSize: '0.62rem' }}>Precio actual</div>
            <div style={{ color: '#ccc', fontWeight: 600, fontSize: '0.85rem' }}>${precioActual.toFixed(0).toLocaleString()}</div>
            </div>
            <div>
            <div style={{ color: '#444', fontSize: '0.62rem' }}>Diferencia</div>
            <div style={{ color: enGanancia ? '#00e5a0' : '#ff4d4d', fontWeight: 700, fontSize: '0.85rem' }}>
                {enGanancia ? '+' : ''}{diff.toFixed(0)} ({diffPct}%)
            </div>
            </div>
        </div>

        {/* Mensaje de recomendación */}
        <div style={{
            background: enGanancia ? '#00e5a011' : cerca ? '#f0b42911' : '#ff4d4d11',
            borderRadius: '6px', padding: '0.5rem 0.7rem',
            color: enGanancia ? '#00e5a0' : cerca ? '#f0b429' : '#ff8080',
            fontSize: '0.78rem', lineHeight: 1.4
        }}>
            {enGanancia
            ? `✅ Estás en ganancia latente. Podés ejecutar ventas con beneficio real.`
            : cerca
            ? `⚠️ Cerca de tu entrada. Esperá que supere $${precioEntrada.toLocaleString()} antes de vender.`
            : `🔴 Precio por debajo de tu entrada ($${Math.abs(diff).toFixed(0)} abajo). No conviene operar hasta que ETH recupere $${precioEntrada.toLocaleString()}.`
            }
        </div>
        </div>
    )
    })()}

      {/* Distancia a objetivos */}
      {precioActual && intervaloUsd && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.8rem' }}>
          <div style={{ background: '#0a0a0a', borderRadius: '8px', padding: '0.6rem 0.8rem' }}>
            <div style={{ color: '#444', fontSize: '0.65rem' }}>Próxima venta</div>
            <div style={{ color: '#00e5a0', fontWeight: 600, fontSize: '0.9rem' }}>
              ${precioObjetivoVenta?.toFixed(0).toLocaleString()}
            </div>
            <div style={{ color: '#444', fontSize: '0.7rem' }}>faltan ${distanciaVenta?.toFixed(0)}</div>
          </div>
          <div style={{ background: '#0a0a0a', borderRadius: '8px', padding: '0.6rem 0.8rem' }}>
            <div style={{ color: '#444', fontSize: '0.65rem' }}>Próxima recompra</div>
            <div style={{ color: '#4d79ff', fontWeight: 600, fontSize: '0.9rem' }}>
              ${precioObjetivoRecompra?.toFixed(0).toLocaleString()}
            </div>
            <div style={{ color: '#444', fontSize: '0.7rem' }}>faltan ${distanciaRecompra?.toFixed(0)}</div>
          </div>
        </div>
      )}

      {/* Monto a operar */}
      {montoOperar && (
        <div style={{ color: '#444', fontSize: '0.75rem', borderTop: '1px solid #1a1a1a', paddingTop: '0.7rem' }}>
          Con tu capital actual operás ≈{' '}
          <span style={{ color: '#ccc', fontWeight: 600 }}>${montoOperar} USDT</span>
          {' '}({porcentaje}%)
        </div>
      )}
    </div>
  )
}

function Celda({ label, valor, sub, color }) {
  return (
    <div style={{ background: '#0a0a0a', borderRadius: '8px', padding: '0.5rem 0.7rem' }}>
      <div style={{ color: '#444', fontSize: '0.65rem', marginBottom: '0.2rem' }}>{label}</div>
      <div style={{ color: color || '#ccc', fontWeight: 600, fontSize: '0.85rem' }}>{valor}</div>
      {sub && <div style={{ color: '#444', fontSize: '0.65rem' }}>{sub}</div>}
    </div>
  )
}

const estiloCard = {
  background: '#111',
  border: '1px solid #1e1e1e',
  borderRadius: '14px',
  padding: '1.2rem',
  marginTop: '1rem'
}