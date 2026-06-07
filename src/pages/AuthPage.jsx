import { useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { Zap, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function AuthPage({ onDemoLogin }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isSupabaseConfigured()) {
      onDemoLogin()
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: { data: { name: form.name } },
        })
        if (error) throw error
        setSuccess('Registrasi berhasil! Cek email untuk verifikasi, atau langsung login.')
        setMode('login')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        })
        if (error) throw error
        // Auth state listener di AppContext akan handle sisanya
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8"
         style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-sm animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-green flex items-center justify-center mx-auto mb-4"
               style={{ boxShadow: '0 8px 32px rgba(34,197,94,0.4)' }}>
            <Zap size={32} color="white" />
          </div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>BulkMate</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Asisten Bulking Personal Indonesia</p>
        </div>

        {/* Card */}
        <div className="card p-6">
          {/* Tabs */}
          <div className="tab-nav mb-5">
            <button className={`tab-btn ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError(null) }}>
              Masuk
            </button>
            <button className={`tab-btn ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); setError(null) }}>
              Daftar
            </button>
          </div>

          {success && (
            <div className="mb-4 p-3 rounded-xl text-sm font-medium"
                 style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
              ✅ {success}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm font-medium"
                 style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="label">Nama Lengkap</label>
                <input type="text" className="input-field" placeholder="Andi Pratama" required
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <input type="email" className="input-field" placeholder="email@example.com" required
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="Minimal 6 karakter"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  {mode === 'login' ? 'Masuk...' : 'Mendaftar...'}
                </span>
              ) : (
                mode === 'login' ? '🚀 Masuk' : '✨ Daftar Sekarang'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="divider flex-1" />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>atau</span>
            <div className="divider flex-1" />
          </div>

          {/* Demo login */}
          <button onClick={onDemoLogin} className="btn-secondary w-full">
            🎮 Coba Demo (Tanpa Daftar)
          </button>

          {!isSupabaseConfigured() && (
            <p className="text-center text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
              ⚠️ Mode offline – data disimpan di browser
            </p>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          BulkMate v1.0 · Made for Indonesian Bulkers 💪
        </p>
      </div>
    </div>
  )
}
