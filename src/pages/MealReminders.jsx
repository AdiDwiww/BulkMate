import { useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  Bell, Plus, Trash2, Edit3, X, Check, Volume2, VolumeX,
  Sunrise, Sun, Moon, Cookie, Play, Smartphone, Info,
  Clock, AlarmClock, Repeat, AlarmCheck
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
  { key: 'bell',  label: 'Bell',   icon: Bell },
  { key: 'chime', label: 'Chime',  icon: AlarmClock },
  { key: 'beep',  label: 'Beep',   icon: AlarmCheck },
  { key: 'none',  label: 'Silent', icon: VolumeX },
]
const DAYS_PRESETS = [
  { key: 'daily',    label: 'Setiap Hari' },
  { key: 'weekdays', label: 'Sen – Jum' },
  { key: 'weekends', label: 'Sab – Min' },
  { key: 'custom',   label: 'Custom' },
]

const DEFAULT_FORM = {
  label: 'Makan Siang', time: '12:00', mealType: 'lunch',
  daysPreset: 'daily', days: 'daily', customDays: [],
  sound: 'bell', repeatCount: 3,
  snoozeEnabled: true, snoozeMinutes: 5, enabled: true,
}

/* ── Toggle Switch ── */
function Toggle({ value, onChange, color = '#22c55e', size = 'md' }) {
  const w = size === 'sm' ? 36 : 44
  const h = size === 'sm' ? 22 : 26
  const d = size === 'sm' ? 16 : 20
  const off = size === 'sm' ? 3 : 3
  const on  = w - d - off
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        width: w, height: h, borderRadius: h / 2,
        border: 'none', cursor: 'pointer', flexShrink: 0,
        background: value ? color : 'var(--border-color)',
        position: 'relative', transition: 'background 0.25s ease',
        display: 'inline-flex', alignItems: 'center',
      }}
    >
      <span style={{
        width: d, height: d, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
        left: value ? on : off,
        transition: 'left 0.25s ease',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        display: 'block',
      }} />
    </button>
  )
}

/* ── Section label ── */
function SLabel({ children }) {
  return (
    <span style={{
      display: 'block', fontSize: 11, fontWeight: 700,
      color: 'var(--text-muted)', textTransform: 'uppercase',
      letterSpacing: '0.07em', marginBottom: 8,
    }}>{children}</span>
  )
}

/* ── Add / Edit Modal ── */
function AlarmModal({ alarm, onSave, onClose }) {
  const [form, setForm] = useState(alarm ? { ...alarm, daysPreset: typeof alarm.days === 'string' ? alarm.days : 'custom', customDays: Array.isArray(alarm.days) ? alarm.days : [] } : DEFAULT_FORM)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handlePreset = p => {
    set('daysPreset', p)
    if (p !== 'custom') set('days', p)
  }
  const toggleDay = d => {
    const arr = Array.isArray(form.customDays) ? form.customDays : []
    const next = arr.includes(d) ? arr.filter(x => x !== d) : [...arr, d]
    set('customDays', next)
    set('days', next)
  }
  const save = () => {
    if (!form.label.trim() || !form.time) return
    onSave({
      ...form,
      days: form.daysPreset === 'custom'
        ? (form.customDays?.length ? form.customDays : 'daily')
        : form.daysPreset,
      id: form.id || Date.now().toString(),
    })
    onClose()
  }

  const meta = MEAL_TYPES.find(m => m.key === form.mealType) || MEAL_TYPES[1]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: `${meta.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlarmClock size={16} style={{ color: meta.color }} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
              {alarm?.id ? 'Edit Alarm' : 'Alarm Baru'}
            </span>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer' }}>
            <X size={15} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 22, overflowY: 'auto', maxHeight: '70vh' }}>

          {/* Time — large display */}
          <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
            <SLabel>Waktu Alarm</SLabel>
            <input
              type="time"
              className="input-field"
              value={form.time}
              onChange={e => set('time', e.target.value)}
              style={{ fontSize: 36, fontWeight: 900, textAlign: 'center', padding: '10px 16px', letterSpacing: 3, border: `2px solid ${meta.color}50` }}
            />
          </div>

          {/* Label */}
          <div>
            <SLabel>Nama Pengingat</SLabel>
            <input
              type="text"
              className="input-field"
              placeholder="Contoh: Sarapan, Makan Siang..."
              value={form.label}
              onChange={e => set('label', e.target.value)}
            />
          </div>

          {/* Meal type */}
          <div>
            <SLabel>Jenis Makan</SLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {MEAL_TYPES.map(({ key, label, icon: Icon, color }) => {
                const active = form.mealType === key
                return (
                  <button key={key} onClick={() => set('mealType', key)} style={{
                    padding: '12px 4px', borderRadius: 12, cursor: 'pointer',
                    border: `1.5px solid ${active ? color : 'var(--border-color)'}`,
                    background: active ? `${color}15` : 'var(--bg-secondary)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    transition: 'all 0.15s',
                  }}>
                    <Icon size={20} style={{ color: active ? color : 'var(--text-muted)' }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: active ? color : 'var(--text-muted)', lineHeight: 1, textAlign: 'center' }}>{label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Days */}
          <div>
            <SLabel>Hari Aktif</SLabel>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {DAYS_PRESETS.map(({ key, label }) => {
                const active = form.daysPreset === key
                return (
                  <button key={key} onClick={() => handlePreset(key)} style={{
                    padding: '7px 14px', borderRadius: 20, cursor: 'pointer',
                    border: `1.5px solid ${active ? '#22c55e' : 'var(--border-color)'}`,
                    background: active ? 'rgba(34,197,94,0.1)' : 'var(--bg-secondary)',
                    color: active ? '#22c55e' : 'var(--text-secondary)',
                    fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                  }}>{label}</button>
                )
              })}
            </div>
            {form.daysPreset === 'custom' && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {ALL_DAYS.map(d => {
                  const active = (form.customDays || []).includes(d)
                  return (
                    <button key={d} onClick={() => toggleDay(d)} style={{
                      width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
                      border: `1.5px solid ${active ? '#22c55e' : 'var(--border-color)'}`,
                      background: active ? 'rgba(34,197,94,0.12)' : 'var(--bg-secondary)',
                      color: active ? '#22c55e' : 'var(--text-muted)',
                      fontSize: 11, fontWeight: 700, transition: 'all 0.15s',
                    }}>{DAY_LABELS[d]}</button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Sound */}
          <div>
            <SLabel>Suara Alarm</SLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {SOUNDS.map(({ key, label, icon: Icon }) => {
                const active = form.sound === key
                return (
                  <button key={key} onClick={() => set('sound', key)} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
                    border: `1.5px solid ${active ? '#22c55e' : 'var(--border-color)'}`,
                    background: active ? 'rgba(34,197,94,0.08)' : 'var(--bg-secondary)',
                    transition: 'all 0.15s',
                  }}>
                    <Icon size={16} style={{ color: active ? '#22c55e' : 'var(--text-muted)', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: active ? '#22c55e' : 'var(--text-secondary)', flex: 1, textAlign: 'left' }}>{label}</span>
                    {active && key !== 'none' && (
                      <button
                        type="button"
                        onMouseDown={e => { e.stopPropagation(); playAlarmSound(key, 1) }}
                        onClick={e => e.stopPropagation()}
                        style={{ background: 'rgba(34,197,94,0.15)', border: 'none', borderRadius: 6, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                      >
                        <Play size={10} style={{ color: '#22c55e' }} />
                      </button>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Repeat + Snooze */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Repeat count */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <SLabel>Berapa Kali Bunyi</SLabel>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#22c55e' }}>{form.repeatCount}x</span>
              </div>
              <input
                type="range" min={1} max={5} value={form.repeatCount}
                onChange={e => set('repeatCount', Number(e.target.value))}
                style={{ width: '100%', accentColor: '#22c55e' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                {[1,2,3,4,5].map(n => (
                  <span key={n} style={{ fontSize: 10, color: form.repeatCount === n ? '#22c55e' : 'var(--text-muted)', fontWeight: form.repeatCount === n ? 700 : 400 }}>{n}x</span>
                ))}
              </div>
            </div>

            {/* Snooze */}
            <div style={{ borderRadius: 12, padding: '12px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Snooze</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tunda alarm beberapa menit</div>
                </div>
                <Toggle value={form.snoozeEnabled} onChange={v => set('snoozeEnabled', v)} />
              </div>
              {form.snoozeEnabled && (
                <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
                  {[3, 5, 10, 15].map(m => (
                    <button key={m} onClick={() => set('snoozeMinutes', m)} style={{
                      flex: 1, padding: '7px 0', borderRadius: 10, cursor: 'pointer',
                      border: `1.5px solid ${form.snoozeMinutes === m ? '#22c55e' : 'var(--border-color)'}`,
                      background: form.snoozeMinutes === m ? 'rgba(34,197,94,0.1)' : 'transparent',
                      color: form.snoozeMinutes === m ? '#22c55e' : 'var(--text-secondary)',
                      fontSize: 12, fontWeight: 700,
                    }}>{m}m</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Save */}
          <button onClick={save} className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Check size={17} />
            Simpan Alarm
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Main Page ── */
export default function MealReminders() {
  const { state, dispatch } = useApp()
  const reminders = state.reminders || []
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [notifStatus, setNotifStatus] = useState(
    'Notification' in window ? Notification.permission : 'unsupported'
  )

  const requestPermission = async () => {
    await registerSW()
    const perm = await requestNotifPermission()
    setNotifStatus(perm)
  }

  const save = data => {
    const next = reminders.find(r => r.id === data.id)
      ? reminders.map(r => r.id === data.id ? data : r)
      : [...reminders, data]
    dispatch({ type: 'SET_REMINDERS', payload: next })
  }
  const remove = id => dispatch({ type: 'SET_REMINDERS', payload: reminders.filter(r => r.id !== id) })
  const toggle = id => dispatch({ type: 'SET_REMINDERS', payload: reminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r) })
  const openAdd  = () => { setEditing(null); setShowModal(true) }
  const openEdit = r  => { setEditing(r);    setShowModal(true) }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="mobile-page-header">
        <h1 className="section-title" style={{ fontSize: 20 }}>Pengingat Makan</h1>
        <p className="section-subtitle">Alarm otomatis waktu makan</p>
      </div>

      {/* Notif permission banner */}
      {notifStatus !== 'granted' && (
        <div style={{
          borderRadius: 14, padding: '14px 16px',
          display: 'flex', alignItems: 'flex-start', gap: 12,
          background: notifStatus === 'denied' ? 'rgba(239,68,68,0.07)' : 'rgba(249,115,22,0.07)',
          border: `1px solid ${notifStatus === 'denied' ? 'rgba(239,68,68,0.2)' : 'rgba(249,115,22,0.2)'}`,
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: notifStatus === 'denied' ? 'rgba(239,68,68,0.12)' : 'rgba(249,115,22,0.12)' }}>
            {notifStatus === 'unsupported' ? <Info size={18} style={{ color: '#94a3b8' }} /> : <Smartphone size={18} style={{ color: notifStatus === 'denied' ? '#ef4444' : '#f97316' }} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 3 }}>
              {notifStatus === 'unsupported' ? 'Notifikasi Tidak Didukung' : notifStatus === 'denied' ? 'Izin Notifikasi Ditolak' : 'Aktifkan Notifikasi'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: notifStatus === 'denied' || notifStatus === 'unsupported' ? 0 : 10, lineHeight: 1.5 }}>
              {notifStatus === 'unsupported' ? 'Browser ini tidak mendukung notifikasi. Alarm tetap bunyi saat app terbuka.' : notifStatus === 'denied' ? 'Aktifkan notifikasi secara manual di pengaturan browser / OS.' : 'Izinkan notifikasi agar alarm muncul di layar terkunci.'}
            </div>
            {notifStatus !== 'unsupported' && notifStatus !== 'denied' && (
              <button onClick={requestPermission} className="btn-primary" style={{ fontSize: 12, padding: '7px 16px' }}>
                Izinkan Notifikasi
              </button>
            )}
          </div>
        </div>
      )}

      {notifStatus === 'granted' && (
        <div style={{ borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <AlarmCheck size={15} style={{ color: '#22c55e', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>Notifikasi aktif — alarm muncul di layar terkunci</span>
        </div>
      )}

      {/* Empty state */}
      {reminders.length === 0 && (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Bell size={28} style={{ color: '#22c55e' }} />
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 6 }}>Belum Ada Alarm</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Buat pengingat agar tidak melewatkan waktu makan</div>
          <button onClick={openAdd} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> Tambah Alarm Pertama
          </button>
        </div>
      )}

      {/* Alarm list */}
      {reminders.length > 0 && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...reminders].sort((a, b) => a.time.localeCompare(b.time)).map(r => {
              const meta = MEAL_TYPES.find(m => m.key === r.mealType) || MEAL_TYPES[1]
              const Icon = meta.icon
              return (
                <div key={r.id} className="card" style={{ padding: '14px 16px', opacity: r.enabled ? 1 : 0.5, transition: 'opacity 0.2s', borderLeft: `3px solid ${r.enabled ? meta.color : 'var(--border-color)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Meal icon */}
                    <div style={{ width: 46, height: 46, borderRadius: 14, flexShrink: 0, background: r.enabled ? `${meta.color}18` : 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={22} style={{ color: r.enabled ? meta.color : 'var(--text-muted)' }} />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontWeight: 900, fontSize: 24, color: 'var(--text-primary)', letterSpacing: -0.5, lineHeight: 1 }}>{r.time}</span>
                        <span style={{ fontWeight: 700, fontSize: 13, color: r.enabled ? meta.color : 'var(--text-muted)' }}>{r.label}</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 10px', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDays(r.days)}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          {r.sound === 'none' ? <VolumeX size={10} /> : <Volume2 size={10} />}
                          {r.sound === 'none' ? 'Silent' : `${r.repeatCount}x ${r.sound}`}
                        </span>
                        {r.snoozeEnabled && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Snooze {r.snoozeMinutes}m</span>}
                      </div>
                    </div>

                    {/* Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => openEdit(r)} style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', border: 'none', cursor: 'pointer' }}>
                        <Edit3 size={14} style={{ color: 'var(--text-muted)' }} />
                      </button>
                      <button onClick={() => remove(r.id)} style={{ width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.08)', border: 'none', cursor: 'pointer' }}>
                        <Trash2 size={14} style={{ color: '#ef4444' }} />
                      </button>
                      <Toggle value={r.enabled} onChange={() => toggle(r.id)} color={meta.color} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <button onClick={openAdd} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px' }}>
            <Plus size={18} /> Tambah Alarm Baru
          </button>
        </>
      )}

      {/* Info card */}
      <div style={{ borderRadius: 12, padding: '12px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', gap: 10 }}>
        <Info size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Alarm bunyi saat app terbuka. Di Android, izinkan notifikasi untuk alarm di background. Di iOS, tambahkan ke Home Screen terlebih dahulu.
        </span>
      </div>

      {showModal && <AlarmModal alarm={editing} onSave={save} onClose={() => setShowModal(false)} />}
    </div>
  )
}
