import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { calculateBMR, calculateTDEE, calculateProteinTarget, ACTIVITY_LEVELS, categorizeBMI } from '../utils/helpers'
import { Settings, Save, User, Target, Sun, Moon, Trash2, Download, LogOut, Zap } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export default function SettingsPage() {
  const { state, dispatch } = useApp()
  const { profile, theme, reminders } = state

  const [form, setForm] = useState({
    name: profile?.name || '',
    age: profile?.age || 21,
    gender: profile?.gender || 'male',
    weight: profile?.weight || 58,
    height: profile?.height || 170,
    target_weight: profile?.target_weight || 68,
    activity_level: profile?.activity_level || 'moderate',
    surplus: profile?.surplus || 500,
  })
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  const bmi = form.weight && form.height ? categorizeBMI(form.weight, form.height) : null
  const bmr = calculateBMR(form.gender, form.weight, form.height, form.age)
  const tdee = calculateTDEE(bmr, form.activity_level)
  const calorieTarget = tdee + Number(form.surplus)
  const proteinTarget = calculateProteinTarget(form.weight)

  const handleSave = () => {
    const updatedProfile = {
      ...form,
      bmr,
      tdee,
      daily_calorie_target: calorieTarget,
      protein_target: proteinTarget,
      carb_target: Math.round((calorieTarget * 0.45) / 4),
      fat_target: Math.round((calorieTarget * 0.25) / 9),
    }
    dispatch({ type: 'SET_PROFILE', payload: updatedProfile })
    dispatch({ type: 'SET_NUTRITION_TARGET', payload: updatedProfile })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleResetData = () => {
    if (window.confirm('Yakin ingin mereset semua data? Ini tidak dapat dibatalkan!')) {
      Object.keys(localStorage).filter(k => k.startsWith('bulkmate_')).forEach(k => localStorage.removeItem(k))
      window.location.reload()
    }
  }

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut()
    }
    Object.keys(localStorage).filter(k => k.startsWith('bulkmate_')).forEach(k => localStorage.removeItem(k))
    window.location.reload()
  }

  const handleExportData = () => {
    const data = {
      profile: state.profile,
      dailyLogs: state.dailyLogs,
      weightLogs: state.weightLogs,
      expenses: state.expenses,
      favoriteFoods: state.favoriteFoods,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bulkmate-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'targets', label: 'Target', icon: Target },
    { id: 'app', label: 'Aplikasi', icon: Settings },
  ]

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h1 className="section-title text-xl">Pengaturan</h1>
        <p className="section-subtitle">Kelola profil dan preferensi aplikasi</p>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl p-5 flex items-center gap-4"
           style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', boxShadow: '0 8px 24px rgba(34,197,94,0.3)' }}>
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-black text-white flex-shrink-0">
          {form.name?.charAt(0) || 'U'}
        </div>
        <div className="text-white">
          <div className="font-black text-xl">{form.name || 'User'}</div>
          <div className="text-green-100 text-sm">{form.weight} kg → {form.target_weight} kg</div>
          {bmi && (
            <div className="mt-1 inline-flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5 text-xs font-semibold">
              BMI {bmi.bmi} - {bmi.label}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-nav">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`tab-btn flex items-center gap-1.5 ${activeTab === tab.id ? 'active' : ''}`}>
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'profile' && (
        <div className="card p-5 animate-fade-in">
          <h2 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Data Diri</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Nama</label>
              <input type="text" className="input-field" placeholder="Nama lengkap"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Umur</label>
                <input type="number" className="input-field" min={15} max={80}
                  value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />
              </div>
              <div>
                <label className="label">Jenis Kelamin</label>
                <select className="input-field" value={form.gender}
                  onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                  <option value="male">Laki-laki</option>
                  <option value="female">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="label">Berat Badan (kg)</label>
                <input type="number" className="input-field" min={30} max={300} step={0.1}
                  value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
              </div>
              <div>
                <label className="label">Tinggi Badan (cm)</label>
                <input type="number" className="input-field" min={100} max={250}
                  value={form.height} onChange={e => setForm(f => ({ ...f, height: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="label">Tingkat Aktivitas</label>
              <select className="input-field" value={form.activity_level}
                onChange={e => setForm(f => ({ ...f, activity_level: e.target.value }))}>
                {Object.entries(ACTIVITY_LEVELS).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'targets' && (
        <div className="card p-5 animate-fade-in">
          <h2 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Target Bulking</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Target Berat Badan (kg)</label>
              <input type="number" className="input-field" min={30} max={300} step={0.1}
                value={form.target_weight} onChange={e => setForm(f => ({ ...f, target_weight: e.target.value }))} />
            </div>
            <div>
              <label className="label">Surplus Kalori Harian (kcal)</label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {[
                  { value: 250, label: 'Clean Bulk', desc: '+250' },
                  { value: 500, label: 'Lean Bulk', desc: '+500' },
                  { value: 750, label: 'Dirty Bulk', desc: '+750' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => setForm(f => ({ ...f, surplus: opt.value }))}
                    className="py-3 rounded-xl text-sm border transition-all"
                    style={{
                      background: form.surplus === opt.value ? 'rgba(34,197,94,0.08)' : 'var(--bg-secondary)',
                      borderColor: form.surplus === opt.value ? '#22c55e' : 'var(--border-color)',
                      color: form.surplus === opt.value ? '#22c55e' : 'var(--text-secondary)',
                    }}>
                    <div className="font-bold">{opt.desc}</div>
                    <div className="text-xs opacity-70">{opt.label}</div>
                  </button>
                ))}
              </div>
              <input type="number" className="input-field" min={100} max={1000} step={50}
                value={form.surplus} onChange={e => setForm(f => ({ ...f, surplus: e.target.value }))} />
            </div>

            {/* Calculated targets preview */}
            <div className="rounded-xl p-4" style={{ background: 'var(--bg-secondary)' }}>
              <div className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
                Target Yang Dihitung Otomatis
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'BMR', value: `${bmr} kcal`, color: '#22c55e' },
                  { label: 'TDEE', value: `${tdee} kcal`, color: '#3b82f6' },
                  { label: 'Target Kalori', value: `${calorieTarget} kcal`, color: '#f97316' },
                  { label: 'Target Protein', value: `${proteinTarget}g`, color: '#a855f7' },
                ].map(t => (
                  <div key={t.label} className="text-center">
                    <div className="font-black" style={{ color: t.color }}>{t.value}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'app' && (
        <div className="space-y-4 animate-fade-in">
          {/* Theme */}
          <div className="card p-5">
            <h2 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Tampilan</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon size={20} style={{ color: 'var(--text-secondary)' }} /> : <Sun size={20} style={{ color: '#f97316' }} />}
                <div>
                  <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {theme === 'dark' ? 'Mode gelap aktif' : 'Mode terang aktif'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => dispatch({ type: 'SET_THEME', payload: theme === 'dark' ? 'light' : 'dark' })}
                className="relative w-12 h-6 rounded-full transition-all duration-300"
                style={{ background: theme === 'dark' ? '#22c55e' : 'var(--border-color)' }}>
                <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300"
                      style={{ left: theme === 'dark' ? '26px' : '2px' }} />
              </button>
            </div>
          </div>

          {/* Data Management */}
          <div className="card p-5">
            <h2 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Manajemen Data</h2>
            <div className="space-y-3">
              <button onClick={handleExportData}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors"
                style={{ background: 'var(--bg-secondary)' }}>
                <div className="w-9 h-9 rounded-xl gradient-blue flex items-center justify-center">
                  <Download size={16} color="white" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Export Data (JSON)</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Backup semua data ke file JSON</div>
                </div>
              </button>

              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors"
                style={{ background: 'rgba(239,68,68,0.05)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                     style={{ background: 'rgba(239,68,68,0.1)' }}>
                  <LogOut size={16} color="#ef4444" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm" style={{ color: '#ef4444' }}>Keluar / Logout</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Keluar dari akun dan hapus sesi</div>
                </div>
              </button>

              <button onClick={handleResetData}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors"
                style={{ background: 'rgba(239,68,68,0.05)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                     style={{ background: 'rgba(239,68,68,0.1)' }}>
                  <Trash2 size={16} color="#ef4444" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm" style={{ color: '#ef4444' }}>Reset Semua Data</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Hapus seluruh data aplikasi</div>
                </div>
              </button>
            </div>
          </div>

          {/* App Info */}
          <div className="card p-5 text-center">
            <div className="w-14 h-14 rounded-2xl gradient-green flex items-center justify-center mx-auto mb-3"
                 style={{ boxShadow: '0 4px 16px rgba(34,197,94,0.3)' }}>
              <Zap size={28} color="white" />
            </div>
            <div className="font-black text-lg" style={{ color: 'var(--text-primary)' }}>BulkMate</div>
            <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Versi 1.0.0</div>
            <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              Personal Bulking Assistant untuk Mahasiswa & Pekerja Indonesia
            </div>
            <div className="mt-3 flex justify-center gap-2">
              <div className="badge badge-green">PWA Ready</div>
              <div className="badge badge-blue">Offline Support</div>
            </div>
          </div>
        </div>
      )}

      {/* Save button */}
      {activeTab !== 'app' && (
        <button onClick={handleSave}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2">
          <Save size={18} />
          {saved ? 'Tersimpan!' : 'Simpan Pengaturan'}
        </button>
      )}
    </div>
  )
}
