"use client"
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import EquiposPanel from './EquiposPanel'
import PartidosPanel from './PartidosPanel'
import TablaPosiciones from './TablaPosiciones'
import CompartirLink from './CompartirLink'
import BracketVisual from './BracketVisual'
import Marca from './Marca'
import Footer from './Footer'
import Reglamento from './Reglamento'

export default function GestionTorneo({ torneoInicial, onVolver }) {
  const [torneo, setTorneo] = useState(torneoInicial)
  const [equipos, setEquipos] = useState([])
  const [partidos, setPartidos] = useState([])
  const [vistaActiva, setVistaActiva] = useState('equipos')

  const cargarDatos = async () => {
    const { data: eData } = await supabase.from('equipos').select('*').eq('torneo_id', torneo.id).order('nombre', { ascending: true })
    if (eData) setEquipos(eData)

    if (torneo.estado !== 'inscripcion') {
      const { data: pData } = await supabase.from('partidos').select('*').eq('torneo_id', torneo.id)
      if (pData) setPartidos(pData)
    }
  }

  useEffect(() => {
    cargarDatos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [torneo.id, torneo.estado, torneo.ronda_actual])

  const actualizarTorneo = (nuevoTorneo) => {
    setTorneo(nuevoTorneo)
    if (nuevoTorneo.estado !== 'inscripcion' && vistaActiva === 'equipos') setVistaActiva('partidos')
  }

  const badgeEstado = torneo.estado === 'inscripcion' ? 'bg-yellow-500' : torneo.estado === 'finalizado' ? 'bg-purple-600' : 'bg-green-600'
  const textoEstado = torneo.estado === 'inscripcion' ? 'FASE DE INSCRIPCIÓN' : torneo.estado === 'finalizado' ? 'FINALIZADO' : 'TORNEO EN CURSO'

  return (
    <div className="min-h-screen p-8 bg-black text-white">
      <div className="max-w-5xl mx-auto">
        <Marca />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 mt-4 border-b pb-4 gap-4">
          <div>
            <button onClick={onVolver} className="text-amber-600 hover:underline mb-2 font-semibold">← Volver a mis torneos</button>
            <h1 className="text-3xl font-bold text-white">{torneo.nombre}</h1>
            <span className={`text-sm px-3 py-1 rounded-full font-bold text-white mt-2 inline-block ${badgeEstado}`}>{textoEstado}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {torneo.estado !== 'inscripcion' && (
              <>
                <button onClick={() => setVistaActiva('partidos')} className={`px-3 py-2 rounded font-semibold text-sm transition ${vistaActiva === 'partidos' ? 'bg-black text-amber-400' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>Partidos</button>
                <button onClick={() => setVistaActiva('bracket')} className={`px-3 py-2 rounded font-semibold text-sm transition ${vistaActiva === 'bracket' ? 'bg-black text-amber-400' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>🏆 Bracket</button>
                <button onClick={() => setVistaActiva('tabla')} className={`px-3 py-2 rounded font-semibold text-sm transition ${vistaActiva === 'tabla' ? 'bg-black text-amber-400' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>Posiciones</button>
                <button onClick={() => setVistaActiva('equipos')} className={`px-3 py-2 rounded font-semibold text-sm transition ${vistaActiva === 'equipos' ? 'bg-black text-amber-400' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>Equipos</button>
                {torneo.estado !== 'finalizado' && (
                  <button onClick={() => setVistaActiva('compartir')} className={`px-3 py-2 rounded font-semibold text-sm transition ${vistaActiva === 'compartir' ? 'bg-black text-amber-400' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>🔗 Compartir</button>
                )}
              </>
            )}
            <button onClick={() => setVistaActiva('reglamento')} className={`px-3 py-2 rounded font-semibold text-sm transition ${vistaActiva === 'reglamento' ? 'bg-black text-amber-400' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>📜 Reglamento</button>
          </div>
        </div>

        {vistaActiva === 'reglamento' && (
          <div className="bg-gray-900 p-6 rounded-lg shadow border border-gray-800">
            <Reglamento numEquipos={equipos.length} />
          </div>
        )}

        {vistaActiva !== 'reglamento' && torneo.estado === 'inscripcion' && (
          <EquiposPanel torneo={torneo} equipos={equipos} onCambio={cargarDatos} onTorneoIniciado={actualizarTorneo} />
        )}

        {vistaActiva !== 'reglamento' && torneo.estado !== 'inscripcion' && (
          <div className="bg-gray-900 p-6 rounded-lg shadow border border-gray-800">
            {vistaActiva === 'equipos' && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-white">Equipos Inscritos ({equipos.length})</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {equipos.map((equipo, index) => (
                    <div key={equipo.id} className="p-3 border border-gray-800 rounded-lg flex items-center bg-gray-800">
                      <span className="font-bold text-gray-400 w-6">{index + 1}.</span>
                      {equipo.logo_url ? <img src={equipo.logo_url} alt="" className="w-5 h-5 rounded-full object-cover mr-2" /> : <span className="mr-2">🛡️</span>}
                      <span className="font-semibold">{equipo.nombre}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {vistaActiva === 'partidos' && (
              <PartidosPanel torneo={torneo} equipos={equipos} partidos={partidos} onCambio={cargarDatos} onTorneoActualizado={actualizarTorneo} />
            )}
            {vistaActiva === 'bracket' && (
              <BracketVisual equipos={equipos} partidos={partidos} rondaActual={torneo.ronda_actual} campeonId={torneo.campeon_id} estadoTorneo={torneo.estado} />
            )}
            {vistaActiva === 'tabla' && <TablaPosiciones equipos={equipos} partidos={partidos} />}
            {vistaActiva === 'compartir' && <CompartirLink torneoId={torneo.id} />}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
