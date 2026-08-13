"use client"
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import Marca from './Marca'
import Footer from './Footer'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)

  const handleAuth = async (e) => {
    e.preventDefault()
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) alert(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) alert(error.message)
      else alert('¡Registro exitoso! Ya puedes iniciar sesión.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-4">
      <Marca tamano="grande" />
      <form onSubmit={handleAuth} className="bg-gray-900 p-8 rounded-lg shadow-md w-96 border border-gray-800 mt-6">
        <h2 className="text-2xl font-bold mb-6 text-center text-amber-600">{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</h2>
        <input type="email" placeholder="Tu correo" className="w-full mb-4 p-3 border border-gray-700 bg-gray-800 text-white placeholder-gray-500 rounded focus:outline-none focus:border-amber-500" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Contraseña (mínimo 6 letras)" className="w-full mb-6 p-3 border border-gray-700 bg-gray-800 text-white placeholder-gray-500 rounded focus:outline-none focus:border-amber-500" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-black p-3 rounded font-semibold transition">
          {isLogin ? 'Entrar al panel' : 'Registrar administrador'}
        </button>
        <p className="text-center text-sm text-gray-500 mt-4 cursor-pointer hover:text-amber-600" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? '¿Nuevo aquí? Crea tu cuenta' : '¿Ya eres admin? Inicia sesión'}
        </p>
      </form>
      <Footer />
    </div>
  )
}
