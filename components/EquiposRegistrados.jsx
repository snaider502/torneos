"use client"
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const LOGO_PREDEFINIDO = '🛡️'

export default function EquiposRegistrados({ user }) {
  const [equipos, setEquipos] = useState([])
  const [nombre, setNombre] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [editandoId, setEditandoId] = useState(null)
  const [nombreEditado, setNombreEditado] = useState('')
  const [logoEditado, setLogoEditado] = useState('')
  const [cargando, setCargando] = useState(false)

  const cargar = async () => {
    const { data } = await supabase.from('equipos_registrados').select('*').eq('admin_id', user.id).order('nombre', { ascending: true })
    if (data) setEquipos(data)
  }

  useEffect(() => { cargar() }, [user.id])

  const agregar = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) return
    setCargando(true)
    const { error } = await supabase.from('equipos_registrados').insert([{ admin_id: user.id, nombre: nombre.trim(), logo_url: logoUrl.trim() || null }])
    if (!error) {
      setNombre(''); setLogoUrl(''); cargar()
    } else if (error.code === '23505') {
      alert('Ya tienes un equipo registrado con ese nombre.')
    } else {
      alert('Error: ' + error.message)
    }
    setCargando(false)
  }

  const iniciarEdicion = (eq) => {
    setEditandoId(eq.id)
    setNombreEditado(eq.nombre)
    setLogoEditado(eq.logo_url || '')
  }

  const guardarEdicion = async (id) => {
    if (!nombreEditado.trim()) return alert('El nombre no puede estar vacío.')
    setCargando(true)
    const { error } = await supabase.from('equipos_registrados').update({ nombre: nombreEditado.trim(), logo_url: logoEditado.trim() || null }).eq('id', id)
    if (!error) { setEditandoId(null); cargar() }
    else if (error.code === '23505') alert('Ya tienes un equipo registrado con ese nombre.')
    else alert('Error: ' + error.message)
    setCargando(false)
  }

  const eliminar = async (id, nombreEq) => {
    if (!window.confirm(`¿Eliminar a "${nombreEq}" de tu lista de equipos registrados? (Esto no lo borra de los torneos donde ya participó, solo de la lista para reutilizar).`)) return
    setCargando(true)
    const { error } = await supabase.from('equipos_registrados').delete().eq('id', id)
    if (!error) cargar()
    else alert('Error: ' + error.message)
    setCargando(false)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 h-fit bg-gray-900 p-6 rounded-lg shadow border border-gray-800">
        <h2 className="text-xl font-semibold mb-4 text-amber-600">Registrar Equipo</h2>
        <form onSubmit={agregar}>
          <input type="text" placeholder="Nombre del equipo" className="w-full mb-3 p-3 border border-gray-700 bg-gray-800 text-white placeholder-gray-500 rounded focus:outline-none focus:border-amber-500" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          <input type="url" placeholder="URL del logo (opcional)" className="w-full mb-4 p-3 border border-gray-700 bg-gray-800 text-white placeholder-gray-500 rounded focus:outline-none focus:border-amber-500 text-sm" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
          <button type="submit" disabled={cargando} className="w-full bg-amber-500 hover:bg-amber-600 text-black p-3 rounded font-semibold transition disabled:opacity-50">
            {cargando ? 'Guardando...' : 'Registrar Equipo'}
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-3">Estos equipos te aparecerán como sugerencia al inscribirlos en cualquier torneo nuevo.</p>
      </div>

      <div className="bg-gray-900 p-6 rounded-lg shadow border border-gray-800 md:col-span-2">
        <h2 className="text-xl font-semibold mb-4 text-white">Equipos Registrados ({equipos.length})</h2>
        {equipos.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aún no has registrado equipos. Se irán agregando solos cada vez que inscribas uno en un torneo, o puedes registrarlos aquí directamente.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {equipos.map((eq) => (
              <div key={eq.id} className="p-3 border border-gray-800 rounded-lg bg-gray-800">
                {editandoId === eq.id ? (
                  <div className="space-y-2">
                    <input type="text" className="w-full p-2 border border-amber-500 bg-gray-800 text-white rounded text-sm" value={nombreEditado} onChange={(e) => setNombreEditado(e.target.value)} autoFocus />
                    <input type="url" placeholder="URL del logo" className="w-full p-2 border border-amber-500 bg-gray-800 text-white rounded text-sm" value={logoEditado} onChange={(e) => setLogoEditado(e.target.value)} />
                    <div className="flex gap-2">
                      <button onClick={() => guardarEdicion(eq.id)} disabled={cargando} className="flex-1 bg-green-600 text-white rounded py-1 text-sm font-semibold">Guardar</button>
                      <button onClick={() => setEditandoId(null)} className="flex-1 bg-gray-300 text-gray-300 rounded py-1 text-sm font-semibold">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                      {eq.logo_url ? <img src={eq.logo_url} alt="" className="w-6 h-6 rounded-full object-cover mr-2 shrink-0" /> : <span className="mr-2 shrink-0">{LOGO_PREDEFINIDO}</span>}
                      <span className="font-semibold truncate">{eq.nombre}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <button onClick={() => iniciarEdicion(eq)} className="text-amber-600 hover:text-amber-700 text-sm" title="Editar">✏️</button>
                      <button onClick={() => eliminar(eq.id, eq.nombre)} className="text-red-500 hover:text-red-700 text-sm" title="Eliminar">🗑️</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
