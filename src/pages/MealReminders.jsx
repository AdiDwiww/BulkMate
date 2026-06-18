import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Bell, Plus, Trash2, X, Clock, Check, Sunrise, Sun, Moon, Cookie, Milk, Apple, UtensilsCrossed, Banana, AlertTriangle } from 'lucide-react'

const REMINDER_ICONS = {
  Sunrise, Sun, Moon, Cookie, Milk, Apple, Bell, Banana, UtensilsCrossed
}

const MEAL_REMINDERS_DEFAULT = [
  { label: 'Sarapan', time: '07:00', iconName: 'Sunrise', enabled: true },
  { label: 'Snack Pagi', time: '10:00', iconName: 'Banana', enabled: true },
  { label: 'Makan Siang', time: '12:30', iconName: 'Sun', enabled: true },
  { label: 'Snack Sore', time: '15:30', iconName: 'Cookie', enabled: false },
  { label: 'Makan Malam', time: '19:00', iconName: 'Moon', enabled: true },
  { label: 'Sebelum Tidur', time: '21:30', iconName: 'Milk', enabled: false },
]

export default function MealReminders() {
  const { state, dispatch } = useApp()
  const { reminders } = state

  // Use default if empty
  const allReminders = reminders.length > 0 ? reminders : MEAL_REMINDERS_DEFAULT.map((r, i) => ({ ...r, id: `default-${i}` }))

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ label: '', time: '08:00', iconName: 'UtensilsCrossed', enabled: true })
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  )

  const handleToggle = (id) => {
    const updated = allReminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)
    dispatch({ type: 'SET_REMINDERS', payload: updated })
  }

  const handleAdd = () => {
    if (!form.label) return
    dispatch({ type: 'ADD_REMINDER', payload: form })
    setForm({ label: '', time: '08:00', iconName: 'UtensilsCrossed', enabled: true })
    setShowModal(false)
  }

  const handleDelete = (id) => {
    if (id.startsWith('default')) {
      // Save defaults first then remove
      const updated = allReminders.filter(r => r.id !== id)
      dispatch({ type: 'SET_REMINDERS', payload: updated })
    } else {
      dispatch({ type: 'DELETE_REMINDER', payload: id })
    }
  }

  const requestNotifPermission = async () => {
    if (typeof Notification !== 'undefined') {
      const perm = await Notification.requestPermission()
      setNotifPermission(perm)
    }
  }

  const testNotif = (reminder) => {
    if (notifPermission === 'granted') {
      new Notification(`BulkMate: ${reminder.label}`, {
        body: 'Waktunya makan! Jangan sampai melewatkan makan.',
        icon: '/icon-192.png',
      })
    }
  }

  const enabledCount = allReminders.filter(r => r.enabled).length

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center justify-between">
        <div className="mobile-page-header">
          <h1 className="section-title text-xl">Pengingat Makan</h1>
          <p className="section-subtitle">Atur jadwal makan agar tidak terlewat</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 px-3 py-2">
          <Plus size={16} />
          <span className="hidden sm:inline">Tambah</span>
        </button>
      </div>

      {/* Notification permission banner */}
      {notifPermission === 'default' && (
        <div className="rounded-2xl p-4 flex items-center justify-between"
             style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)' }}><Bell size={18} color="#3b82f6" /></div>
            <div>
              <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Aktifkan Notifikasi</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Dapatkan pengingat makan tepat waktu</div>
            </div>
          </div>
          <button onClick={requestNotifPermission} className="btn-blue text-xs px-3 py-2">
            Izinkan
          </button>
        </div>
      )}

      {notifPermission === 'denied' && (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <div className="text-sm flex items-center gap-1.5" style={{ color: '#ef4444' }}>
            <AlertTriangle size={14} /> Notifikasi diblokir. Aktifkan melalui pengaturan browser.
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-green flex items-center justify-center"
               style={{ boxShadow: '0 4px 12px rgba(34,197,94,0.35)' }}>
            <Bell size={22} color="white" />
          </div>
          <div>
            <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
              {enabledCount} dari {allReminders.length} aktif
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Pengingat makan harian</div>
          </div>
        </div>
        {notifPermission === 'granted' && (
          <div className="badge badge-green">
            <Check size={11} />
            Notif Aktif
          </div>
        )}
      </div>

      {/* Reminders List */}
      <div className="space-y-3">
        {allReminders
          .sort((a, b) => a.time.localeCompare(b.time))
          .map((reminder, i) => (
          <div key={reminder.id} className="card p-4 flex items-center gap-4 animate-slide-up"
               style={{ animationDelay: `${i * 50}ms` }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                 style={{ background: reminder.enabled ? 'rgba(34,197,94,0.1)' : 'var(--bg-secondary)' }}>
              {(() => { const IC = REMINDER_ICONS[reminder.iconName] || REMINDER_ICONS[reminder.emoji] || Bell; return <IC size={20} color={reminder.enabled ? '#22c55e' : 'var(--text-muted)'} /> })()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold" style={{ color: reminder.enabled ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {reminder.label}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                <span className="text-sm font-bold" style={{ color: reminder.enabled ? '#22c55e' : 'var(--text-muted)' }}>
                  {reminder.time}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {notifPermission === 'granted' && reminder.enabled && (
                <button onClick={() => testNotif(reminder)}
                  className="text-xs px-2 py-1 rounded-lg border font-medium"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                  Test
                </button>
              )}
              {/* Toggle */}
              <button
                onClick={() => handleToggle(reminder.id)}
                className="relative w-12 h-6 rounded-full transition-all duration-300"
                style={{ background: reminder.enabled ? '#22c55e' : 'var(--border-color)' }}>
                <span
                  className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300"
                  style={{ left: reminder.enabled ? '26px' : '2px' }}
                />
              </button>
              <button onClick={() => handleDelete(reminder.id)}
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
              <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Tambah Pengingat</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'var(--bg-secondary)' }}>
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">Nama Pengingat</label>
                <input type="text" className="input-field" placeholder="Contoh: Sarapan Pagi"
                  value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} autoFocus />
              </div>
              <div>
                <label className="label">Jam</label>
                <input type="time" className="input-field" value={form.time}
                  onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
              </div>
              <div>
                <label className="label">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(REMINDER_ICONS).map(([name, IC]) => (
                    <button key={name} onClick={() => setForm(f => ({ ...f, iconName: name }))}
                      className="w-10 h-10 rounded-xl transition-all flex items-center justify-center"
                      style={{
                        background: form.iconName === name ? 'rgba(34,197,94,0.15)' : 'var(--bg-secondary)',
                        border: `1px solid ${form.iconName === name ? '#22c55e' : 'var(--border-color)'}`,
                      }}>
                      <IC size={18} color={form.iconName === name ? '#22c55e' : 'var(--text-muted)'} />
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleAdd} disabled={!form.label} className="btn-primary w-full"
                style={{ opacity: !form.label ? 0.5 : 1 }}>
                Simpan Pengingat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
