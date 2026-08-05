'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError('Credenciais inválidas.')
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A1A1A] px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-playfair text-2xl text-white mb-1">VerumForma</h1>
        <p className="text-sm text-[#9E9994] mb-8">Plataforma de gestão</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#6B6560] mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-transparent border border-[rgba(255,255,255,0.2)] text-white text-sm px-3 py-2.5 outline-none focus:border-white transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#6B6560] mb-2">Palavra-passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-transparent border border-[rgba(255,255,255,0.2)] text-white text-sm px-3 py-2.5 outline-none focus:border-white transition-colors"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 text-xs uppercase tracking-wider bg-white text-[#1A1A1A] px-5 py-3 hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? 'A entrar…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
