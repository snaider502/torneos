"use client"
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Login from '../components/Login'
import PanelTorneos from '../components/PanelTorneos'
import GestionTorneo from '../components/GestionTorneo'
import VistaPublica from '../components/VistaPublica'

export default function Home() {
  const [user, setUser] = useState(null)
  const [cargandoSesion, setCargandoSesion] = useState(true)
  const [torneos, setTorneos] = useState([])
  const [torneoSeleccionado, setTorneoSeleccionado] = useState(null)

  const [torneoPublico, setTorneoPublico] = useState(null)
  const [equiposPublico, setEquiposPublico] = useState([])
  const [partidosPublico, setPartidosPublico] = useState([])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const torneoIdLink = params.get('torneo')
    if (torneoIdLink) {
      cargarTorneoPublico(torneoIdLink)
      return // en modo público no hace falta revisar sesión de admin
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setCargandoSesion(false)
      if (session?.user) fetchTorneos(session.user.id)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchTorneos(session.user.id)
    })

    return () => listener?.subscription?.unsubscribe()
  }, [])

  const fetchTorneos = async (userId) => {
    const { data } = await supabase.from('torneos').select('*').eq('admin_id', userId).order('created_at', { ascending: false })
    if (data) setTorneos(data)
  }

  const cargarTorneoPublico = async (id) => {
    const { data: tData } = await supabase.from('torneos').select('*').eq('id', id).single()
    if (!tData) return
    setTorneoPublico(tData)
    const { data: eData } = await supabase.from('equipos').select('*').eq('torneo_id', id)
    if (eData) setEquiposPublico(eData)
    const { data: pData } = await supabase.from('partidos').select('*').eq('torneo_id', id)
    if (pData) setPartidosPublico(pData)
  }

  // ---- VISTA PÚBLICA (nadie necesita iniciar sesión) ----
  if (torneoPublico) {
    return <VistaPublica torneo={torneoPublico} equipos={equiposPublico} partidos={partidosPublico} />
  }

  if (cargandoSesion) return null

  // ---- GESTIÓN DE UN TORNEO ESPECÍFICO ----
  if (user && torneoSeleccionado) {
    return (
      <GestionTorneo
        torneoInicial={torneoSeleccionado}
        onVolver={() => { setTorneoSeleccionado(null); fetchTorneos(user.id) }}
      />
    )
  }

  // ---- PANEL PRINCIPAL ----
  if (user) {
    return (
      <PanelTorneos
        user={user}
        torneos={torneos}
        onTorneoCreado={() => fetchTorneos(user.id)}
        onAbrirTorneo={(t) => setTorneoSeleccionado(t)}
      />
    )
  }

  // ---- LOGIN ----
  return <Login />
}
