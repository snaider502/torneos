"use client"
import { calcularTablaPosiciones, clasificadosParaEliminatoria } from '../lib/torneoLogic'

const LOGO_PREDEFINIDO = '🛡️'

export default function TablaPosiciones({ equipos, partidos }) {
  const tabla = calcularTablaPosiciones(equipos, partidos)
  const numClasificados = clasificadosParaEliminatoria(equipos.length)
  const equipoOriginal = (id) => equipos.find((e) => e.id === id)

  return (
    <div className="overflow-x-auto">
      <h2 className="text-xl font-semibold mb-4 text-white">📊 Tabla de Posiciones</h2>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900 text-xs uppercase text-gray-500">
            <th className="p-2 w-2"></th>
            <th className="p-2">Pos</th>
            <th className="p-2"></th>
            <th className="p-2">Equipo</th>
            <th className="p-2 text-center">PJ</th>
            <th className="p-2 text-center">PG</th>
            <th className="p-2 text-center">PE</th>
            <th className="p-2 text-center">PP</th>
            <th className="p-2 text-center">DG</th>
            <th className="p-2 text-center font-bold">PTS</th>
          </tr>
        </thead>
        <tbody>
          {tabla.map((eq, index) => {
            const logo = equipoOriginal(eq.id)?.logo_url
            return (
              <tr key={eq.id} className="border-b hover:bg-gray-800/60">
                <td className="p-0"><div className={`w-1.5 h-full min-h-[2.5rem] ${index < numClasificados ? 'bg-amber-500' : 'bg-transparent'}`}></div></td>
                <td className="p-2 font-bold text-gray-500">{index + 1}</td>
                <td className="p-2">{logo ? <img src={logo} alt="" className="w-6 h-6 rounded-full object-cover" /> : <span>{LOGO_PREDEFINIDO}</span>}</td>
                <td className="p-2 font-semibold">{eq.nombre}</td>
                <td className="p-2 text-center">{eq.pj}</td>
                <td className="p-2 text-center">{eq.pg}</td>
                <td className="p-2 text-center">{eq.pe}</td>
                <td className="p-2 text-center">{eq.pp}</td>
                <td className="p-2 text-center">{eq.dg}</td>
                <td className="p-2 text-center font-bold text-amber-600">{eq.pts}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
        <span className="inline-block w-3 h-3 bg-amber-500 rounded-sm"></span> Clasifican a la eliminatoria directa (top {numClasificados})
      </p>
    </div>
  )
}
