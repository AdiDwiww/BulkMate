import { useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  Bell, BellOff, Plus, Trash2, Edit3, X, Check, Volume2, VolumeX,
  Sunrise, Sun, Moon, Cookie, Play, Smartphone, Info
} from 'lucide-react'
import {
  formatDays, ALL_DAYS, DAY_LABELS,
  playAlarmSound, requestNotifPermission, registerSW
} from '../utils/alarmEngine'

const MEAL_TYPES = [
  { key: 'breakfast', label: 'Sarapan',     icon: Sunrise, color: '#f97316' },
  { key: 'lunch',     label: 'Makan Siang', icon: Sun,     color: '#22c55e' },
  { key: 'dinner',    label: 'Makan Malam', icon: Moon,    color: '#6366f1' },
  { key: 'snack',     label: 'Snack',       icon: Cookie,  color: '#a855f7' },
]
const SOUNDS = [
  { key: 'bell',  label: 'Bell' },
  { key: 'chime', label: 'Chime' },
  { key: 'beep',  label: 'Beep' },
  { key: 'none',  label: 'Silent' },
]
const DAYS_PRESETS = [
  { key: 'daily',    label: 'Setiap Hari' },
  { key: 'weekdays', label: 'Senin–Jumat' },
  { key: 'weekends', label: 'Sabtu–Minggu' },
  { key: 'custom',   label: 'Custom' },
]

const DEFAULT_FORM = {
  label: 'Makan Siang', time: '12:00', mealType: 'lunch',
  daysPreset: 'daily', days: 'daily', customDays: [],
  sound: 'bell', repeatCount: 3,
  snoozeEnabled: true, snoozeMinutes: 5, enabled: true,
}

function Toggle({ value, onChange, color = '#22c55e' }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
      background: value ? color : 'var(--border-color)',
      position: 'relative', transition: 'background 0.25s', flexShrink: 0,
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 3,
        left: value ? 21 : 3,
        transition: 'left 0.25s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
      }} />
    </button>
  )
}

function AlarmModal({ alarm, onSave, onClose }) {
  const [form, setForm] = useState(alarm || DEFAULT_FORM)

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleDaysPreset = (p) => {
    setF('daysPreset', p)
    if (p !== 'custom') setF('days', p)
  }
  const toggleCustomDay = (d) => {
    const arr = Array.isArray(form.customDays) ? form.customDays : []
    const next = arr.includes(d) ? arr.filter(x => x !== d) : [...arr, d]
    setF('customDays', next)
    setF('days', next)
  }

  const save = () => {
    if (!form.label.trim() || !form.time) return
    onSave({
      ...form,
      days: form.daysPreset === 'custom' ? (form.customDays.length ? form.customDays : 'daily') : form.daysPreset,
      id: form.id || Date.now().toString(),
    })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div style={{ padding: '18px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)' }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
            {alarm?.id ? 'Edit Alarm' : 'Tambah Alarm'}
          </span>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer' }}>
            <X size={16} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Time picker — big */}
          <div style={{ textAlign: 'center' }}>
            <label className="label">Waktu Alarm</label>
            <input type="time" className="input-field" value={form.time}
              onChange={e => setF('time', e.target.value)}
              style={{ fontSize: 32, fontWeight: 900, textAlign: 'center', padding: '12px', letterSpacing: 2 }}
            />
          </div>

          {/* Label */}
          <div>
            <label className="label">Nama Pengingat</label>
            <input type="text" className="input-field" placeholder="Contoh: Sarapan, Makan Siang..."
              value={form.label} onChange={e => setF('label', e.target.value)} />
          </div>

          {/* Meal type */}
          <div>
            <label className="label">Jenis Makan</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {MEAL_TYPES.map(({ key, label, icon: Icon, color }) => (
                <button key={key} onClick={() => setF('mealType', key)} style={{
                  padding: '10px 4px', borderRadius: 12, border: `1.5px solid ${form.mealType === key ? color : 'var(--border-color)'}`,
                  background: form.mealType === key ? `${color}15` : 'var(--bg-secondary)',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                }}>
                  <Icon size={18} style={{ color: form.mealType === key ? color : 'var(--text-muted)' }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: form.mealType === key ? color : 'var(--text-muted)' }}>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Days */}
          <div>
            <label className="label">Hari</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {DAYS_PRESETS.map(({ key, label }) => (
                <button key={key} onClick={() => handleDaysPreset(key)} style={{
                  padding: '6px 12px', borderRadius: 20, border: `1.5px solid ${form.daysPreset === key ? '#22c55e' : 'var(--border-color)'}`,
                  background: form.daysPreset === key ? 'rgba(34,197,94,0.1)' : 'var(--bg-secondary)',
                  color: form.daysPreset === key ? '#22c55e' : 'var(--text-secondary)',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>{label}</button>
              ))}
            </div>
            {form.daysPreset === 'custom' && (
              <div style={{ display: 'flex', gap: 6 }}>
                {ALL_DAYS.map(d => (
                  <button key={d} onClick={() => toggleCustomDay(d)} style={{
                    width: 34, height: 34, borderRadius: '50%', border: `1.5px solid ${(form.customDays || []).includes(d) ? '#22c55e' : 'var(--border-color)'}`,
                    background: (form.customDays || []).includes(d) ? 'rgba(34,197,94,0.1)' : 'var(--bg-secondary)',
                    color: (form.customDays || []).includes(d) ? '#22c55e' : 'var(--text-muted)',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  }}>{DAY_LABELS[d]}</button>
                ))}
              </div>
            )}
          </div>

          {/* Sound + repeat */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="label">Suara</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {SOUNDS.map(({ key, label }) => (
                  <button key={key} onClick={() => setF('sound', key)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', borderRadius: 10,
                    border: `1.5px solid ${form.sound === key ? '#22c55e' : 'var(--border-color)'}`,
                    background: form.sound === key ? 'rgba(34,197,94,0.08)' : 'var(--bg-secondary)',
                    cursor: 'pointer',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: form.sound === key ? '#22c55e' : 'var(--text-secondary)' }}>{label}</span>
                    {form.sound === key && <button onMouseDown={e => { e.stopPropagation(); playAlarmSound(key, 1) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <Play size={12} style={{ color: '#22c55e' }} />
                    </button>}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="label">Bunyi Berulang</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="range" min={1} max={5} value={form.repeatCount}
                    onChange={e => setF('repeatCount', Number(e.target.value))}
                    style={{ flex: 1, accentColor: '#22c55e' }} />
                  <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)', minWidth: 20 }}>{form.repeatCount}×</span>
                </div>
              </div>
              <div>
                <label className="label">Snooze</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Toggle value={form.snoozeEnabled} onChange={v => setF('snoozeEnabled', v)} />
                  {form.snoozeEnabled && (
                    <select className="input-field" value={form.snoozeMinutes} onChange={e => setF('snoozeMinutes', Number(e.target.value))} style={{ flex: 1, padding: '6px 8px', fontSize: 13 }}>
                      {[3,5,10,15].map(m => <option key={m} value={m}>{m} menit</option>)}
                    </select>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button onClick={save} className="btn-primary" style={{ width: '100%', padding: '13px', fontSize: 15 }}>
            <Check size={16} style={{ display: 'inline', marginRight: 6 }} />
            Simpan Alarm
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MealReminders() {
  const { state, dispatch } = useApp()
  const reminders = state.reminders || []
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [notifStatus, setNotifStatus] = useState(
    'Notification' in window ? Notification.permission : 'unsupported'
  )

  const handleRequestPermission = async () => {
    await registerSW()
    const perm = await requestNotifPermission()
    setNotifStatus(perm)
  }

  const saveReminder = (data) => {
    const exists = reminders.find(r => r.id === data.id)
    const next = exists
      ? reminders.map(r => r.id === data.id ? data : r)
      : [...reminders, data]
    dispatch({ type: 'SET_REMINDERS', payload: next })
  }

  const deleteReminder = (id) => {
    dispatch({ type: 'SET_REMINDERS', payload: reminders.filter(r => r.id !== id) })
  }

  const toggleEnabled = (id) => {
    dispatch({ type: 'SET_REMINDERS', payload: reminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r) })
  }

  const openAdd = () => { setEditing(null); setShowModal(true) }
  const openEdit = (r) => { setEditing(r); setShowModal(true) }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="mobile-page-header">
        <h1 className="section-title" style={{ fontSize: 20 }}>Pengingat Makan</h1>
        <p className="section-subtitle">Alarm otomatis di waktu makan</p>
      </div>

      {/* Notification permission banner */}
      {notifStatus !== 'granted' && (
        <div style={{
          borderRadius: 16, padding: 16, display: 'flex', alignItems: 'flex-start', gap: 12,
          background: notifStatus === 'unsupported' ? 'rgba(148,163,184,0.08)' : 'rgba(249,115,22,0.08)',
          border: `1px solid ${notifStatus === 'unsupported' ? 'rgba(148,163,184,0.2)' : 'rgba(249,115,22,0.2)'}`,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: notifStatus === 'unsupported' ? '#94a3b820' : 'rgba(249,115,22,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {notifStatus === 'unsupported' ? <Info size={18} style={{ color: '#94a3b8' }} /> : <Smartphone size={18} style={{ color: '#f97316' }} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>
              {notifStatus === 'unsupported' ? 'Browser Tidak Mendukung Notifikasi' : 'Izinkan Notifikasi'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
              {notifStatus === 'unsupported'
                ? 'Alarm tetap bunyi saat app terbuka.'
                : 'Agar alarm muncul di layar terkunci & saat app tertutup.'}
            </div>
            {notifStatus !== 'unsupported' && notifStatus !== 'denied' && (
              <button onClick={handleRequestPermission} className="btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}>
                Aktifkan Notifikasi
              </button>
            )}
            {notifStatus === 'denied' && (
              <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>Izin ditolak — aktifkan manual di pengaturan browser.</span>
            )}
          </div>
        </div>
      )}

      {notifStatus === 'granted' && (
        <div style={{
          borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
        }}>
          <Check size={14} style={{ color: '#22c55e', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>
            Notifikasi aktif — alarm akan muncul di layar terkunci
          </span>
        </div>
      )}

      {/* Alarm list */}
      {reminders.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Bell size={28} style={{ color: '#22c55e' }} />
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 6 }}>Belum Ada Alarm</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Tambah pengingat makan agar tidak lupa asupan kalori</div>
          <button onClick={openAdd} className="btn-primary" style={{ margin: '0 auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> Tambah Alarm Pertama
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reminders
            .slice().sort((a, b) => a.time.localeCompare(b.time))
            .map(r => {
              const meta = MEAL_TYPES.find(m => m.key === r.mealType) || MEAL_TYPES[1]
              const Icon = meta.icon
              return (
                <div key={r.id} className="card" style={{
                  padding: '16px',
                  opacity: r.enabled ? 1 : 0.55,
                  borderLeft: `3px solid ${r.enabled ? meta.color : 'var(--border-color)'}`,
                  transition: 'all 0.2s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Icon */}
                    <div style={{
                      width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                      background: r.enabled ? `${meta.color}15` : 'var(--bg-secondary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={22} style={{ color: r.enabled ? meta.color : 'var(--text-muted)' }} />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontWeight: 900, fontSize: 22, color: 'var(--text-primary)', letterSpacing: -0.5 }}>{r.time}</span>
                        <span style={{ fontWeight: 700, fontSize: 13, color: r.enabled ? meta.color : 'var(--text-muted)' }}>{r.label}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        <span>{formatDays(r.days)}</span>
                        <span>·</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          {r.sound === 'none' ? <VolumeX size={10} /> : <Volume2 size={10} />}
                          {r.sound === 'none' ? 'Silent' : `${r.repeatCount}× ${r.sound}`}
                        </span>
                        {r.snoozeEnabled && <><span>·</span><span>Snooze {r.snoozeMinutes}m</span></>}
                      </div>
                    </div>

                    {/* Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <button onClick={() => openEdit(r)} style={{
                        width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer',
                      }}>
                        <Edit3 size={14} style={{ color: 'var(--text-muted)' }} />
                      </button>
                      <button onClick={() => deleteReminder(r.id)} style={{
                        width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(239,68,68,0.08)', border: 'none', cursor: 'pointer',
                      }}>
                        <Trash2 size={14} style={{ color: '#ef4444' }} />
                      </button>
                      <Toggle value={r.enabled} onChange={() => toggleEnabled(r.id)} color={meta.color} />
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {/* Add button */}
      {reminders.length > 0 && (
        <button onClick={openAdd} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px' }}>
          <Plus size={18} /> Tambah Alarm Baru
        </button>
      )}

      {/* Quick tip */}
      <div style={{ borderRadius: 14, padding: 14, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          <b style={{ color: 'var(--text-secondary)' }}>💡 Tips:</b> Alarm bunyi saat app terbuka + notifikasi native di background. Di iOS, tambahkan BulkMate ke Home Screen agar notifikasi lock screen aktif.
        </div>
      </div>

      {showModal && (
        <AlarmModal
          alarm={editing}
          onSave={saveReminder}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
