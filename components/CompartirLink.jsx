"use client"

export default function CompartirLink({ torneoId }) {
  const linkPublico = typeof window !== 'undefined' ? `${window.location.origin}?torneo=${torneoId}` : ''

  return (
    <div className="text-center py-6">
      <h2 className="text-xl font-semibold mb-2 text-white">🔗 Link Público del Torneo</h2>
      <p className="text-sm text-gray-400 mb-6">Comparte este enlace con todos los equipos o amigos en WhatsApp.</p>
      <div className="flex items-center justify-center gap-2 mb-4">
        <input type="text" readOnly value={linkPublico} className="w-full max-w-md p-3 border border-gray-700 rounded bg-gray-800 text-white text-sm" />
        <button onClick={() => { navigator.clipboard.writeText(linkPublico); alert('¡Link copiado al portapapeles!') }} className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-3 rounded font-semibold text-sm transition">
          Copiar
        </button>
      </div>
      <a href={linkPublico} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline text-sm">
        Abrir vista pública en una pestaña nueva →
      </a>
    </div>
  )
}
