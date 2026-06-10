import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { enviarAlertaTelegram } from '../lib/telegram'

export function useAlerts(userId, preciosPorSimbolo) {
  const [alertas,       setAlertas]       = useState([])
  const [disparadas,    setDisparadas]    = useState([])
  const intervalRef = useRef(null)

  const cargarAlertas = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('alertas')
      .select('*')
      .eq('user_id', userId)
      .eq('activa', true)
      .eq('disparada', false)
    if (data) setAlertas(data)
  }, [userId])

  const chequearAlertas = useCallback(async () => {
    if (!alertas.length || !preciosPorSimbolo) return
    const nuevasDisparadas = []

    for (const alerta of alertas) {
      const precio = preciosPorSimbolo[alerta.simbolo]
      if (!precio) continue

      const seDispara =
        (alerta.condicion === 'supera'  && precio >= alerta.precio_objetivo) ||
        (alerta.condicion === 'cae_a'   && precio <= alerta.precio_objetivo)

      if (seDispara) {
        nuevasDisparadas.push(alerta)

        // Reproduce sonido de alerta
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
        audio.volume = 0.5
        audio.play().catch(() => {})
        
        // Notificación a Telegram
        const emoji = alerta.condicion === 'supera' ? '🚀' : '⚠️'
        const nombreActivo = alerta.simbolo.replace('USDT', '')
        const condicionTexto = alerta.condicion === 'supera'
          ? `subió y superó $${alerta.precio_objetivo.toLocaleString()}`
          : `bajó a $${alerta.precio_objetivo.toLocaleString()}`
        
        await enviarAlertaTelegram(
          `${emoji} <b>Alerta CryptoTrader</b>\n\n` +
          `<b>${nombreActivo}</b> ${condicionTexto}\n\n` +
          `Símbolo: ${nombreActivo}\n` +
          `Precio objetivo: $${alerta.precio_objetivo.toLocaleString()}\n` +
          `Mensaje: ${alerta.mensaje}`
        )
        
        await supabase
          .from('alertas')
          .update({ disparada: true })
          .eq('id', alerta.id)
      }
    }

    if (nuevasDisparadas.length) {
      setDisparadas(prev => [...prev, ...nuevasDisparadas])
      setAlertas(prev => prev.filter(a => !nuevasDisparadas.find(d => d.id === a.id)))

      setTimeout(() => {
        setDisparadas(prev => prev.filter(a => !nuevasDisparadas.find(d => d.id === a.id)))
      }, 10000)
    }
  }, [alertas, preciosPorSimbolo])

  const agregarAlerta = async ({ simbolo, condicion, precioObjetivo, mensaje }) => {
    const { data, error } = await supabase.from('alertas').insert({
      user_id: userId,
      simbolo,
      condicion,
      precio_objetivo: precioObjetivo,
      mensaje
    }).select()
    console.log('INSERT resultado:', { data, error })
    if (!error) cargarAlertas()
    return !error
  }

  const descartarAlerta = (id) => {
    setDisparadas(prev => prev.filter(a => a.id !== id))
  }

  const eliminarAlerta = async (id) => {
    await supabase.from('alertas').update({ activa: false }).eq('id', id)
    setAlertas(prev => prev.filter(a => a.id !== id))
  }

  useEffect(() => {
    cargarAlertas()
  }, [cargarAlertas])
  
  // Ref para acceder siempre al valor más reciente sin recrear el intervalo
  const chequearRef = useRef(chequearAlertas)
  useEffect(() => { chequearRef.current = chequearAlertas }, [chequearAlertas])
  
  useEffect(() => {
    intervalRef.current = setInterval(() => chequearRef.current(), 60000)
    return () => clearInterval(intervalRef.current)
  }, [])

  return { alertas, disparadas, agregarAlerta, descartarAlerta, eliminarAlerta, cargarAlertas }
}