import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { FOOD_DATABASE, MEAL_TYPES, calculateTotals, formatDate } from '../utils/helpers'
import { Plus, Trash2, Search, X, Edit3, Clock, Flame } from 'lucide-react'

function AddFoodModal({ onClose, onAdd, date, mealType }) {
  const [mode, setMode] = useState('search') // 'search' | 'manual'
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFood, setSelectedFood] = useState(null)
  const [grams, setGrams] = useState(100)
  const [manualForm, setManualForm] = useState({
    name: '', grams: 100, calories: 0, protein: 0, carbs: 0, fat: 0
  })

  const filteredFoods = FOOD_DATABASE.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const calcNutrition = (food, g) => ({
    calories: (food.per100g.calories * g / 100),
    protein: (food.per100g.protein * g / 100),
    carbs: (food.per100g.carbs * g / 100),
    fat: (food.per100g.fat * g / 100),
  })

  const handleAddFromDB = () => {
    if (!selectedFood) return
    const nutrition = calcNutrition(selectedFood, grams)
    onAdd({
      name: selectedFood.name,
      grams,
      meal_type: mealType,
      date,
      ...nutrition
    })
    onClose()
  }

  const handleAddManual = () => {
    onAdd({
      ...manualForm,
      meal_type: mealType,
      date,
    })
    onClose()
  }

  const nutrition = selectedFood ? calcNutrition(selectedFood, grams) : null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Tambah Makanan</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--bg-secondary)' }}>
            <X size={16} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Mode tabs */}
          <div className="tab-nav">
            <button className={`tab-btn ${mode === 'search' ? 'active' : ''}`} onClick={() => setMode('search')}>
              🔍 Cari Database
            </button>
            <button className={`tab-btn ${mode === 'manual' ? 'active' : ''}`} onClick={() => setMode('manual')}>
              ✏️ Input Manual
            </button>
          </div>

          {mode === 'search' ? (
            <>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Cari makanan... (contoh: nasi, ayam)"
                  className="input-field pl-9"
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setSelectedFood(null) }}
                  autoFocus
                />
              </div>

              {!selectedFood && (
                <div className="max-h-48 overflow-y-auto scrollbar-thin space-y-1">
                  {filteredFoods.slice(0, 20).map(food => (
                    <button
                      key={food.name}
                      onClick={() => { setSelectedFood(food); setSearchQuery(food.name) }}
                      className="w-full text-left px-3 py-2.5 rounded-xl transition-colors"
                      style={{ background: 'var(--bg-secondary)' }}
                      onMouseEnter={e => e.target.style.background = 'var(--bg-card-hover)'}
                      onMouseLeave={e => e.target.style.background = 'var(--bg-secondary)'}
                    >
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{food.name}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        per 100g: {food.per100g.calories} kcal | P:{food.per100g.protein}g | K:{food.per100g.carbs}g | L:{food.per100g.fat}g
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedFood && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="label text-xs mb-0 flex-shrink-0">Porsi (gram)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={grams}
                      onChange={e => setGrams(Number(e.target.value))}
                      min={1} max={2000}
                    />
                    <span className="text-sm flex-shrink-0" style={{ color: 'var(--text-muted)' }}>g</span>
                  </div>

                  {/* Quick portion buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {[50, 100, 150, 200, 250, 300].map(g => (
                      <button key={g} onClick={() => setGrams(g)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${grams === g ? 'border-green-500 text-green-500 bg-green-50' : 'border-[var(--border-color)] text-[var(--text-secondary)]'}`}
                        style={grams === g ? { background: 'rgba(34,197,94,0.08)' } : { background: 'var(--bg-secondary)' }}>
                        {g}g
                      </button>
                    ))}
                  </div>

                  {nutrition && (
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Kalori', value: Math.round(nutrition.calories), unit: 'kcal', color: '#22c55e' },
                        { label: 'Protein', value: nutrition.protein.toFixed(1), unit: 'g', color: '#3b82f6' },
                        { label: 'Karbo', value: nutrition.carbs.toFixed(1), unit: 'g', color: '#f97316' },
                        { label: 'Lemak', value: nutrition.fat.toFixed(1), unit: 'g', color: '#a855f7' },
                      ].map(n => (
                        <div key={n.label} className="text-center py-2 px-1 rounded-xl" style={{ background: `${n.color}10` }}>
                          <div className="font-bold text-sm" style={{ color: n.color }}>{n.value}</div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{n.unit}</div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{n.label}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button onClick={handleAddFromDB} className="btn-primary w-full">
                    Tambahkan ke Log
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="label">Nama Makanan</label>
                <input type="text" className="input-field" placeholder="Contoh: Nasi Goreng Spesial"
                  value={manualForm.name} onChange={e => setManualForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'grams', label: 'Gram', unit: 'g' },
                  { key: 'calories', label: 'Kalori', unit: 'kcal' },
                  { key: 'protein', label: 'Protein', unit: 'g' },
                  { key: 'carbs', label: 'Karbohidrat', unit: 'g' },
                  { key: 'fat', label: 'Lemak', unit: 'g' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="label">{field.label} ({field.unit})</label>
                    <input type="number" className="input-field" min={0} step={0.1}
                      value={manualForm[field.key]}
                      onChange={e => setManualForm(f => ({ ...f, [field.key]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <button onClick={handleAddManual} disabled={!manualForm.name}
                className="btn-primary w-full" style={{ opacity: !manualForm.name ? 0.5 : 1 }}>
                Tambahkan ke Log
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function FoodTracker() {
  const { state, dispatch } = useApp()
  const { dailyLogs, currentDate, nutritionTarget, profile } = state
  const [showModal, setShowModal] = useState(false)
  const [activeMeal, setActiveMeal] = useState('breakfast')
  const [date, setDate] = useState(currentDate)

  const target = nutritionTarget || profile || {}
  const calorieTarget = target.daily_calorie_target || 2800
  const todayLogs = dailyLogs.filter(l => l.date === date)
  const totals = calculateTotals(dailyLogs, date)

  const handleAdd = (food) => {
    dispatch({ type: 'ADD_FOOD_LOG', payload: food })
  }

  const handleDelete = (id) => {
    dispatch({ type: 'DELETE_FOOD_LOG', payload: id })
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title text-xl">Food Tracker</h1>
          <p className="section-subtitle">Catat semua makanan harianmu</p>
        </div>
        <input
          type="date"
          className="input-field w-auto"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={{ width: 'auto' }}
        />
      </div>

      {/* Daily Summary Bar */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            Total Hari Ini
          </span>
          <span className="font-black text-lg" style={{ color: 'var(--text-primary)' }}>
            <span className="text-green-500">{Math.round(totals.calories)}</span>
            <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}> / {calorieTarget} kcal</span>
          </span>
        </div>
        <div className="progress-bar mb-3">
          <div className="progress-fill gradient-green"
               style={{ width: `${Math.min((totals.calories / calorieTarget) * 100, 100)}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Protein', value: totals.protein, unit: 'g', color: '#3b82f6' },
            { label: 'Karbo', value: totals.carbs, unit: 'g', color: '#f97316' },
            { label: 'Lemak', value: totals.fat, unit: 'g', color: '#a855f7' },
          ].map(m => (
            <div key={m.label} className="text-center">
              <div className="font-bold" style={{ color: m.color }}>{Math.round(m.value)}{m.unit}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Meal Sections */}
      {Object.entries(MEAL_TYPES).map(([type, meal]) => {
        const mealLogs = todayLogs.filter(l => l.meal_type === type)
        const mealCals = mealLogs.reduce((s, l) => s + (l.calories || 0), 0)

        return (
          <div key={type} className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                     style={{ background: `${meal.color}15` }}>
                  {meal.emoji}
                </div>
                <div>
                  <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{meal.label}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {Math.round(mealCals)} kcal {mealLogs.length > 0 && `· ${mealLogs.length} item`}
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setActiveMeal(type); setShowModal(true) }}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                style={{ background: `${meal.color}15`, color: meal.color }}
              >
                <Plus size={18} />
              </button>
            </div>

            {mealLogs.length > 0 ? (
              <div className="space-y-2">
                {mealLogs.map(log => (
                  <div key={log.id} className="flex items-center justify-between py-2 px-3 rounded-xl"
                       style={{ background: 'var(--bg-secondary)' }}>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {log.name}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {log.grams}g · P:{Math.round(log.protein)}g · K:{Math.round(log.carbs)}g · L:{Math.round(log.fat)}g
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-bold" style={{ color: meal.color }}>
                        {Math.round(log.calories)} kcal
                      </span>
                      <button onClick={() => handleDelete(log.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>
                <div className="text-xs">Belum ada makanan ditambahkan</div>
              </div>
            )}
          </div>
        )
      })}

      {showModal && (
        <AddFoodModal
          onClose={() => setShowModal(false)}
          onAdd={handleAdd}
          date={date}
          mealType={activeMeal}
        />
      )}
    </div>
  )
}
