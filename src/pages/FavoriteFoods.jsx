import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { DEFAULT_FAVORITES, FOOD_DATABASE, MEAL_TYPES } from '../utils/helpers'
import { Heart, Plus, Trash2, Star, Zap, Search, X } from 'lucide-react'

function AddFavoriteModal({ onClose, onAdd }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [grams, setGrams] = useState(100)
  const [manualName, setManualName] = useState('')
  const [mode, setMode] = useState('search')

  const filtered = FOOD_DATABASE.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAdd = () => {
    if (mode === 'search' && selected) {
      const cal = (selected.per100g.calories * grams / 100)
      onAdd({
        name: `${selected.name} ${grams}g`,
        grams,
        calories: cal,
        protein: (selected.per100g.protein * grams / 100),
        carbs: (selected.per100g.carbs * grams / 100),
        fat: (selected.per100g.fat * grams / 100),
      })
    } else if (mode === 'default' && selected) {
      onAdd(selected)
    }
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
          <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Tambah Favorit</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--bg-secondary)' }}>
            <X size={16} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="tab-nav">
            <button className={`tab-btn ${mode === 'default' ? 'active' : ''}`} onClick={() => setMode('default')}>
              ⭐ Rekomendasi
            </button>
            <button className={`tab-btn ${mode === 'search' ? 'active' : ''}`} onClick={() => setMode('search')}>
              🔍 Cari Database
            </button>
          </div>

          {mode === 'default' ? (
            <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
              {DEFAULT_FAVORITES.map((food, i) => (
                <button key={i}
                  onClick={() => setSelected(selected?.name === food.name ? null : food)}
                  className="w-full text-left px-3 py-3 rounded-xl transition-all border"
                  style={{
                    background: selected?.name === food.name ? 'rgba(34,197,94,0.08)' : 'var(--bg-secondary)',
                    borderColor: selected?.name === food.name ? '#22c55e' : 'var(--border-color)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{food.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {Math.round(food.calories)} kcal · P:{Math.round(food.protein)}g
                      </div>
                    </div>
                    {selected?.name === food.name && <Star size={16} fill="#22c55e" color="#22c55e" />}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input type="text" className="input-field pl-9" placeholder="Cari makanan..."
                  value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setSelected(null) }} autoFocus />
              </div>
              {!selected && (
                <div className="max-h-48 overflow-y-auto scrollbar-thin space-y-1">
                  {filtered.slice(0, 15).map(food => (
                    <button key={food.name}
                      onClick={() => { setSelected(food); setSearchQuery(food.name) }}
                      className="w-full text-left px-3 py-2.5 rounded-xl"
                      style={{ background: 'var(--bg-secondary)' }}>
                      <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{food.name}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {food.per100g.calories} kcal/100g
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {selected && mode === 'search' && (
                <div>
                  <label className="label">Gram Porsi Favorit</label>
                  <div className="flex items-center gap-2">
                    <input type="number" className="input-field" value={grams}
                      onChange={e => setGrams(Number(e.target.value))} min={1} />
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>g</span>
                  </div>
                  <div className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                    = {Math.round(selected.per100g.calories * grams / 100)} kcal,
                    P: {(selected.per100g.protein * grams / 100).toFixed(1)}g
                  </div>
                </div>
              )}
            </>
          )}

          <button onClick={handleAdd} disabled={!selected}
            className="btn-primary w-full" style={{ opacity: !selected ? 0.5 : 1 }}>
            Tambah ke Favorit
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FavoriteFoods() {
  const { state, dispatch } = useApp()
  const { favoriteFoods, currentDate } = state
  const [showModal, setShowModal] = useState(false)
  const [addedId, setAddedId] = useState(null)

  // Seed default favorites if empty
  const allFavorites = favoriteFoods.length > 0 ? favoriteFoods : DEFAULT_FAVORITES.map((f, i) => ({ ...f, id: `default-${i}` }))

  const handleAdd = (food) => {
    dispatch({ type: 'ADD_FAVORITE', payload: food })
  }

  const handleDelete = (id) => {
    dispatch({ type: 'DELETE_FAVORITE', payload: id })
  }

  const handleQuickAdd = (food, mealType = 'snack') => {
    dispatch({
      type: 'ADD_FOOD_LOG',
      payload: {
        name: food.name,
        grams: food.grams || 100,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        meal_type: mealType,
        date: currentDate,
      }
    })
    setAddedId(food.id || food.name)
    setTimeout(() => setAddedId(null), 2000)
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title text-xl">Makanan Favorit</h1>
          <p className="section-subtitle">Quick add makanan yang sering dikonsumsi</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 px-3 py-2">
          <Plus size={16} />
          <span className="hidden sm:inline">Tambah</span>
        </button>
      </div>

      {/* Quick Add Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {allFavorites.map((food, idx) => (
          <div key={food.id || idx}
            className="card p-4 animate-slide-up"
            style={{ animationDelay: `${idx * 50}ms` }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl gradient-green flex items-center justify-center flex-shrink-0">
                  <Star size={16} color="white" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {food.name}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {food.grams && `${food.grams}g · `}{Math.round(food.calories)} kcal
                  </div>
                </div>
              </div>
              {food.id && !food.id.startsWith('default') && (
                <button onClick={() => handleDelete(food.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            {/* Macros */}
            <div className="flex gap-3 mb-3">
              {[
                { label: 'P', value: food.protein, color: '#3b82f6' },
                { label: 'K', value: food.carbs, color: '#f97316' },
                { label: 'L', value: food.fat, color: '#a855f7' },
              ].map(m => (
                <div key={m.label} className="text-xs">
                  <span className="font-bold" style={{ color: m.color }}>{Math.round(m.value)}g</span>
                  <span className="ml-0.5" style={{ color: 'var(--text-muted)' }}>{m.label}</span>
                </div>
              ))}
            </div>

            {/* Quick add buttons */}
            <div className="flex gap-2">
              {[
                { type: 'breakfast', label: 'Sarapan', emoji: '🌅' },
                { type: 'lunch', label: 'Siang', emoji: '☀️' },
                { type: 'snack', label: 'Snack', emoji: '🍪' },
              ].map(meal => (
                <button
                  key={meal.type}
                  onClick={() => handleQuickAdd(food, meal.type)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1"
                  style={{
                    background: addedId === (food.id || food.name) ? 'rgba(34,197,94,0.15)' : 'var(--bg-secondary)',
                    color: addedId === (food.id || food.name) ? '#22c55e' : 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                  }}>
                  <span>{meal.emoji}</span>
                  <span className="hidden sm:inline">{meal.label}</span>
                </button>
              ))}
            </div>

            {addedId === (food.id || food.name) && (
              <div className="mt-2 text-center text-xs font-semibold text-green-500 animate-fade-in">
                ✓ Ditambahkan ke log!
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <AddFavoriteModal onClose={() => setShowModal(false)} onAdd={handleAdd} />
      )}
    </div>
  )
}
