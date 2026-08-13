"use client"

export default function Marca({ tamano = 'normal' }) {
  const alto = tamano === 'grande' ? 'h-40' : 'h-20'
  return (
    <div className="flex items-center gap-2">
      <img src="/logo.png" alt="LECP - Liga Elite Clubes Pro" className={`${alto} w-auto object-contain`} />
    </div>
  )
}
