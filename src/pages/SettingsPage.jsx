import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { calculateBMR, calculateTDEE, calculateProteinTarget, ACTIVITY_LEVELS, categorizeBMI } from '../utils/helpers'
import { Settings, Save, User, Target, Sun, Moon, Trash2, Download, LogOut, Zap, AlertTriangle, X, RefreshCw, Smartphone } from 'lucide-react'
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
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  // Posisi Dynamic Island — sesuaikan dengan kamera depan HP
  const [camPos, setCamPos] = useState(() => {
    try {
      const s = localStorage.getItem('bulkmate_camera_position')
      return s ? JSON.parse(s) : { offsetX: 0, offsetY: 0 }
    } catch { return { offsetX: 0, offsetY: 0 } }
  })
  const saveCamPos = (pos) => {
    const next = { ...camPos, ...pos }
    setCamPos(next)
    localStorage.setItem('bulkmate_camera_position', JSON.stringify(next))
  }

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
    Object.keys(localStorage).filter(k => k.startsWith('bulkmate_')).forEach(k => localStorage.removeItem(k))
    window.location.reload()
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
      <div className="mobile-page-header">
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

            {/* Dark Mode Toggle Row */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderRadius: 14,
              background: theme === 'dark' ? 'rgba(34,197,94,0.06)' : 'var(--bg-secondary)',
              border: `1px solid ${theme === 'dark' ? 'rgba(34,197,94,0.2)' : 'var(--border-color)'}`,
              transition: 'all 0.3s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Icon container */}
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: theme === 'dark' ? 'rgba(34,197,94,0.15)' : 'rgba(249,115,22,0.12)',
                  flexShrink: 0,
                }}>
                  {theme === 'dark'
                    ? <Moon size={20} color="#22c55e" />
                    : <Sun size={20} color="#f97316" />}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                    {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                    {theme === 'dark' ? 'Mode gelap aktif' : 'Ketuk untuk aktifkan dark mode'}
                  </div>
                </div>
              </div>

              {/* Toggle Switch — ukuran besar & jelas */}
              <button
                onClick={() => dispatch({ type: 'SET_THEME', payload: theme === 'dark' ? 'light' : 'dark' })}
                aria-label="Toggle dark mode"
                style={{
                  position: 'relative',
                  width: 54,
                  height: 30,
                  borderRadius: 99,
                  border: 'none',
                  cursor: 'pointer',
                  flexShrink: 0,
                  padding: 0,
                  background: theme === 'dark'
                    ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                    : '#cbd5e1',
                  boxShadow: theme === 'dark'
                    ? '0 0 0 3px rgba(34,197,94,0.25), inset 0 1px 3px rgba(0,0,0,0.2)'
                    : 'inset 0 1px 3px rgba(0,0,0,0.15)',
                  transition: 'background 0.3s ease, box-shadow 0.3s ease',
                  minHeight: 'unset',
                }}>
                <span style={{
                  position: 'absolute',
                  top: 3,
                  left: theme === 'dark' ? 27 : 3,
                  width: 24,
                  height: 24,
                  background: 'white',
                  borderRadius: '50%',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                  transition: 'left 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }} />
              </button>
            </div>
          </div>

          {/* Posisi Dynamic Island — sesuaikan dengan kamera depan HP */}
          <div className="card p-5">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
              }}>
                <Smartphone size={18} color="white" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Posisi Notifikasi (Dynamic Island)</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>Sesuaikan agar pas di atas kamera depan HP kamu</div>
              </div>
            </div>

            {/* Preview mini HP */}
            <div style={{
              position: 'relative', width: '100%', height: 80,
              background: 'var(--bg-secondary)', borderRadius: 14,
              border: '1px solid var(--border-color)',
              overflow: 'hidden', marginBottom: 16,
            }}>
              {/* Status bar simulasi */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 20, background: 'rgba(0,0,0,0.08)' }} />
              {/* Island preview */}
              <div style={{
                position: 'absolute',
                top: 4,
                left: `calc(50% + ${camPos.offsetX}px)`,
                transform: 'translateX(-50%)',
                width: 52, height: 14,
                background: '#111',
                borderRadius: 99,
                boxShadow: '0 0 8px rgba(99,102,241,0.6)',
                border: '1px solid rgba(99,102,241,0.5)',
                transition: 'left 0.2s ease',
              }} />
              <div style={{
                position: 'absolute', bottom: 6, left: 0, right: 0,
                textAlign: 'center', fontSize: 11, color: 'var(--text-muted)',
              }}>
                Preview posisi notifikasi
              </div>
            </div>

            {/* Geser Kiri – Kanan */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Posisi Horizontal</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{camPos.offsetX > 0 ? `+${camPos.offsetX}` : camPos.offsetX}px</span>
              </div>
              <input
                type="range" min={-120} max={120} step={4}
                value={camPos.offsetX}
                onChange={e => saveCamPos({ offsetX: Number(e.target.value) })}
                style={{ width: '100%', accentColor: '#6366f1' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                <span>Kiri</span>
                <span>Tengah</span>
                <span>Kanan</span>
              </div>
            </div>

            {/* Geser Atas – Bawah */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Posisi Vertikal (jarak dari atas)</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{camPos.offsetY >= 0 ? `+${camPos.offsetY}` : camPos.offsetY}px</span>
              </div>
              <input
                type="range" min={-4} max={24} step={1}
                value={camPos.offsetY}
                onChange={e => saveCamPos({ offsetY: Number(e.target.value) })}
                style={{ width: '100%', accentColor: '#6366f1' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                <span>Lebih atas</span>
                <span>Lebih bawah</span>
              </div>
            </div>

            {/* Preset cepat */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Preset Cepat</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { label: 'Tengah', offsetX: 0, offsetY: 0 },
                  { label: 'Sedikit Kiri', offsetX: -30, offsetY: 0 },
                  { label: 'Sedikit Kanan', offsetX: 30, offsetY: 0 },
                  { label: 'Kiri Jauh', offsetX: -80, offsetY: 0 },
                ].map(p => (
                  <button
                    key={p.label}
                    onClick={() => saveCamPos({ offsetX: p.offsetX, offsetY: p.offsetY })}
                    style={{
                      padding: '5px 12px', borderRadius: 99, fontSize: 12, cursor: 'pointer',
                      border: '1px solid var(--border-color)',
                      background: camPos.offsetX === p.offsetX && camPos.offsetY === p.offsetY
                        ? 'rgba(99,102,241,0.12)' : 'var(--bg-secondary)',
                      color: camPos.offsetX === p.offsetX && camPos.offsetY === p.offsetY
                        ? '#6366f1' : 'var(--text-secondary)',
                      fontWeight: camPos.offsetX === p.offsetX ? 600 : 400,
                      minHeight: 'unset',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => saveCamPos({ offsetX: 0, offsetY: 0 })}
              style={{
                width: '100%', padding: '8px 0', borderRadius: 10, border: '1px solid var(--border-color)',
                background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                minHeight: 'unset',
              }}
            >
              <RefreshCw size={12} /> Reset ke tengah
            </button>
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

              <button onClick={() => setConfirmLogout(true)}
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

              <button onClick={() => setConfirmReset(true)}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors"
                style={{ background: 'rgba(239,68,68,0.05)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                     style={{ background: 'rgba(239,68,68,0.1)' }}>
                  <Trash2 size={16} color="#ef4444" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm" style={{ color: '#ef4444' }}>Reset Semua Data</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Hapus seluruh data & mulai dari awal</div>
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
          {saved ? '✓ Tersimpan!' : 'Simpan Pengaturan'}
        </button>
      )}

      {/* Confirm Reset Modal */}
      {confirmReset && (
        <div className="modal-overlay" onClick={() => setConfirmReset(false)}>
          <div className="modal-content p-6" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                   style={{ background: 'rgba(239,68,68,0.1)' }}>
                <Trash2 size={30} color="#ef4444" />
              </div>
              <h3 className="text-xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>Reset Semua Data?</h3>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                Seluruh data kamu (log makanan, berat badan, pengeluaran, favorit) akan dihapus secara permanen.
                Kamu akan diarahkan ke halaman setup ulang. <strong>Tindakan ini tidak bisa dibatalkan.</strong>
              </p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setConfirmReset(false)} className="btn-secondary flex-1">Batal</button>
                <button onClick={handleResetData}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white"
                  style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}>
                  Ya, Reset Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Logout Modal */}
      {confirmLogout && (
        <div className="modal-overlay" onClick={() => setConfirmLogout(false)}>
          <div className="modal-content p-6" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                   style={{ background: 'rgba(239,68,68,0.1)' }}>
                <LogOut size={30} color="#ef4444" />
              </div>
              <h3 className="text-xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>Keluar dari BulkMate?</h3>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                Sesi kamu akan dihapus. Data lokal tidak hilang, tapi kamu perlu setup ulang untuk melanjutkan.
              </p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setConfirmLogout(false)} className="btn-secondary flex-1">Batal</button>
                <button onClick={handleLogout}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white"
                  style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}>
                  Keluar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
