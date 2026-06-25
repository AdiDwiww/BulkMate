import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { FOOD_DATABASE, MEAL_TYPES, calculateTotals } from '../utils/helpers'
import { Plus, Trash2, Search, X, Sunrise, Sun, Moon, Cookie, Loader2, Zap, Sparkles, AlertTriangle } from 'lucide-react'

const MEAL_ICON_MAP = { Sunrise, Sun, Moon, Cookie }

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

const AI_NUTRITION_PROMPT = (name) => `Kamu adalah ahli nutrisi Indonesia. Berikan estimasi kandungan gizi untuk makanan berikut: "${name}".

Berikan respons HANYA dalam format JSON berikut (tanpa teks lain):
{
  "name": "<nama makanan yang sudah diperbaiki ejaannya>",
  "grams": <estimasi porsi umum dalam gram>,
  "calories": <estimasi kalori total>,
  "protein": <estimasi protein dalam gram>,
  "carbs": <estimasi karbohidrat dalam gram>,
  "fat": <estimasi lemak dalam gram>
}

Gunakan pengetahuan tentang makanan Indonesia. Berikan estimasi realistis untuk 1 porsi standar.`

async function lookupNutritionWithGroq(name) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: AI_NUTRITION_PROMPT(name) }],
      temperature: 0.2, max_tokens: 256,
    }),
  })
  if (!res.ok) throw new Error('Groq error')
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Format tidak valid')
  return JSON.parse(match[0])
}

async function lookupNutritionWithGemini(name) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: AI_NUTRITION_PROMPT(name) }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 256 }
      })
    }
  )
  if (!res.ok) throw new Error('Gemini error')
  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Format tidak valid')
  return JSON.parse(match[0])
}

async function lookupNutritionAI(name) {
  if (GROQ_API_KEY) {
    try { return await lookupNutritionWithGroq(name) } catch (e) { console.warn('Groq fallback:', e.message) }
  }
  if (GEMINI_API_KEY) return await lookupNutritionWithGemini(name)
  throw new Error('NO_KEY')
}

function AddFoodModal({ onClose, onAdd, date, mealType }) {
  const [mode, setMode] = useState('search') // 'search' | 'manual'
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFood, setSelectedFood] = useState(null)
  const [grams, setGrams] = useState(100)

  // Manual AI state
  const [manualName, setManualName] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [aiError, setAiError] = useState(null)

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
    onAdd({ name: selectedFood.name, grams, meal_type: mealType, date, ...nutrition })
    onClose()
  }

  const handleAILookup = async () => {
    if (!manualName.trim()) return
    setAiLoading(true)
    setAiResult(null)
    setAiError(null)
    try {
      const result = await lookupNutritionAI(manualName.trim())
      setAiResult(result)
    } catch {
      setAiError('Gagal menganalisis. Cek koneksi atau API key.')
    } finally {
      setAiLoading(false)
    }
  }

  const handleAddAIResult = () => {
    if (!aiResult) return
    onAdd({ ...aiResult, meal_type: mealType, date })
    onClose()
  }

  const nutrition = selectedFood ? calcNutrition(selectedFood, grams) : null
  const hasApiKey = Boolean(GROQ_API_KEY || GEMINI_API_KEY)

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
              Cari Database
            </button>
            <button className={`tab-btn ${mode === 'manual' ? 'active' : ''}`} onClick={() => setMode('manual')}>
              Input AI
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
                    <button key={food.name}
                      onClick={() => { setSelectedFood(food); setSearchQuery(food.name) }}
                      className="w-full text-left px-3 py-2.5 rounded-xl transition-colors"
                      style={{ background: 'var(--bg-secondary)' }}>
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
                    <input type="number" className="input-field" value={grams}
                      onChange={e => setGrams(Number(e.target.value))} min={1} max={2000} />
                    <span className="text-sm flex-shrink-0" style={{ color: 'var(--text-muted)' }}>g</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {[50, 100, 150, 200, 250, 300].map(g => (
                      <button key={g} onClick={() => setGrams(g)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all`}
                        style={grams === g
                          ? { background: 'rgba(34,197,94,0.08)', borderColor: '#22c55e', color: '#22c55e' }
                          : { background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
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
                  <button onClick={handleAddFromDB} className="btn-primary w-full">Tambahkan ke Log</button>
                </div>
              )}
            </>
          ) : (
            /* ── AI Input Manual ── */
            <div className="space-y-4">
              {/* Info banner */}
              <div className="rounded-xl p-3 flex items-start gap-2.5"
                style={{ background: hasApiKey ? 'rgba(34,197,94,0.08)' : 'rgba(168,85,247,0.08)', border: `1px solid ${hasApiKey ? 'rgba(34,197,94,0.2)' : 'rgba(168,85,247,0.2)'}` }}>
                <Sparkles size={16} style={{ color: hasApiKey ? '#22c55e' : '#a855f7', flexShrink: 0, marginTop: 1 }} />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {hasApiKey
                    ? 'Ketik nama makanan — AI akan otomatis menentukan kandungan gizinya.'
                    : 'Tambahkan VITE_GROQ_API_KEY di .env untuk fitur ini.'}
                </p>
              </div>

              {/* Name input */}
              <div>
                <label className="label">Nama Makanan</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input-field flex-1"
                    placeholder="Contoh: Nasi Goreng Spesial, Mie Ayam..."
                    value={manualName}
                    onChange={e => { setManualName(e.target.value); setAiResult(null); setAiError(null) }}
                    onKeyDown={e => e.key === 'Enter' && handleAILookup()}
                    autoFocus
                  />
                  <button
                    onClick={handleAILookup}
                    disabled={!manualName.trim() || aiLoading || !hasApiKey}
                    className="btn-primary px-4 flex items-center gap-1.5 flex-shrink-0"
                    style={{ opacity: (!manualName.trim() || !hasApiKey) ? 0.5 : 1 }}
                  >
                    {aiLoading
                      ? <Loader2 size={15} className="animate-spin" />
                      : <Zap size={15} />}
                    {aiLoading ? 'Analisis...' : 'Cari'}
                  </button>
                </div>
              </div>

              {/* Loading */}
              {aiLoading && (
                <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>
                  <Loader2 size={24} className="animate-spin mx-auto mb-2" style={{ color: '#22c55e' }} />
                  <p className="text-xs">AI sedang menganalisis kandungan gizi...</p>
                </div>
              )}

              {/* Error */}
              {aiError && (
                <div className="rounded-xl p-3 flex items-center gap-2"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <AlertTriangle size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
                  <p className="text-xs text-red-400">{aiError}</p>
                </div>
              )}

              {/* AI Result */}
              {aiResult && !aiLoading && (
                <div className="space-y-3 animate-fade-in">
                  <div className="rounded-xl p-3" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Sparkles size={13} style={{ color: '#22c55e' }} />
                      <span className="text-xs font-semibold" style={{ color: '#22c55e' }}>Hasil Analisis AI</span>
                    </div>
                    <div className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{aiResult.name}</div>
                    <div className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Estimasi per {aiResult.grams}g (1 porsi)</div>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Kalori', value: Math.round(aiResult.calories), unit: 'kcal', color: '#22c55e' },
                        { label: 'Protein', value: Number(aiResult.protein).toFixed(1), unit: 'g', color: '#3b82f6' },
                        { label: 'Karbo', value: Number(aiResult.carbs).toFixed(1), unit: 'g', color: '#f97316' },
                        { label: 'Lemak', value: Number(aiResult.fat).toFixed(1), unit: 'g', color: '#a855f7' },
                      ].map(n => (
                        <div key={n.label} className="text-center py-2 rounded-xl" style={{ background: `${n.color}10` }}>
                          <div className="font-bold text-sm" style={{ color: n.color }}>{n.value}</div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{n.unit}</div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{n.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button onClick={handleAddAIResult} className="btn-primary w-full">
                    Tambahkan ke Log
                  </button>
                </div>
              )}
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
        <div className="mobile-page-header">
          <h1 className="section-title text-xl">Food Tracker</h1>
          <p className="section-subtitle">Catat semua makanan harianmu</p>
        </div>
        <input
          type="date"
          className="input-field w-auto"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={{ width: 'auto', fontSize: '14px' }}
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
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                     style={{ background: `${meal.color}15` }}>
                  {MEAL_ICON_MAP[meal.icon] && (() => { const I = MEAL_ICON_MAP[meal.icon]; return <I size={18} style={{ color: meal.color }} /> })()}
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
