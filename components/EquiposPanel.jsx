"use client"
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { generarBracketInicial, generarFaseDeGrupos } from '../lib/torneoLogic'

const LOGO_PREDEFINIDO = '🛡️'

export default function EquiposPanel({ torneo, equipos, onCambio, onTorneoIniciado }) {
  const [nombreEquipo, setNombreEquipo] = useState('')
  const [editandoId, setEditandoId] = useState(null)
  const [nombreEditado, setNombreEditado] = useState('')
  const [cargando, setCargando] = useState(false)
  const [horaInicio, setHoraInicio] = useState('')
  const [plantilla, setPlantilla] = useState([]) // equipos usados antes por este mismo admin
  const [mostrarMasivo, setMostrarMasivo] = useState(false)
  const [textoMasivo, setTextoMasivo] = useState('')

  useEffect(() => {
    const cargarPlantilla = async () => {
      const { data } = await supabase
        .from('equipos_registrados')
        .select('nombre, logo_url')
        .eq('admin_id', torneo.admin_id)
        .order('nombre', { ascending: true })
      if (data) setPlantilla(data)
    }
    cargarPlantilla()
  }, [torneo.admin_id])

  const agregarEquipo = async (e) => {
    e.preventDefault()
    if (!nombreEquipo.trim()) return
    setCargando(true)
    // Si el nombre coincide con uno ya registrado antes, reutilizamos su logo
    const existente = plantilla.find((eq) => eq.nombre.toLowerCase() === nombreEquipo.trim().toLowerCase())
    const { error } = await supabase.from('equipos').insert([{ nombre: nombreEquipo.trim(), torneo_id: torneo.id, logo_url: existente?.logo_url || null }])
    if (!error) {
      // Lo dejamos guardado en el roster global del admin para la próxima vez (si no existía ya)
      if (!existente) {
        await supabase.from('equipos_registrados').insert([{ admin_id: torneo.admin_id, nombre: nombreEquipo.trim(), logo_url: null }])
        setPlantilla((prev) => [...prev, { nombre: nombreEquipo.trim(), logo_url: null }])
      }
      setNombreEquipo('')
      onCambio()
    } else if (error.code === '23505') {
      alert('Ya existe un equipo con ese nombre en este torneo.')
    } else {
      alert('Error al agregar equipo: ' + error.message)
    }
    setCargando(false)
  }

  const cargarMasivo = async () => {
    const nombresPegados = [...new Set(
      textoMasivo.split('\n').map((n) => n.trim()).filter(Boolean)
    )]
    if (nombresPegados.length === 0) return alert('Pega al menos un nombre de equipo, uno por línea.')

    const cupoDisponible = 64 - equipos.length
    if (cupoDisponible <= 0) return alert('Ya alcanzaste el máximo de 64 equipos en este torneo.')

    const yaInscritos = new Set(equipos.map((e) => e.nombre.toLowerCase()))
    const aInsertar = []
    const duplicados = []

    for (const nombre of nombresPegados) {
      if (yaInscritos.has(nombre.toLowerCase())) {
        duplicados.push(nombre)
        continue
      }
      if (aInsertar.length >= cupoDisponible) break
      const existente = plantilla.find((eq) => eq.nombre.toLowerCase() === nombre.toLowerCase())
      aInsertar.push({ torneo_id: torneo.id, nombre, logo_url: existente?.logo_url || null })
    }

    if (aInsertar.length === 0) {
      return alert('Todos esos equipos ya estaban inscritos en este torneo.')
    }

    setCargando(true)
    const { error } = await supabase.from('equipos').insert(aInsertar)
    if (error) {
      alert('Error al cargar equipos: ' + error.message)
      setCargando(false)
      return
    }

    // Guardamos en el roster global los que sean nuevos para el admin
    const nuevosParaRoster = aInsertar
      .filter((e) => !plantilla.some((p) => p.nombre.toLowerCase() === e.nombre.toLowerCase()))
      .map((e) => ({ admin_id: torneo.admin_id, nombre: e.nombre, logo_url: null }))
    if (nuevosParaRoster.length > 0) {
      await supabase.from('equipos_registrados').insert(nuevosParaRoster) // si alguno ya existe por una carrera de datos, simplemente se ignora su error individual al ser un insert por lote no crítico
      setPlantilla((prev) => [...prev, ...nuevosParaRoster])
    }

    setTextoMasivo('')
    setMostrarMasivo(false)
    onCambio()
    setCargando(false)

    let resumen = `¡Listo! Se agregaron ${aInsertar.length} equipos.`
    if (duplicados.length > 0) resumen += `\nSe omitieron ${duplicados.length} por estar ya inscritos: ${duplicados.join(', ')}.`
    if (nombresPegados.length - duplicados.length > aInsertar.length) resumen += `\nAlgunos no cupieron por el límite de 64 equipos.`
    alert(resumen)
  }


  const guardarEdicion = async (id) => {
    if (!nombreEditado.trim()) return alert('El nombre no puede estar vacío.')
    setCargando(true)
    const { error } = await supabase.from('equipos').update({ nombre: nombreEditado.trim() }).eq('id', id)
    if (!error) {
      setEditandoId(null)
      onCambio()
    } else if (error.code === '23505') {
      alert('Ya existe un equipo con ese nombre en este torneo.')
    } else {
      alert('Error al actualizar equipo: ' + error.message)
    }
    setCargando(false)
  }

  const eliminarEquipo = async (id, nombre) => {
    if (!window.confirm(`¿Seguro que quieres eliminar a "${nombre}"?`)) return
    setCargando(true)
    const { error } = await supabase.from('equipos').delete().eq('id', id)
    if (!error) onCambio()
    else alert('Error al eliminar equipo: ' + error.message)
    setCargando(false)
  }

  const generarPartidos = async () => {
    const num = equipos.length
    if (num < 4) return alert('Necesitas al menos 4 equipos para iniciar.')

    setCargando(true)
    const formato = num <= 8 ? 'eliminacion_directa' : 'fase_grupos'
    const horaIso = horaInicio ? new Date(horaInicio).toISOString() : null
    let partidos, rondaActual

    if (formato === 'eliminacion_directa') {
      const resultado = generarBracketInicial(equipos, torneo.id, horaIso)
      partidos = resultado.partidos
      rondaActual = resultado.faseInicial
    } else {
      partidos = generarFaseDeGrupos(equipos, torneo.id, horaIso)
      rondaActual = 'aleatoria'
    }

    const { error: errPartidos } = await supabase.from('partidos').insert(partidos)
    if (errPartidos) {
      alert('Error al generar los cruces: ' + errPartidos.message)
      setCargando(false)
      return
    }

    const { error: errTorneo } = await supabase.from('torneos').update({ estado: 'en_curso', formato, ronda_actual: rondaActual, hora_inicio: horaIso }).eq('id', torneo.id)
    if (!errTorneo) {
      alert('¡Torneo iniciado! Se generaron los cruces y el calendario.')
      onTorneoIniciado({ ...torneo, estado: 'en_curso', formato, ronda_actual: rondaActual, hora_inicio: horaIso })
    }
    setCargando(false)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-4">
        <div className="bg-gray-900 p-6 rounded-lg shadow border border-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-amber-600">Inscribir Equipo</h2>
          <form onSubmit={agregarEquipo}>
            <input
              type="text"
              placeholder="Nombre del equipo"
              className="w-full mb-2 p-3 border border-gray-700 bg-gray-800 text-white placeholder-gray-500 rounded focus:outline-none focus:border-amber-500"
              value={nombreEquipo}
              onChange={(e) => setNombreEquipo(e.target.value)}
              list="plantilla-equipos"
              required
            />
            <datalist id="plantilla-equipos">
              {plantilla.map((eq) => <option key={eq.nombre} value={eq.nombre} />)}
            </datalist>
            {plantilla.length > 0 && (
              <p className="text-xs text-gray-400 mb-2">Tip: escribe el nombre de un equipo que ya registraste antes y te aparecerá para autocompletar.</p>
            )}
            <button type="submit" disabled={cargando || equipos.length >= 64} className="w-full bg-amber-500 hover:bg-amber-600 text-black p-3 rounded font-semibold transition disabled:opacity-50 mt-2">
              {cargando ? 'Guardando...' : 'Agregar Equipo'}
            </button>
          </form>

          <button onClick={() => setMostrarMasivo(!mostrarMasivo)} className="w-full mt-3 text-xs text-gray-500 hover:text-amber-600 underline">
            {mostrarMasivo ? 'Ocultar carga masiva' : '¿Vas a inscribir muchos equipos? Carga masiva aquí'}
          </button>

          {mostrarMasivo && (
            <div className="mt-3 border-t pt-3">
              <label className="block text-xs font-semibold text-gray-400 mb-1">Pega un nombre de equipo por línea</label>
              <textarea
                className="w-full p-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-500 rounded text-sm h-28 focus:outline-none focus:border-amber-500"
                placeholder={'Los Tigres\nÁguilas FC\nReal Amistad\n...'}
                value={textoMasivo}
                onChange={(e) => setTextoMasivo(e.target.value)}
              />
              <p className="text-[11px] text-gray-400 mt-1">Si algún nombre ya está en tu lista de Equipos Registrados, se reutiliza su logo automáticamente. Los que ya estén inscritos en este torneo se omiten.</p>
              <button onClick={cargarMasivo} disabled={cargando} className="w-full mt-2 bg-black hover:bg-gray-800 text-amber-400 p-2 rounded font-semibold text-sm transition disabled:opacity-50">
                {cargando ? 'Cargando...' : 'Cargar Equipos'}
              </button>
            </div>
          )}
        </div>

        {equipos.length >= 4 && (
          <div className="bg-green-900/20 p-6 rounded-lg shadow border border-green-800">
            <h3 className="font-bold text-green-400 mb-2 text-center">¡Mínimo alcanzado!</h3>
            <label className="block text-sm font-semibold text-green-400 mb-1">Hora de inicio (opcional)</label>
            <input
              type="datetime-local"
              className="w-full mb-4 p-2 border border-green-700 rounded text-sm bg-gray-800 text-white"
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
            />
            <button onClick={generarPartidos} disabled={cargando} className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded font-semibold transition disabled:opacity-50">
              {cargando ? 'Calculando...' : 'Cerrar Inscripciones y Generar Partidos'}
            </button>
          </div>
        )}
      </div>

      <div className="bg-gray-900 p-6 rounded-lg shadow border border-gray-800 md:col-span-2 h-fit">
        <h2 className="text-xl font-semibold mb-4 text-white">Equipos Inscritos ({equipos.length})</h2>
        {equipos.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aún no hay equipos inscritos.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {equipos.map((equipo, index) => (
              <div key={equipo.id} className="p-3 border border-gray-800 rounded-lg bg-gray-800">
                {editandoId === equipo.id ? (
                  <div className="flex items-center gap-2">
                    <input type="text" className="flex-1 p-2 border border-amber-500 bg-gray-800 text-white rounded text-sm" value={nombreEditado} onChange={(e) => setNombreEditado(e.target.value)} autoFocus />
                    <button onClick={() => guardarEdicion(equipo.id)} disabled={cargando} className="text-green-500 hover:text-green-400 font-bold px-2">✓</button>
                    <button onClick={() => setEditandoId(null)} className="text-gray-400 hover:text-gray-400 font-bold px-2">✕</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                      <span className="font-bold text-gray-400 w-6 shrink-0">{index + 1}.</span>
                      <span className="text-lg mr-2 shrink-0">{equipo.logo_url ? <img src={equipo.logo_url} alt="" className="w-6 h-6 rounded-full object-cover" /> : LOGO_PREDEFINIDO}</span>
                      <span className="font-semibold truncate">{equipo.nombre}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <button onClick={() => { setEditandoId(equipo.id); setNombreEditado(equipo.nombre) }} className="text-amber-600 hover:text-amber-700 text-sm" title="Editar nombre">✏️</button>
                      <button onClick={() => eliminarEquipo(equipo.id, equipo.nombre)} className="text-red-500 hover:text-red-700 text-sm" title="Eliminar equipo">🗑️</button>
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
