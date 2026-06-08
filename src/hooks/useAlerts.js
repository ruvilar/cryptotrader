import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useAlerts(userId, preciosPorSimbolo) {
  const [alertas,       setAlertas]       = useState([])
  const [disparadas,    setDisparadas]    = useState([]) // las que acaban de activarse
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
        await supabase
          .from('alertas')
          .update({ disparada: true })
          .eq('id', alerta.id)
      }
    }

    if (nuevasDisparadas.length) {
      setDisparadas(prev => [...prev, ...nuevasDisparadas])
      setAlertas(prev => prev.filter(a => !nuevasDisparadas.find(d => d.id === a.id)))
    }
  }, [alertas, preciosPorSimbolo])

  const agregarAlerta = async ({ simbolo, condicion, precioObjetivo, mensaje }) => {
    const { error } = await supabase.from('alertas').insert({
      user_id: userId,
      simbolo,
      condicion,
      precio_objetivo: precioObjetivo,
      mensaje
    })
    if (!error) cargarAlertas()
    return !error
  }

  const descartarAlerta = (id) => {
    setDisparadas(prev => prev.filter(a => a.id !== id))
  }

  useEffect(() => {
    cargarAlertas()
  }, [cargarAlertas])

  useEffect(() => {
    intervalRef.current = setInterval(chequearAlertas, 60000)
    return () => clearInterval(intervalRef.current)
  }, [chequearAlertas])

  return { alertas, disparadas, agregarAlerta, descartarAlerta, cargarAlertas }
}