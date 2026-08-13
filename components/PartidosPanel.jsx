"use client"
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { calcularLlaves, calcularTablaPosiciones, generarSiguienteRonda, generarBracketDesdeClasificados, rondaCompleta, agruparPorRonda, formatearHora, clasificadosParaEliminatoria, NOMBRES_FASE } from '../lib/torneoLogic'

const LOGO_PREDEFINIDO = '🛡️'

function Escudo({ equipo }) {
  return equipo?.logo_url
    ? <img src={equipo.logo_url} alt="" className="w-5 h-5 rounded-full object-cover inline-block" />
    : <span className="text-sm">{LOGO_PREDEFINIDO}</span>
}

// Verde = ganó, Rojo = perdió, Amarillo = empate, gris = pendiente
function colorResultado(p, esLocal) {
  if (p.estado !== 'finalizado' || p.modalidad === 'bye') return 'bg-gray-300'
  if (p.goles_local === p.goles_visitante) return 'bg-yellow-400'
  const ganoLocal = p.goles_local > p.goles_visitante
  if (esLocal) return ganoLocal ? 'bg-green-500' : 'bg-red-500'
  return ganoLocal ? 'bg-red-500' : 'bg-green-500'
}

export default function PartidosPanel({ torneo, equipos, partidos, onCambio, onTorneoActualizado }) {
  const [golesTemp, setGolesTemp] = useState({})
  const [editando, setEditando] = useState({}) // { [partidoId]: true }
  const [cargando, setCargando] = useState(false)
  const [horaSiguienteRonda, setHoraSiguienteRonda] = useState('')

  const equipo = (id) => equipos.find((e) => e.id === id)

  const partidosDeLaRonda = partidos.filter((p) => p.fase === torneo.ronda_actual)
  const esGrupoActivo = torneo.ronda_actual === 'aleatoria'
  const idaYVuelta = torneo.formato === 'eliminacion_directa'

  const guardarMarcador = async (partidoId) => {
    const golesL = golesTemp[`${partidoId}-local`]
    const golesV = golesTemp[`${partidoId}-visitante`]
    if (golesL === undefined || golesV === undefined || golesL === '' || golesV === '') {
      return alert('Ingresa ambos marcadores antes de guardar.')
    }
    const { error } = await supabase.from('partidos').update({ goles_local: parseInt(golesL), goles_visitante: parseInt(golesV), estado: 'finalizado', ganador_manual_id: null }).eq('id', partidoId)
    if (!error) {
      setEditando((prev) => ({ ...prev, [partidoId]: false }))
      onCambio()
    } else {
      alert('Error al guardar: ' + error.message)
    }
  }

  const iniciarEdicionMarcador = (p) => {
    setGolesTemp((prev) => ({ ...prev, [`${p.id}-local`]: String(p.goles_local), [`${p.id}-visitante`]: String(p.goles_visitante) }))
    setEditando((prev) => ({ ...prev, [p.id]: true }))
  }

  const resolverEmpate = async (llave, ganadorId) => {
    const partidoDestino = llave.partidos[llave.partidos.length - 1]
    const { error } = await supabase.from('partidos').update({ ganador_manual_id: ganadorId }).eq('id', partidoDestino.id)
    if (!error) onCambio()
    else alert('Error al guardar el desempate: ' + error.message)
  }

  const numClasificados = clasificadosParaEliminatoria(equipos.length)

  const generarEliminatoria = async () => {
    const tabla = calcularTablaPosiciones(equipos, partidos)
    const clasificadosIds = tabla.slice(0, numClasificados).map((t) => t.id)
    const clasificadosEquipos = equipos.filter((e) => clasificadosIds.includes(e.id))
    if (clasificadosEquipos.length < numClasificados) return alert(`Se necesitan al menos ${numClasificados} equipos con partidos jugados para generar la eliminatoria.`)

    setCargando(true)
    const horaIso = horaSiguienteRonda ? new Date(horaSiguienteRonda).toISOString() : null
    const { partidos: nuevosPartidos, faseInicial } = generarBracketDesdeClasificados(clasificadosEquipos, torneo.id, horaIso)
    const { error: errP } = await supabase.from('partidos').insert(nuevosPartidos)
    if (errP) { alert('Error: ' + errP.message); setCargando(false); return }

    const { error: errT } = await supabase.from('torneos').update({ ronda_actual: faseInicial }).eq('id', torneo.id)
    if (!errT) {
      onTorneoActualizado({ ...torneo, ronda_actual: faseInicial })
      alert(`¡Fase de grupos cerrada! Se generaron los ${NOMBRES_FASE[faseInicial]} con los ${numClasificados} mejores equipos.`)
    }
    setCargando(false)
  }

  const avanzarRonda = async () => {
    const llaves = calcularLlaves(partidosDeLaRonda)
    if (llaves.some((l) => l.necesitaEmpate)) {
      return alert('Hay llaves empatadas sin resolver. Decide un ganador para cada una antes de avanzar.')
    }
    const ganadores = llaves.map((l) => l.ganadorId)

    setCargando(true)
    const horaIso = horaSiguienteRonda ? new Date(horaSiguienteRonda).toISOString() : null
    const resultado = generarSiguienteRonda(ganadores, torneo.id, idaYVuelta, horaIso)

    if (resultado.terminado) {
      const { error } = await supabase.from('torneos').update({ estado: 'finalizado', campeon_id: resultado.campeonId, ronda_actual: 'finalizado' }).eq('id', torneo.id)
      if (!error) {
        onTorneoActualizado({ ...torneo, estado: 'finalizado', campeon_id: resultado.campeonId, ronda_actual: 'finalizado' })
        alert(`🏆 ¡Tenemos campeón: ${equipo(resultado.campeonId)?.nombre}!`)
      }
    } else {
      const { error: errP } = await supabase.from('partidos').insert(resultado.partidos)
      if (errP) { alert('Error: ' + errP.message); setCargando(false); return }
      const { error: errT } = await supabase.from('torneos').update({ ronda_actual: resultado.nuevaFase }).eq('id', torneo.id)
      if (!errT) {
        onTorneoActualizado({ ...torneo, ronda_actual: resultado.nuevaFase })
        alert(`¡Ronda generada: ${NOMBRES_FASE[resultado.nuevaFase]}!`)
      }
    }
    setCargando(false)
  }

  if (torneo.estado === 'finalizado') {
    return (
      <div className="text-center py-10">
        <p className="text-6xl mb-4">🏆</p>
        <h2 className="text-2xl font-bold text-white mb-1">¡Torneo finalizado!</h2>
        <p className="text-lg text-gray-400">Campeón: <span className="font-bold text-amber-600">{equipo(torneo.campeon_id)?.nombre}</span></p>
      </div>
    )
  }

  const llaves = !esGrupoActivo ? calcularLlaves(partidosDeLaRonda) : []
  const listoParaAvanzar = !esGrupoActivo && rondaCompleta(partidosDeLaRonda) && llaves.every((l) => !l.necesitaEmpate)
  const listoParaEliminatoria = esGrupoActivo && rondaCompleta(partidosDeLaRonda)
  const secciones = agruparPorRonda(partidos)

  const renderPartido = (p) => {
    const local = equipo(p.local_id)
    const visitante = equipo(p.visitante_id)
    const enEdicion = editando[p.id]

    if (p.modalidad === 'bye') {
      return (
        <div key={p.id} className="p-3 border border-amber-800 bg-amber-900/20 rounded-lg text-center text-sm text-amber-400 font-semibold flex items-center justify-center gap-2">
          <Escudo equipo={local} /> {local?.nombre} avanza directo (descansa esta jornada)
        </div>
      )
    }

    return (
      <div key={p.id} className="p-4 border border-gray-800 rounded-lg bg-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className={`w-1.5 h-6 rounded ${colorResultado(p, true)}`}></span>
          <span className="font-bold text-right truncate">{local?.nombre}</span>
          <Escudo equipo={local} />
        </div>

        <div className="flex items-center space-x-2 px-2">
          {p.estado === 'finalizado' && !enEdicion ? (
            <span className="bg-gray-800 text-white px-3 py-1 rounded font-bold text-lg">{p.goles_local} - {p.goles_visitante}</span>
          ) : (
            <div className="flex items-center space-x-1">
              <input type="number" min="0" className="w-12 text-center p-1 border rounded bg-white text-black"
                defaultValue={enEdicion ? p.goles_local : ''} placeholder="-"
                onChange={(e) => setGolesTemp({ ...golesTemp, [`${p.id}-local`]: e.target.value })} />
              <span>-</span>
              <input type="number" min="0" className="w-12 text-center p-1 border rounded bg-white text-black"
                defaultValue={enEdicion ? p.goles_visitante : ''} placeholder="-"
                onChange={(e) => setGolesTemp({ ...golesTemp, [`${p.id}-visitante`]: e.target.value })} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-1">
          <Escudo equipo={visitante} />
          <span className="font-bold text-left truncate">{visitante?.nombre}</span>
          <span className={`w-1.5 h-6 rounded ${colorResultado(p, false)}`}></span>
        </div>

        <div className="w-full sm:w-auto text-right flex items-center gap-2 justify-end">
          {p.modalidad !== 'unico' && <span className="text-xs text-gray-400 uppercase">{p.modalidad}</span>}
          {p.estado === 'finalizado' && !enEdicion ? (
            <button onClick={() => iniciarEdicionMarcador(p)} className="text-amber-600 hover:text-amber-700 text-sm" title="Corregir marcador">✏️ Corregir</button>
          ) : (
            <button onClick={() => guardarMarcador(p.id)} className="bg-amber-500 hover:bg-amber-600 text-black px-3 py-1.5 rounded text-sm font-semibold transition">Guardar Goles</button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
        <h2 className="text-xl font-semibold text-white">{NOMBRES_FASE[torneo.ronda_actual] || 'Partidos'}</h2>
        {(listoParaEliminatoria || listoParaAvanzar) && (
          <div className="flex items-center gap-2">
            <input type="datetime-local" className="p-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-500 rounded text-sm" value={horaSiguienteRonda} onChange={(e) => setHoraSiguienteRonda(e.target.value)} title="Hora de la siguiente ronda (opcional)" />
            {listoParaEliminatoria && (
              <button onClick={generarEliminatoria} disabled={cargando} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded font-semibold text-sm transition disabled:opacity-50">
                {cargando ? 'Generando...' : `Cerrar Grupos → Top ${numClasificados}`}
              </button>
            )}
            {listoParaAvanzar && (
              <button onClick={avanzarRonda} disabled={cargando} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold text-sm transition disabled:opacity-50">
                {cargando ? 'Avanzando...' : 'Avanzar de Ronda →'}
              </button>
            )}
          </div>
        )}
      </div>

      {!esGrupoActivo && llaves.filter((l) => l.necesitaEmpate).map((l, i) => (
        <div key={i} className="mb-3 p-3 border border-orange-800 bg-orange-900/20 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-sm font-semibold text-orange-400">Empate entre {equipo(l.equipoA)?.nombre} y {equipo(l.equipoB)?.nombre} — elige el ganador (ej. por penales):</span>
          <div className="flex gap-2">
            <button onClick={() => resolverEmpate(l, l.equipoA)} className="bg-gray-800 border border-orange-700 text-orange-400 px-3 py-1 rounded text-sm font-semibold hover:bg-orange-900/30">{equipo(l.equipoA)?.nombre}</button>
            <button onClick={() => resolverEmpate(l, l.equipoB)} className="bg-gray-800 border border-orange-700 text-orange-400 px-3 py-1 rounded text-sm font-semibold hover:bg-orange-900/30">{equipo(l.equipoB)?.nombre}</button>
          </div>
        </div>
      ))}

      {/* Secciones por ronda: la más reciente/activa primero, separada de las ya jugadas */}
      <div className="space-y-8">
        {secciones.map((seccion) => (
          <div key={seccion.fase}>
            <h3 className={`text-sm font-bold uppercase tracking-wide mb-3 px-2 py-1 inline-block rounded ${seccion.fase === torneo.ronda_actual ? 'bg-black text-amber-400' : 'bg-gray-800 text-gray-400'}`}>
              {seccion.nombre} {seccion.fase !== torneo.ronda_actual ? '(jugada)' : ''}
            </h3>
            {seccion.jornadas.map((j) => (
              <div key={j.jornada} className="mb-4">
                <p className="text-xs text-gray-500 font-semibold mb-2">
                  {esGrupoActivo || seccion.fase === 'aleatoria' ? `Jornada ${j.jornada}` : 'Partidos'}
                  {j.hora ? ` — ${formatearHora(j.hora)}` : ''}
                </p>
                <div className="space-y-3">{j.partidos.map(renderPartido)}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
