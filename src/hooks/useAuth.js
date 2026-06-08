import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) setUser(data.session.user)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loginConGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'http://localhost:3000/dashboard' }
    })
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  return { user, loading, loginConGoogle, logout }
}