"use client"
import { clasificadosParaEliminatoria } from '../lib/torneoLogic'

export default function Reglamento({ numEquipos }) {
  const aplica = (min, max) => numEquipos && numEquipos >= min && (max === null || numEquipos <= max)
  const clasificadosActual = numEquipos >= 9 ? clasificadosParaEliminatoria(numEquipos) : null

  const Regla = ({ activa, children }) => (
    <li className={`flex items-start gap-2 ${activa ? 'text-black font-semibold' : 'text-gray-500'}`}>
      <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${activa ? 'bg-amber-500' : 'bg-gray-300'}`}></span>
      <span>{children}</span>
    </li>
  )

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold mb-1 text-white">📜 Reglamento del Torneo</h2>
      <p className="text-sm text-gray-500 mb-6">Así se define el formato de juego según la cantidad de equipos inscritos.</p>

      <div className="mb-6">
        <h3 className="text-sm font-bold uppercase text-amber-600 mb-2">Equipos</h3>
        <p className="text-sm text-gray-300">Cada torneo admite entre 4 y 64 equipos, editables mientras esté en fase de inscripción.</p>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-bold uppercase text-amber-600 mb-2">Formato según cantidad de equipos</h3>
        <ul className="space-y-2 text-sm">
          <Regla activa={aplica(4, 8)}>
            <strong>4 a 8 equipos:</strong> eliminación directa, ida y vuelta, en cada llave. El sorteo de los cruces es completamente aleatorio en cada fase.
          </Regla>
          <Regla activa={aplica(9, 32)}>
            <strong>9 a 32 equipos:</strong> fase de grupos (cada equipo juega 3 partidos, calendario por jornadas). Clasifican los <strong>8 mejores</strong> de la tabla a la eliminatoria directa a partido único.
          </Regla>
          <Regla activa={aplica(33, 48)}>
            <strong>33 a 48 equipos:</strong> fase de grupos igual que arriba. Clasifican los <strong>16 mejores</strong> a la eliminatoria directa a partido único.
          </Regla>
          <Regla activa={aplica(49, null)}>
            <strong>49 equipos o más:</strong> fase de grupos igual que arriba. Clasifican los <strong>32 mejores</strong> a la eliminatoria directa a partido único.
          </Regla>
        </ul>
        {clasificadosActual && (
          <p className="text-xs text-amber-400 bg-amber-900/20 border border-amber-800 rounded p-2 mt-3">
            Con los {numEquipos} equipos actuales de este torneo, clasificarán <strong>{clasificadosActual}</strong> a la eliminatoria.
          </p>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-bold uppercase text-amber-600 mb-2">Fase de grupos (9+ equipos)</h3>
        <ul className="space-y-1 text-sm text-gray-300 list-disc list-inside">
          <li>Cada equipo juega exactamente 3 partidos, uno por jornada.</li>
          <li>Puntos: victoria = 3, empate = 1, derrota = 0.</li>
          <li>Si el número de equipos es impar, en cada jornada un equipo distinto descansa y recibe la victoria automática, para que todos terminen con 3 partidos.</li>
          <li>Desempates en la tabla: 1° puntos, 2° diferencia de goles, 3° goles a favor.</li>
        </ul>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-bold uppercase text-amber-600 mb-2">Eliminatoria directa</h3>
        <ul className="space-y-1 text-sm text-gray-300 list-disc list-inside">
          <li>El sorteo de los cruces es aleatorio en cada fase (no se arma con base en la posición de la tabla).</li>
          <li>Para 4-8 equipos: cada ronda se juega ida y vuelta.</li>
          <li>Para las eliminatorias que salen de la fase de grupos: cada ronda se juega a partido único.</li>
          <li>En caso de empate (global o en partido único), el administrador define manualmente al ganador (ej. por definición a penales).</li>
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase text-amber-600 mb-2">Marcadores</h3>
        <p className="text-sm text-gray-300">Únicamente el administrador que creó el torneo puede ingresar o corregir marcadores.</p>
      </div>
    </div>
  )
}
