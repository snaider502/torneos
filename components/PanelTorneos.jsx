"use client"
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import EquiposRegistrados from './EquiposRegistrados'
import Marca from './Marca'
import Footer from './Footer'

export default function PanelTorneos({ user, torneos, onTorneoCreado, onAbrirTorneo }) {
  const [nombreTorneo, setNombreTorneo] = useState('')
  const [cargando, setCargando] = useState(false)
  const [vista, setVista] = useState('torneos') // 'torneos' o 'equipos'

  const crearTorneo = async (e) => {
    e.preventDefault()
    if (!nombreTorneo.trim()) return
    setCargando(true)
    const { error } = await supabase.from('torneos').insert([{ nombre: nombreTorneo.trim(), admin_id: user.id, estado: 'inscripcion' }])
    if (!error) {
      setNombreTorneo('')
      onTorneoCreado()
    } else {
      alert('Error al crear torneo: ' + error.message)
    }
    setCargando(false)
  }

  return (
    <div className="min-h-screen p-8 bg-black text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
          <Marca />
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setVista('torneos')} className={`px-4 py-2 rounded font-semibold text-sm transition ${vista === 'torneos' ? 'bg-black text-amber-400' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>Mis Torneos</button>
            <button onClick={() => setVista('equipos')} className={`px-4 py-2 rounded font-semibold text-sm transition ${vista === 'equipos' ? 'bg-black text-amber-400' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>Equipos Registrados</button>
            <button onClick={() => supabase.auth.signOut()} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition">Cerrar Sesión</button>
          </div>
        </div>

        {vista === 'equipos' ? (
          <EquiposRegistrados user={user} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-900 p-6 rounded-lg shadow border border-gray-800 md:col-span-1 h-fit">
              <h2 className="text-xl font-semibold mb-4 text-amber-600">Nuevo Torneo</h2>
              <form onSubmit={crearTorneo}>
                <input
                  type="text"
                  placeholder="Ej. Liga entre amigos"
                  className="w-full mb-4 p-3 border border-gray-700 bg-gray-800 text-white placeholder-gray-500 rounded focus:outline-none focus:border-amber-500"
                  value={nombreTorneo}
                  onChange={(e) => setNombreTorneo(e.target.value)}
                  required
                />
                <button type="submit" disabled={cargando} className="w-full bg-amber-500 hover:bg-amber-600 text-black p-3 rounded font-semibold transition disabled:opacity-50">
                  {cargando ? 'Creando...' : 'Crear Torneo'}
                </button>
              </form>
            </div>

            <div className="bg-gray-900 p-6 rounded-lg shadow border border-gray-800 md:col-span-2">
              <h2 className="text-xl font-semibold mb-4 text-white">Mis Torneos Relámpago</h2>
              {torneos.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Aún no has creado ningún torneo.</p>
              ) : (
                <ul className="space-y-3">
                  {torneos.map((torneo) => (
                    <li key={torneo.id} className="p-4 border border-gray-800 rounded-lg flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-lg">{torneo.nombre}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full uppercase font-bold tracking-wide ${torneo.estado === 'inscripcion' ? 'bg-yellow-900/30 text-yellow-400' : torneo.estado === 'finalizado' ? 'bg-purple-900/30 text-purple-400' : 'bg-green-900/30 text-green-400'}`}>
                          {torneo.estado}
                        </span>
                      </div>
                      <button onClick={() => onAbrirTorneo(torneo)} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm transition">
                        Gestionar Torneo
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
