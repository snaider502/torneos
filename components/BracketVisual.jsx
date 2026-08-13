"use client"
import { calcularLlaves, ORDEN_FASES, NOMBRES_FASE } from '../lib/torneoLogic'

const LOGO_PREDEFINIDO = '🛡️'

// Caja de un enfrentamiento dentro del bracket
function CajaLlave({ llave, equipo, esColumnaActiva }) {
  const nombreA = llave.equipoA ? equipo(llave.equipoA)?.nombre : 'Por definir'
  const nombreB = llave.equipoB === null && llave.partidos[0]?.modalidad === 'bye' ? null : (llave.equipoB ? equipo(llave.equipoB)?.nombre : 'Por definir')
  const esBye = llave.partidos[0]?.modalidad === 'bye'

  const filaEquipo = (id, nombre) => {
    const gano = llave.ganadorId && id === llave.ganadorId
    const perdio = llave.ganadorId && id && id !== llave.ganadorId
    const p = llave.partidos.find((x) => x.local_id === id || x.visitante_id === id)
    const goles = p ? (p.local_id === id ? p.goles_local : p.goles_visitante) : null
    return (
      <div className={`flex items-center justify-between px-2 py-1.5 text-sm ${gano ? 'bg-green-900/30 font-bold text-green-400' : perdio ? 'text-gray-400' : 'text-gray-300'}`}>
        <span className="flex items-center gap-1.5 truncate">
          {id ? (equipo(id)?.logo_url ? <img src={equipo(id).logo_url} alt="" className="w-4 h-4 rounded-full object-cover" /> : <span className="text-xs">{LOGO_PREDEFINIDO}</span>) : null}
          <span className="truncate">{nombre}</span>
        </span>
        {goles !== null && <span className="font-bold ml-1">{goles}</span>}
      </div>
    )
  }

  if (esBye) {
    return (
      <div className={`w-48 rounded-lg border ${esColumnaActiva ? 'border-amber-400' : 'border-gray-800'} bg-gray-900 shadow-sm overflow-hidden`}>
        {filaEquipo(llave.equipoA, nombreA)}
        <div className="px-2 py-1 text-[11px] text-gray-400 border-t">avanza directo (bye)</div>
      </div>
    )
  }

  return (
    <div className={`w-48 rounded-lg border ${esColumnaActiva ? 'border-amber-400 ring-1 ring-amber-100' : 'border-gray-800'} bg-gray-900 shadow-sm divide-y overflow-hidden`}>
      {filaEquipo(llave.equipoA, nombreA)}
      {filaEquipo(llave.equipoB, nombreB)}
    </div>
  )
}

export default function BracketVisual({ equipos, partidos, rondaActual, campeonId, estadoTorneo }) {
  const equipo = (id) => equipos.find((e) => e.id === id)
  const fasesElim = partidos.filter((p) => p.fase !== 'aleatoria')
  const columnas = ORDEN_FASES.filter((f) => f !== 'aleatoria' && fasesElim.some((p) => p.fase === f))

  if (columnas.length === 0) {
    return <p className="text-gray-500 text-center py-8">La eliminatoria todavía no ha comenzado.</p>
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex items-start gap-10 min-w-max px-2">
        {columnas.map((fase, colIndex) => {
          const llaves = calcularLlaves(fasesElim.filter((p) => p.fase === fase))
          const gap = 16 * Math.pow(2, colIndex) // el espacio crece cada ronda para lograr el "embudo" del bracket
          return (
            <div key={fase} className="flex flex-col items-center">
              <h4 className={`text-xs font-bold uppercase tracking-wide mb-4 px-2 py-1 rounded ${fase === rondaActual ? 'bg-black text-amber-400' : 'bg-gray-800 text-gray-500'}`}>
                {NOMBRES_FASE[fase]}
              </h4>
              <div className="flex flex-col" style={{ gap: `${gap}px` }}>
                {llaves.map((llave, i) => (
                  <CajaLlave key={i} llave={llave} equipo={equipo} esColumnaActiva={fase === rondaActual} />
                ))}
              </div>
            </div>
          )
        })}

        {estadoTorneo === 'finalizado' && campeonId && (
          <div className="flex flex-col items-center justify-center">
            <h4 className="text-xs font-bold uppercase tracking-wide mb-4 px-2 py-1 rounded bg-yellow-400 text-yellow-900">Campeón</h4>
            <div className="w-48 rounded-lg border-2 border-amber-400 bg-amber-900/20 shadow-sm p-4 text-center">
              <p className="text-3xl mb-1">🏆</p>
              {equipo(campeonId)?.logo_url && <img src={equipo(campeonId).logo_url} alt="" className="w-8 h-8 rounded-full object-cover mx-auto mb-1" />}
              <p className="font-bold text-yellow-400 text-sm truncate">{equipo(campeonId)?.nombre}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
