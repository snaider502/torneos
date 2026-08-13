// ============================================================
// EL "CEREBRO" DEL TORNEO
// Toda la lógica de emparejamientos, avance de rondas y tabla
// vive aquí, separada de la interfaz, para que sea fácil de
// revisar y depurar sin tener que buscar entre cientos de líneas
// de JSX.
// ============================================================

// Baraja un arreglo sin mutar el original
export function mezclar(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}

// La siguiente potencia de 2 igual o mayor a n (4 -> 4, 5 -> 8, 8 -> 8, 9 -> 16)
export function siguientePotenciaDeDos(n) {
  let p = 1
  while (p < n) p *= 2
  return p
}

// Nombre de fase según el tamaño del bracket en esa ronda
export function faseParaTamano(potencia) {
  if (potencia <= 2) return 'final'
  if (potencia <= 4) return 'semifinal'
  if (potencia <= 8) return 'cuartos'
  if (potencia <= 16) return 'octavos'
  return 'dieciseisavos'
}

// ¿Cuántos equipos clasifican de la fase de grupos a la eliminatoria?
// 9-32 equipos -> clasifican 8 | 33-48 -> clasifican 16 | 49 o más -> clasifican 32
export function clasificadosParaEliminatoria(numEquipos) {
  if (numEquipos <= 32) return 8
  if (numEquipos <= 48) return 16
  return 32
}

// --------------------------------------------------------
// FASE 1A: Bracket inicial para 4-8 equipos (eliminación directa)
// Si el número de equipos no es potencia de 2, los equipos que
// sobran reciben "bye" (pasan directo sin jugar esa ronda).
// --------------------------------------------------------
export function generarBracketInicial(equipos, torneoId, horaInicio) {
  const n = equipos.length
  const potencia = siguientePotenciaDeDos(n)
  const byes = potencia - n
  const arr = mezclar(equipos)
  const conBye = arr.slice(0, byes)
  const juegan = arr.slice(byes)
  const fase = faseParaTamano(potencia)
  const horaIda = horaInicio || null
  const horaVuelta = horaInicio ? new Date(new Date(horaInicio).getTime() + MINUTOS_ENTRE_JORNADAS * 60000).toISOString() : null

  let partidos = []

  conBye.forEach((eq) => {
    partidos.push({
      torneo_id: torneoId,
      local_id: eq.id,
      visitante_id: null,
      fase,
      modalidad: 'bye',
      estado: 'finalizado',
      goles_local: 1,
      goles_visitante: 0,
      jornada: 1,
      hora_programada: horaIda,
    })
  })

  for (let i = 0; i < juegan.length; i += 2) {
    const local = juegan[i]
    const visitante = juegan[i + 1]
    partidos.push({ torneo_id: torneoId, local_id: local.id, visitante_id: visitante.id, fase, modalidad: 'ida', estado: 'pendiente', jornada: 1, hora_programada: horaIda })
    partidos.push({ torneo_id: torneoId, local_id: visitante.id, visitante_id: local.id, fase, modalidad: 'vuelta', estado: 'pendiente', jornada: 2, hora_programada: horaVuelta })
  }

  return { partidos, faseInicial: fase }
}

// --------------------------------------------------------
// FASE 1B: 3 jornadas para 9+ equipos (fase de grupos), usando el
// "método del círculo" para que cada equipo juegue UNA sola vez por
// jornada. Si el número de equipos es impar, en cada jornada un
// equipo distinto queda libre y se le da la victoria automática
// (partido "fantasma"), para que todos terminen con 3 partidos.
// Cada jornada se programa 30 minutos después de la anterior.
// --------------------------------------------------------
const MINUTOS_ENTRE_JORNADAS = 30

export function generarFaseDeGrupos(equipos, torneoId, horaInicio) {
  const JORNADAS = 3
  let arr = mezclar(equipos).map((e) => e.id)
  // Si el número es impar, agregamos un "hueco" (null) que representa el descanso
  if (arr.length % 2 !== 0) arr.push(null)

  const n = arr.length
  let partidos = []

  for (let jornada = 1; jornada <= JORNADAS; jornada++) {
    const horaJornada = horaInicio ? new Date(new Date(horaInicio).getTime() + (jornada - 1) * MINUTOS_ENTRE_JORNADAS * 60000).toISOString() : null

    for (let i = 0; i < n / 2; i++) {
      const a = arr[i]
      const b = arr[n - 1 - i]
      if (a === null || b === null) {
        // El equipo que no tiene rival esta jornada gana automático
        const equipoLibre = a ?? b
        partidos.push({ torneo_id: torneoId, local_id: equipoLibre, visitante_id: null, fase: 'aleatoria', modalidad: 'bye', estado: 'finalizado', goles_local: 1, goles_visitante: 0, jornada, hora_programada: horaJornada })
      } else {
        partidos.push({ torneo_id: torneoId, local_id: a, visitante_id: b, fase: 'aleatoria', modalidad: 'unico', estado: 'pendiente', jornada, hora_programada: horaJornada })
      }
    }

    // Rotamos todos menos el primer equipo (método del círculo)
    const fijo = arr[0]
    const resto = arr.slice(1)
    resto.unshift(resto.pop())
    arr = [fijo, ...resto]
  }

  return partidos
}

// --------------------------------------------------------
// Bracket de eliminación a partir de los clasificados de la fase de
// grupos (8, 16 o 32 según el tamaño del torneo): siempre a un solo
// partido, según lo que pediste.
// --------------------------------------------------------
export function generarBracketDesdeClasificados(clasificadosEquipos, torneoId, horaInicio) {
  const arr = mezclar(clasificadosEquipos)
  const fase = faseParaTamano(siguientePotenciaDeDos(arr.length))
  let partidos = []
  for (let i = 0; i < arr.length; i += 2) {
    partidos.push({ torneo_id: torneoId, local_id: arr[i].id, visitante_id: arr[i + 1].id, fase, modalidad: 'unico', estado: 'pendiente', jornada: 1, hora_programada: horaInicio || null })
  }
  return { partidos, faseInicial: fase }
}

// --------------------------------------------------------
// Tabla de posiciones: SOLO cuenta partidos de la fase de grupos ('aleatoria')
// --------------------------------------------------------
export function calcularTablaPosiciones(equipos, partidos) {
  let stats = {}
  equipos.forEach((eq) => {
    stats[eq.id] = { id: eq.id, nombre: eq.nombre, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0 }
  })

  partidos
    .filter((p) => p.fase === 'aleatoria' && p.estado === 'finalizado')
    .forEach((p) => {
      const l = stats[p.local_id]
      if (!l) return

      // Partido "fantasma" (bye): victoria automática, no hay rival
      if (p.modalidad === 'bye' || !p.visitante_id) {
        l.pj++; l.pg++; l.pts += 3; l.gf += p.goles_local || 1
        return
      }

      const v = stats[p.visitante_id]
      if (!v) return
      l.pj++; v.pj++
      l.gf += p.goles_local; l.gc += p.goles_visitante
      v.gf += p.goles_visitante; v.gc += p.goles_local
      if (p.goles_local > p.goles_visitante) { l.pg++; l.pts += 3; v.pp++ }
      else if (p.goles_local < p.goles_visitante) { v.pg++; v.pts += 3; l.pp++ }
      else { l.pe++; l.pts += 1; v.pe++; v.pts += 1 }
    })

  Object.values(stats).forEach((s) => (s.dg = s.gf - s.gc))
  return Object.values(stats).sort((a, b) => (b.pts !== a.pts ? b.pts - a.pts : b.dg !== a.dg ? b.dg - a.dg : b.gf - a.gf))
}

// --------------------------------------------------------
// ¿Ya se jugaron (o resolvieron) todos los partidos de la ronda actual?
// --------------------------------------------------------
export function rondaCompleta(partidosDeLaRonda) {
  return partidosDeLaRonda.length > 0 && partidosDeLaRonda.every((p) => p.estado === 'finalizado')
}

// --------------------------------------------------------
// Agrupa los partidos de la ronda actual en "llaves" (una llave = un
// enfrentamiento, ya sea bye, partido único, o par ida/vuelta) y calcula
// el ganador de cada una. Si hay un empate sin resolver, ganadorId es null
// y necesitaEmpate es true, para que la interfaz pida que el admin decida.
// --------------------------------------------------------
export function calcularLlaves(partidosDeLaRonda) {
  const llaves = []
  const usados = new Set()

  partidosDeLaRonda.forEach((p) => {
    if (usados.has(p.id)) return

    if (p.modalidad === 'bye') {
      llaves.push({ partidos: [p], ganadorId: p.local_id, necesitaEmpate: false })
      usados.add(p.id)
      return
    }

    if (p.modalidad === 'unico') {
      let ganadorId = null
      let necesitaEmpate = false
      if (p.estado === 'finalizado') {
        if (p.goles_local > p.goles_visitante) ganadorId = p.local_id
        else if (p.goles_local < p.goles_visitante) ganadorId = p.visitante_id
        else if (p.ganador_manual_id) ganadorId = p.ganador_manual_id
        else necesitaEmpate = true
      }
      llaves.push({ partidos: [p], ganadorId, necesitaEmpate, equipoA: p.local_id, equipoB: p.visitante_id })
      usados.add(p.id)
      return
    }

    if (p.modalidad === 'ida') {
      const vuelta = partidosDeLaRonda.find(
        (q) => q.modalidad === 'vuelta' && q.local_id === p.visitante_id && q.visitante_id === p.local_id
      )
      usados.add(p.id)
      if (vuelta) usados.add(vuelta.id)

      let ganadorId = null
      let necesitaEmpate = false
      if (p.estado === 'finalizado' && vuelta && vuelta.estado === 'finalizado') {
        const golesA = p.goles_local + vuelta.goles_visitante // equipo local del partido de ida
        const golesB = p.goles_visitante + vuelta.goles_local // equipo visitante del partido de ida
        if (golesA > golesB) ganadorId = p.local_id
        else if (golesB > golesA) ganadorId = p.visitante_id
        else if (vuelta.ganador_manual_id) ganadorId = vuelta.ganador_manual_id
        else necesitaEmpate = true
      }
      llaves.push({ partidos: vuelta ? [p, vuelta] : [p], ganadorId, necesitaEmpate, equipoA: p.local_id, equipoB: p.visitante_id })
    }
  })

  return llaves
}

// --------------------------------------------------------
// A partir de los ganadores de la ronda actual, arma los partidos de
// la siguiente ronda (o determina que el torneo ya tiene campeón).
// idaYVuelta: true para el bracket de 4-8 equipos, false para las
// eliminatorias que salen de la fase de grupos (siempre a un partido).
// --------------------------------------------------------
export function generarSiguienteRonda(ganadoresIds, torneoId, idaYVuelta, horaInicio) {
  if (ganadoresIds.length === 1) {
    return { terminado: true, campeonId: ganadoresIds[0], partidos: [], nuevaFase: null }
  }

  const potencia = siguientePotenciaDeDos(ganadoresIds.length)
  const nuevaFase = faseParaTamano(potencia)
  const arr = mezclar(ganadoresIds)
  const horaIda = horaInicio || null
  const horaVuelta = horaInicio ? new Date(new Date(horaInicio).getTime() + MINUTOS_ENTRE_JORNADAS * 60000).toISOString() : null
  let partidos = []

  for (let i = 0; i < arr.length; i += 2) {
    if (idaYVuelta) {
      partidos.push({ torneo_id: torneoId, local_id: arr[i], visitante_id: arr[i + 1], fase: nuevaFase, modalidad: 'ida', estado: 'pendiente', jornada: 1, hora_programada: horaIda })
      partidos.push({ torneo_id: torneoId, local_id: arr[i + 1], visitante_id: arr[i], fase: nuevaFase, modalidad: 'vuelta', estado: 'pendiente', jornada: 2, hora_programada: horaVuelta })
    } else {
      partidos.push({ torneo_id: torneoId, local_id: arr[i], visitante_id: arr[i + 1], fase: nuevaFase, modalidad: 'unico', estado: 'pendiente', jornada: 1, hora_programada: horaIda })
    }
  }

  return { terminado: false, campeonId: null, partidos, nuevaFase }
}

export const NOMBRES_FASE = {
  aleatoria: 'Fase de Grupos',
  dieciseisavos: 'Dieciseisavos de Final',
  octavos: 'Octavos de Final',
  cuartos: 'Cuartos de Final',
  semifinal: 'Semifinal',
  final: 'Final',
}

// Orden de "avance" de las fases (de la más temprana a la más avanzada)
export const ORDEN_FASES = ['aleatoria', 'dieciseisavos', 'octavos', 'cuartos', 'semifinal', 'final']

// Agrupa los partidos por fase y devuelve las secciones ordenadas de la
// ronda MÁS RECIENTE/AVANZADA primero, y la fase de grupos al final.
// Útil para mostrar "Semifinal" arriba, separado de los partidos ya
// jugados de rondas anteriores.
export function agruparPorRonda(partidos) {
  const presentes = ORDEN_FASES.filter((fase) => partidos.some((p) => p.fase === fase))
  return presentes
    .slice()
    .reverse()
    .map((fase) => ({
      fase,
      nombre: NOMBRES_FASE[fase] || fase,
      jornadas: agruparPorJornada(partidos.filter((p) => p.fase === fase)),
    }))
}

// Agrupa los partidos de una fase en jornadas (Jornada 1, Jornada 2...)
// ordenadas de la más próxima/reciente a la más antigua.
export function agruparPorJornada(partidosDeLaFase) {
  const numeros = [...new Set(partidosDeLaFase.map((p) => p.jornada || 1))].sort((a, b) => b - a)
  return numeros.map((jornada) => ({
    jornada,
    hora: partidosDeLaFase.find((p) => p.jornada === jornada)?.hora_programada || null,
    partidos: partidosDeLaFase.filter((p) => (p.jornada || 1) === jornada),
  }))
}

// Formatea una hora ISO a algo como "10:00 PM"
export function formatearHora(horaIso) {
  if (!horaIso) return null
  return new Date(horaIso).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', hour12: true })
}
