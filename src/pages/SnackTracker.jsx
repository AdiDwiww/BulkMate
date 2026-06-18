import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { POPULAR_SNACKS } from '../utils/helpers'
import { ShoppingBag, Plus, Trash2, Coffee, Zap, X } from 'lucide-react'

export default function SnackTracker() {
  const { state, dispatch } = useApp()
  const { dailyLogs, currentDate, nutritionTarget, profile } = state

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '', calories: 0, protein: 0, carbs: 0, fat: 0
  })
  const [addedSnack, setAddedSnack] = useState(null)

  const target = nutritionTarget || profile || {}
  const calorieTarget = target.daily_calorie_target || 2800
  const snackLogs = dailyLogs.filter(l => l.date === currentDate && l.meal_type === 'snack')
  const allLogs = dailyLogs.filter(l => l.date === currentDate)
  const totalCals = allLogs.reduce((s, l) => s + (l.calories || 0), 0)
  const snackCals = snackLogs.reduce((s, l) => s + (l.calories || 0), 0)

  const handleQuickAdd = (snack) => {
    dispatch({
      type: 'ADD_FOOD_LOG',
      payload: {
        ...snack,
        meal_type: 'snack',
        is_snack: true,
        grams: snack.grams || 0,
        date: currentDate,
      }
    })
    setAddedSnack(snack.name)
    setTimeout(() => setAddedSnack(null), 2000)
  }

  const handleCustomAdd = () => {
    if (!form.name) return
    dispatch({
      type: 'ADD_FOOD_LOG',
      payload: {
        ...form,
        meal_type: 'snack',
        is_snack: true,
        grams: 0,
        date: currentDate,
      }
    })
    setForm({ name: '', calories: 0, protein: 0, carbs: 0, fat: 0 })
    setShowForm(false)
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center justify-between">
        <div className="mobile-page-header">
          <h1 className="section-title text-xl">Tracker Jajan</h1>
          <p className="section-subtitle">Catat makanan & minuman tambahan</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 px-3 py-2">
          <Plus size={16} />
          <span className="hidden sm:inline">Custom</span>
        </button>
      </div>

      {/* Summary */}
      <div className="rounded-2xl p-5 text-white"
           style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', boxShadow: '0 8px 24px rgba(249,115,22,0.3)' }}>
        <div className="flex items-center gap-2 mb-3">
          <ShoppingBag size={18} />
          <span className="font-semibold">Kalori dari Jajan</span>
        </div>
        <div className="flex items-end gap-4">
          <div>
            <div className="text-4xl font-black">{Math.round(snackCals)}</div>
            <div className="text-orange-200 text-sm">kcal jajan hari ini</div>
          </div>
          <div className="text-orange-200 text-sm">
            <div>{Math.round((snackCals / calorieTarget) * 100)}% dari target</div>
            <div>dari {calorieTarget} total target</div>
          </div>
        </div>
      </div>

      {/* Custom add form */}
      {showForm && (
        <div className="card p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Tambah Jajan</h3>
            <button onClick={() => setShowForm(false)}>
              <X size={18} style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="label">Nama Jajan</label>
              <input type="text" className="input-field" placeholder="Contoh: Es Teh Manis"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'calories', label: 'Kalori (kcal)' },
                { key: 'protein', label: 'Protein (g)' },
                { key: 'carbs', label: 'Karbo (g)' },
                { key: 'fat', label: 'Lemak (g)' },
              ].map(f => (
                <div key={f.key}>
                  <label className="label">{f.label}</label>
                  <input type="number" className="input-field" min={0} step={0.1}
                    value={form[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: Number(e.target.value) }))} />
                </div>
              ))}
            </div>
            <button onClick={handleCustomAdd} disabled={!form.name} className="btn-primary w-full"
              style={{ opacity: !form.name ? 0.5 : 1 }}>
              Tambah Jajan
            </button>
          </div>
        </div>
      )}

      {/* Popular Snacks */}
      <div>
        <h2 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><Coffee size={16} color="#f97316" /> Jajan Populer Indonesia</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {POPULAR_SNACKS.map((snack, i) => (
            <div key={snack.name} className="card p-4 flex items-center justify-between animate-slide-up"
                 style={{ animationDelay: `${i * 40}ms` }}>
              <div>
                <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{snack.name}</div>
                <div className="text-xs mt-0.5 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                  <span className="text-orange-500 font-bold">{snack.calories} kcal</span>
                  <span>P:{snack.protein}g</span>
                  <span>K:{snack.carbs}g</span>
                </div>
              </div>
              <button
                onClick={() => handleQuickAdd(snack)}
                className="px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1 transition-all"
                style={{
                  background: addedSnack === snack.name ? 'rgba(34,197,94,0.15)' : 'rgba(249,115,22,0.1)',
                  color: addedSnack === snack.name ? '#22c55e' : '#f97316',
                  border: `1px solid ${addedSnack === snack.name ? '#22c55e' : 'rgba(249,115,22,0.2)'}`,
                }}>
                {addedSnack === snack.name ? '✓' : <Plus size={14} />}
                {addedSnack === snack.name ? ' Added' : ' Add'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Today's snack log */}
      {snackLogs.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Log Jajan Hari Ini</h3>
          <div className="space-y-2">
            {snackLogs.map(log => (
              <div key={log.id} className="flex items-center justify-between py-2 px-3 rounded-xl"
                   style={{ background: 'var(--bg-secondary)' }}>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{log.name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    P:{Math.round(log.protein)}g · K:{Math.round(log.carbs)}g · L:{Math.round(log.fat)}g
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-orange-500">{Math.round(log.calories)} kcal</span>
                  <button onClick={() => dispatch({ type: 'DELETE_FOOD_LOG', payload: log.id })}
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
