"use client"
import TablaPosiciones from './TablaPosiciones'
import BracketVisual from './BracketVisual'
import { agruparPorRonda, formatearHora } from '../lib/torneoLogic'
import Marca from './Marca'
import Footer from './Footer'
import Reglamento from './Reglamento'

const LOGO_PREDEFINIDO = '🛡️'

function Escudo({ equipo }) {
  return equipo?.logo_url
    ? <img src={equipo.logo_url} alt="" className="w-5 h-5 rounded-full object-cover inline-block" />
    : <span className="text-sm">{LOGO_PREDEFINIDO}</span>
}

function colorResultado(p, esLocal) {
  if (p.estado !== 'finalizado' || p.modalidad === 'bye') return 'bg-gray-300'
  if (p.goles_local === p.goles_visitante) return 'bg-yellow-400'
  const ganoLocal = p.goles_local > p.goles_visitante
  if (esLocal) return ganoLocal ? 'bg-green-500' : 'bg-red-500'
  return ganoLocal ? 'bg-red-500' : 'bg-green-500'
}

export default function VistaPublica({ torneo, equipos, partidos }) {
  const equipo = (id) => equipos.find((e) => e.id === id)
  const secciones = agruparPorRonda(partidos)

  return (
    <div className="min-h-screen p-8 bg-black text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-center mb-4"><Marca /></div>
        <div className="bg-gray-900 p-6 rounded-lg shadow border border-gray-800 mb-6 text-center">
          <span className="text-xs bg-gray-900 text-amber-400 px-3 py-1 rounded-full font-bold uppercase tracking-wider">🏟️ Torneo Relámpago</span>
          <h1 className="text-3xl font-bold text-white mt-2">{torneo.nombre}</h1>
          {torneo.estado === 'finalizado' ? (
            <p className="text-lg text-gray-300 mt-2">🏆 Campeón: <span className="font-bold text-amber-600">{equipo(torneo.campeon_id)?.nombre}</span></p>
          ) : (
            <p className="text-sm text-gray-500 mt-1">Sigue los resultados y la tabla de posiciones en tiempo real.</p>
          )}
        </div>

        {torneo.formato === 'fase_grupos' && (
          <div className="bg-gray-900 p-6 rounded-lg shadow border border-gray-800 mb-6">
            <TablaPosiciones equipos={equipos} partidos={partidos} />
          </div>
        )}

        {partidos.some((p) => p.fase !== 'aleatoria') && (
          <div className="bg-gray-900 p-6 rounded-lg shadow border border-gray-800 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-white">🏆 Bracket de Eliminación</h2>
            <BracketVisual equipos={equipos} partidos={partidos} rondaActual={torneo.ronda_actual} campeonId={torneo.campeon_id} estadoTorneo={torneo.estado} />
          </div>
        )}

        <div className="bg-gray-900 p-6 rounded-lg shadow border border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-white">⚽ Calendario de Partidos</h2>

          <div className="space-y-8">
            {secciones.map((seccion) => (
              <div key={seccion.fase}>
                <h3 className={`text-sm font-bold uppercase tracking-wide mb-3 px-2 py-1 inline-block rounded ${seccion.fase === torneo.ronda_actual ? 'bg-black text-amber-400' : 'bg-gray-800 text-gray-400'}`}>
                  {seccion.nombre}
                </h3>
                {seccion.jornadas.map((j) => (
                  <div key={j.jornada} className="mb-4">
                    <p className="text-xs text-gray-500 font-semibold mb-2">
                      {seccion.fase === 'aleatoria' ? `Jornada ${j.jornada}` : ''}
                      {j.hora ? ` ${seccion.fase === 'aleatoria' ? '—' : ''} ${formatearHora(j.hora)}` : ''}
                    </p>
                    <div className="space-y-3">
                      {j.partidos.map((p) => {
                        if (p.modalidad === 'bye') {
                          return (
                            <div key={p.id} className="p-3 border border-amber-800 bg-amber-900/20 rounded-lg text-center text-sm text-amber-400 font-semibold flex items-center justify-center gap-2">
                              <Escudo equipo={equipo(p.local_id)} /> {equipo(p.local_id)?.nombre} avanza directo (descansa esta jornada)
                            </div>
                          )
                        }
                        const local = equipo(p.local_id)
                        const visitante = equipo(p.visitante_id)
                        return (
                          <div key={p.id} className="p-3 border border-gray-800 rounded-lg bg-gray-800 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 justify-end">
                              <span className={`w-1.5 h-6 rounded ${colorResultado(p, true)}`}></span>
                              <span className="font-bold text-right truncate">{local?.nombre}</span>
                              <Escudo equipo={local} />
                            </div>
                            <div className="px-3">
                              {p.estado === 'finalizado' ? (
                                <span className="bg-gray-800 text-white px-3 py-1 rounded font-bold">{p.goles_local} - {p.goles_visitante}</span>
                              ) : (
                                <span className="text-xs bg-yellow-900/30 text-yellow-400 px-2 py-1 rounded font-bold uppercase">Por jugar</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-1">
                              <Escudo equipo={visitante} />
                              <span className="font-bold text-left truncate">{visitante?.nombre}</span>
                              <span className={`w-1.5 h-6 rounded ${colorResultado(p, false)}`}></span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 p-6 rounded-lg shadow border border-gray-800 mt-6">
          <Reglamento numEquipos={equipos.length} />
        </div>
      </div>
      <Footer />
    </div>
  )
}
