import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Wand2, Loader2, Plus, RefreshCw, Zap, Sunrise, Sun, Moon, Cookie, BarChart2, AlertTriangle } from 'lucide-react'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GROQ_API_KEY   = import.meta.env.VITE_GROQ_API_KEY

const MEAL_PLAN_PROMPT = (budget, calorieTarget, proteinTarget) =>
  `Kamu adalah ahli gizi Indonesia. Buat rencana makan harian untuk program bulking (menaikkan berat badan) dengan ketentuan:
- Budget harian: Rp ${budget.toLocaleString('id-ID')}
- Target kalori: ${calorieTarget} kcal
- Target protein: ${proteinTarget}g
- Gunakan makanan yang mudah ditemukan di Indonesia
- Harga harus realistis sesuai harga warung/pasar Indonesia

Berikan respons HANYA dalam format JSON ini (tanpa teks lain):
{
  "breakfast": {
    "name": "<nama menu>",
    "items": ["<item1>", "<item2>"],
    "calories": <total kalori>,
    "protein": <total protein gram>,
    "carbs": <total karbo gram>,
    "fat": <total lemak gram>,
    "cost": <perkiraan harga dalam rupiah>
  },
  "lunch": { "name": "", "items": [], "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "cost": 0 },
  "dinner": { "name": "", "items": [], "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "cost": 0 },
  "snack": { "name": "", "items": [], "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "cost": 0 }
}`

function parseMealPlan(text) {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Format respons tidak valid')
  const plan = JSON.parse(jsonMatch[0])
  const totalCals = (plan.breakfast?.calories || 0) + (plan.lunch?.calories || 0) + (plan.dinner?.calories || 0) + (plan.snack?.calories || 0)
  const totalProtein = (plan.breakfast?.protein || 0) + (plan.lunch?.protein || 0) + (plan.dinner?.protein || 0) + (plan.snack?.protein || 0)
  const totalCost = (plan.breakfast?.cost || 0) + (plan.lunch?.cost || 0) + (plan.dinner?.cost || 0) + (plan.snack?.cost || 0)
  return { ...plan, totalCals, totalProtein, totalCost }
}

// Generate dengan Groq (llama-3.3-70b) — cepat & gratis
async function generateWithGroq(budget, calorieTarget, proteinTarget) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: MEAL_PLAN_PROMPT(budget, calorieTarget, proteinTarget) }],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  })
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    const status = response.status
    if (status === 429) throw new Error('QUOTA_EXCEEDED')
    if (status === 401) throw new Error('INVALID_KEY')
    throw new Error(errData.error?.message || 'Groq API error')
  }
  const data = await response.json()
  return parseMealPlan(data.choices?.[0]?.message?.content || '')
}

// Generate dengan Gemini — fallback
async function generateWithGemini(budget, calorieTarget, proteinTarget) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: MEAL_PLAN_PROMPT(budget, calorieTarget, proteinTarget) }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      })
    }
  )
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}))
    const status = response.status
    if (status === 429) throw new Error('QUOTA_EXCEEDED')
    if (status === 400) throw new Error('INVALID_KEY')
    throw new Error(errData.error?.message || 'Gemini API error')
  }
  const data = await response.json()
  return parseMealPlan(data.candidates?.[0]?.content?.parts?.[0]?.text || '')
}

// Router utama: Groq dulu, fallback Gemini
async function generateMealPlanWithAI(budget, calorieTarget, proteinTarget) {
  if (GROQ_API_KEY) {
    try {
      return await generateWithGroq(budget, calorieTarget, proteinTarget)
    } catch (e) {
      if (e.message === 'QUOTA_EXCEEDED' || e.message === 'INVALID_KEY') throw e
      console.warn('Groq failed, trying Gemini:', e.message)
    }
  }
  if (GEMINI_API_KEY) {
    return await generateWithGemini(budget, calorieTarget, proteinTarget)
  }
  throw new Error('NO_KEY')
}

// Fallback lokal jika tidak ada Gemini key
function generateLocalMealPlan(budget, calorieTarget, proteinTarget) {
  const plans = {
    breakfast: [
      { name: 'Nasi Goreng Telur + Susu UHT', calories: 520, protein: 22, carbs: 68, fat: 17, items: ['Nasi Goreng 250g', 'Telur Goreng 1 butir', 'Susu UHT 250ml'], cost: 18000 },
      { name: 'Oatmeal + Pisang + Telur Rebus', calories: 480, protein: 24, carbs: 72, fat: 11, items: ['Oatmeal 80g', 'Pisang 1 buah', 'Telur Rebus 2 butir'], cost: 12000 },
      { name: 'Roti Bakar + Telur + Susu', calories: 460, protein: 20, carbs: 56, fat: 16, items: ['Roti Tawar 4 lembar', 'Telur Goreng 2 butir', 'Susu UHT 250ml'], cost: 14000 },
    ],
    lunch: [
      { name: 'Nasi + Ayam Goreng + Sayur', calories: 720, protein: 42, carbs: 82, fat: 20, items: ['Nasi Putih 300g', 'Ayam Goreng 150g', 'Sayur Bayam'], cost: 22000 },
      { name: 'Nasi + Tempe + Tahu + Sayur', calories: 650, protein: 35, carbs: 85, fat: 16, items: ['Nasi Putih 300g', 'Tempe Goreng 100g', 'Tahu Goreng 2 potong'], cost: 15000 },
      { name: 'Nasi + Ikan Goreng + Sayur', calories: 680, protein: 40, carbs: 80, fat: 18, items: ['Nasi Putih 300g', 'Ikan Goreng 150g', 'Sayur Kangkung'], cost: 20000 },
    ],
    dinner: [
      { name: 'Nasi + Rendang + Sayur', calories: 750, protein: 48, carbs: 78, fat: 22, items: ['Nasi Putih 250g', 'Rendang Sapi 100g', 'Sayur Bening'], cost: 28000 },
      { name: 'Nasi + Ayam Bakar + Lalapan', calories: 700, protein: 45, carbs: 75, fat: 18, items: ['Nasi Putih 250g', 'Ayam Bakar 150g', 'Lalapan'], cost: 25000 },
    ],
    snack: [
      { name: 'Pisang + Susu + Kacang Tanah', calories: 380, protein: 14, carbs: 48, fat: 16, items: ['Pisang 2 buah', 'Susu UHT 250ml', 'Kacang Tanah 30g'], cost: 12000 },
      { name: 'Roti + Peanut Butter + Pisang', calories: 420, protein: 16, carbs: 52, fat: 18, items: ['Roti Tawar 2 lembar', 'Peanut Butter 2 sdm', 'Pisang 1 buah'], cost: 8000 },
    ],
  }

  const r = (arr) => arr[Math.floor(Math.random() * arr.length)]
  const b = r(plans.breakfast), l = r(plans.lunch), d = r(plans.dinner), s = r(plans.snack)
  return {
    breakfast: b, lunch: l, dinner: d, snack: s,
    totalCals: b.calories + l.calories + d.calories + s.calories,
    totalProtein: b.protein + l.protein + d.protein + s.protein,
    totalCost: b.cost + l.cost + d.cost + s.cost,
  }
}

export default function AIMealPlanner() {
  const { state, dispatch } = useApp()
  const { profile, nutritionTarget, currentDate } = state

  const target = nutritionTarget || profile || {}
  const [budget, setBudget] = useState(80000)
  const [calorieTarget, setCalorieTarget] = useState(target.daily_calorie_target || 2800)
  const [proteinTarget, setProteinTarget] = useState(target.protein_target || 140)
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState(null)
  const [aiError, setAiError] = useState(null)
  const [usedAI, setUsedAI] = useState(false)
  const [addedSuccess, setAddedSuccess] = useState(false)

  const hasApiKey = Boolean(GROQ_API_KEY || GEMINI_API_KEY)
  const activeProvider = GROQ_API_KEY ? 'Groq' : GEMINI_API_KEY ? 'Gemini' : null

  const handleGenerate = async () => {
    setLoading(true)
    setPlan(null)
    setAiError(null)

    try {
      if (hasApiKey) {
        const result = await generateMealPlanWithAI(budget, calorieTarget, proteinTarget)
        setPlan(result)
        setUsedAI(true)
      } else {
        await new Promise(r => setTimeout(r, 1200))
        setPlan(generateLocalMealPlan(budget, calorieTarget, proteinTarget))
        setUsedAI(false)
      }
    } catch (err) {
      console.error(err)
      const msg = err.message
      if (msg === 'QUOTA_EXCEEDED') {
        setAiError('Kuota AI habis. Menu dibuat dari template lokal.')
      } else if (msg === 'INVALID_KEY') {
        setAiError('API key tidak valid. Periksa VITE_GROQ_API_KEY atau VITE_GEMINI_API_KEY di .env.')
      } else {
        setAiError(`AI error: ${msg}. Menggunakan template lokal.`)
      }
      setPlan(generateLocalMealPlan(budget, calorieTarget, proteinTarget))
      setUsedAI(false)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToLog = () => {
    if (!plan) return
    const meals = [
      { type: 'breakfast', data: plan.breakfast },
      { type: 'lunch', data: plan.lunch },
      { type: 'dinner', data: plan.dinner },
      { type: 'snack', data: plan.snack },
    ]
    meals.forEach(({ type, data }) => {
      if (!data) return
      dispatch({
        type: 'ADD_FOOD_LOG',
        payload: {
          name: data.name,
          calories: data.calories || 0,
          protein: data.protein || 0,
          carbs: data.carbs || 0,
          fat: data.fat || 0,
          grams: 0,
          meal_type: type,
          date: currentDate,
        }
      })
    })
    setAddedSuccess(true)
    setTimeout(() => setAddedSuccess(false), 3000)
  }

  const mealIcons = {
    breakfast: { Icon: Sunrise, label: 'Sarapan',    color: '#f97316' },
    lunch:     { Icon: Sun,     label: 'Makan Siang', color: '#22c55e' },
    dinner:    { Icon: Moon,    label: 'Makan Malam', color: '#3b82f6' },
    snack:     { Icon: Cookie,  label: 'Snack',       color: '#a855f7' },
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div className="mobile-page-header">
        <h1 className="section-title text-xl">AI Meal Planner</h1>
        <p className="section-subtitle">Generate menu harian otomatis sesuai target bulkingmu</p>
      </div>

      {/* Status */}
      <div className="rounded-2xl p-4 flex items-start gap-3"
           style={{
             background: hasApiKey ? 'rgba(34,197,94,0.08)' : 'rgba(59,130,246,0.08)',
             border: `1px solid ${hasApiKey ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.15)'}`,
           }}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${hasApiKey ? 'gradient-green' : 'gradient-blue'}`}>
          <Wand2 size={18} color="white" />
        </div>
        <div>
          <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            {hasApiKey ? `${activeProvider} AI Aktif` : 'Mode Lokal (Template)'}
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {activeProvider === 'Groq'
              ? 'Menggunakan Groq LLaMA 3.3 70B untuk generate menu personal dengan bahan Indonesia.'
              : activeProvider === 'Gemini'
              ? 'Menggunakan Google Gemini untuk generate menu personal dengan bahan Indonesia.'
              : 'Tambahkan VITE_GROQ_API_KEY di .env untuk menu AI gratis tanpa limit.'}
          </div>
        </div>
      </div>

      {aiError && (
        <div className="rounded-xl p-3 text-sm flex items-center gap-1.5" style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', color: '#f97316' }}>
          <AlertTriangle size={14} /> {aiError}
        </div>
      )}

      {/* Input */}
      <div className="card p-5">
        <h2 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Preferensi Menu</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Budget Harian (Rp)</label>
            <input type="number" className="input-field" value={budget}
              onChange={e => setBudget(Number(e.target.value))} min={20000} step={5000} />
            <div className="flex gap-2 mt-2 flex-wrap">
              {[50000, 75000, 100000, 150000].map(b => (
                <button key={b} onClick={() => setBudget(b)}
                  className="text-xs px-2 py-1 rounded-lg border transition-all"
                  style={{
                    background: budget === b ? 'rgba(34,197,94,0.1)' : 'var(--bg-secondary)',
                    borderColor: budget === b ? '#22c55e' : 'var(--border-color)',
                    color: budget === b ? '#22c55e' : 'var(--text-secondary)',
                  }}>
                  {(b / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Target Kalori (kcal)</label>
            <input type="number" className="input-field" value={calorieTarget}
              onChange={e => setCalorieTarget(Number(e.target.value))} min={1500} max={5000} />
          </div>
          <div>
            <label className="label">Target Protein (g)</label>
            <input type="number" className="input-field" value={proteinTarget}
              onChange={e => setProteinTarget(Number(e.target.value))} min={50} max={300} />
          </div>
        </div>
        <button onClick={handleGenerate} disabled={loading}
          className="btn-primary w-full mt-4 py-3 flex items-center justify-center gap-2">
          {loading ? (
            <><Loader2 size={18} className="animate-spin" />{hasApiKey ? 'Gemini AI sedang merancang menu...' : 'Generating...'}</>
          ) : (
            <><Wand2 size={18} />Generate Menu {hasApiKey ? 'dengan AI' : 'Hari Ini'}</>
          )}
        </button>
      </div>

      {/* Result */}
      {plan && (
        <div className="animate-slide-up space-y-4">
          {/* Summary */}
          <div className="rounded-2xl p-5 text-white"
               style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', boxShadow: '0 8px 24px rgba(34,197,94,0.35)' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-semibold flex items-center gap-2"><BarChart2 size={16} /> Ringkasan Menu Hari Ini</span>
              {usedAI && <span className="badge flex items-center gap-1" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '10px' }}>Gemini AI</span>}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-black">{Math.round(plan.totalCals)}</div>
                <div className="text-green-200 text-xs">kcal total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black">{Math.round(plan.totalProtein)}g</div>
                <div className="text-green-200 text-xs">protein</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black">Rp{(plan.totalCost / 1000).toFixed(0)}k</div>
                <div className="text-green-200 text-xs">estimasi biaya</div>
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <div className="flex justify-between text-xs text-green-100">
                <span>Kalori ({Math.round((plan.totalCals / calorieTarget) * 100)}%)</span>
                <span>{Math.round(plan.totalCals)}/{calorieTarget} kcal</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all"
                     style={{ width: `${Math.min((plan.totalCals / calorieTarget) * 100, 100)}%` }} />
              </div>
            </div>
          </div>

          {/* Meal Cards */}
          {['breakfast', 'lunch', 'dinner', 'snack'].map(mealType => {
            const mealData = plan[mealType]
            if (!mealData) return null
            const icon = mealIcons[mealType]
            const MealIcon = icon.Icon
            return (
              <div key={mealType} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                         style={{ background: `${icon.color}15` }}>
                      <MealIcon size={18} style={{ color: icon.color }} />
                    </div>
                    <div>
                      <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{icon.label}</div>
                      <div className="text-xs font-semibold" style={{ color: icon.color }}>{mealData.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black" style={{ color: icon.color }}>{Math.round(mealData.calories)} kcal</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      ~Rp{(mealData.cost / 1000).toFixed(0)}k
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  {(mealData.items || []).map((item, i) => (
                    <div key={i} className="text-sm py-1 px-3 rounded-lg flex items-center gap-2"
                         style={{ background: 'var(--bg-secondary)' }}>
                      <span style={{ color: icon.color }}>•</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span className="font-semibold text-blue-500">P: {Math.round(mealData.protein || 0)}g</span>
                  <span className="font-semibold text-orange-500">K: {Math.round(mealData.carbs || 0)}g</span>
                  <span className="font-semibold text-purple-500">L: {Math.round(mealData.fat || 0)}g</span>
                </div>
              </div>
            )
          })}

          <div className="flex gap-3">
            <button onClick={handleGenerate} className="btn-secondary flex-1 flex items-center justify-center gap-2">
              <RefreshCw size={16} />
              Generate Ulang
            </button>
            {addedSuccess ? (
              <div className="flex-1 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm text-green-500"
                   style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                ✓ Berhasil ditambahkan!
              </div>
            ) : (
              <button onClick={handleAddToLog} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Plus size={16} />
                Tambah ke Log
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
