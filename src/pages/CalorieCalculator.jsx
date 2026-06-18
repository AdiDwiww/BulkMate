import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { calculateBMR, calculateTDEE, calculateProteinTarget, ACTIVITY_LEVELS } from '../utils/helpers'
import { Calculator, Flame, Target, TrendingUp, ChevronRight, Dumbbell, Wheat, BarChart2, Star } from 'lucide-react'

export default function CalorieCalculator({ onPageChange }) {
  const { state, dispatch } = useApp()
  const profile = state.profile || {}

  const [form, setForm] = useState({
    gender: profile.gender || 'male',
    age: profile.age || 21,
    weight: profile.weight || 58,
    height: profile.height || 170,
    activity_level: profile.activity_level || 'moderate',
  })
  const [result, setResult] = useState(null)
  const [saved, setSaved] = useState(false)

  const calculate = () => {
    const bmr = calculateBMR(form.gender, Number(form.weight), Number(form.height), Number(form.age))
    const tdee = calculateTDEE(bmr, form.activity_level)
    const protein = calculateProteinTarget(Number(form.weight))
    const carb = Math.round((tdee * 0.45) / 4)
    const fat = Math.round((tdee * 0.25) / 9)

    setResult({
      bmr,
      tdee,
      surplus250: tdee + 250,
      surplus500: tdee + 500,
      surplus750: tdee + 750,
      protein,
      carb,
      fat,
    })
    setSaved(false)
  }

  const saveTarget = (calorieTarget, surplusLabel) => {
    const newProfile = {
      ...form,
      name: profile.name || 'User',
      daily_calorie_target: calorieTarget,
      protein_target: result.protein,
      carb_target: Math.round((calorieTarget * 0.45) / 4),
      fat_target: Math.round((calorieTarget * 0.25) / 9),
      bmr: result.bmr,
      tdee: result.tdee,
      surplus: calorieTarget - result.tdee,
      target_weight: profile.target_weight || (Number(form.weight) + 10),
      activity_level: form.activity_level,
    }
    dispatch({ type: 'SET_PROFILE', payload: newProfile })
    dispatch({ type: 'SET_NUTRITION_TARGET', payload: newProfile })
    setSaved(surplusLabel)
  }

  const surplusOptions = result ? [
    { label: 'Clean Bulk (+250 kcal)', value: result.surplus250, desc: 'Naik ~0.25kg/minggu, minim lemak', color: '#22c55e', recommended: false },
    { label: 'Lean Bulk (+500 kcal)', value: result.surplus500, desc: 'Naik ~0.5kg/minggu, ideal untuk pemula', color: '#3b82f6', recommended: true },
    { label: 'Dirty Bulk (+750 kcal)', value: result.surplus750, desc: 'Naik ~0.75kg/minggu, cepat tapi berlemak', color: '#f97316', recommended: false },
  ] : []

  return (
    <div className="animate-fade-in space-y-6">
      <div className="mobile-page-header">
        <h1 className="section-title text-xl">Kalkulator Kalori</h1>
        <p className="section-subtitle">Hitung kebutuhan kalori harianmu untuk program bulking</p>
      </div>

      {/* Input Form */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-9 h-9 rounded-xl gradient-green flex items-center justify-center">
            <Calculator size={18} color="white" />
          </div>
          <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Data Diri</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Gender */}
          <div>
            <label className="label">Jenis Kelamin</label>
            <div className="flex gap-3">
              {[{ value: 'male', label: 'Laki-laki' }, { value: 'female', label: 'Perempuan' }].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setForm(f => ({ ...f, gender: opt.value }))}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    form.gender === opt.value
                      ? 'border-green-500 text-green-500'
                      : 'border-[var(--border-color)] text-[var(--text-secondary)]'
                  }`}
                  style={{ background: form.gender === opt.value ? 'rgba(34,197,94,0.08)' : 'var(--bg-secondary)' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Age */}
          <div>
            <label className="label">Umur</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="input-field"
                value={form.age}
                onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                min={15} max={80}
              />
              <span className="text-sm flex-shrink-0" style={{ color: 'var(--text-muted)' }}>tahun</span>
            </div>
          </div>

          {/* Weight */}
          <div>
            <label className="label">Berat Badan</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="input-field"
                value={form.weight}
                onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                min={30} max={200}
              />
              <span className="text-sm flex-shrink-0" style={{ color: 'var(--text-muted)' }}>kg</span>
            </div>
          </div>

          {/* Height */}
          <div>
            <label className="label">Tinggi Badan</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="input-field"
                value={form.height}
                onChange={e => setForm(f => ({ ...f, height: e.target.value }))}
                min={100} max={250}
              />
              <span className="text-sm flex-shrink-0" style={{ color: 'var(--text-muted)' }}>cm</span>
            </div>
          </div>

          {/* Activity */}
          <div className="sm:col-span-2">
            <label className="label">Tingkat Aktivitas</label>
            <div className="space-y-2">
              {Object.entries(ACTIVITY_LEVELS).map(([key, { label }]) => (
                <button
                  key={key}
                  onClick={() => setForm(f => ({ ...f, activity_level: key }))}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm border transition-all ${
                    form.activity_level === key
                      ? 'border-green-500 text-green-500 font-semibold'
                      : 'border-[var(--border-color)] text-[var(--text-secondary)]'
                  }`}
                  style={{ background: form.activity_level === key ? 'rgba(34,197,94,0.08)' : 'var(--bg-secondary)' }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={calculate} className="btn-primary w-full mt-5 py-3 text-base">
          <span className="flex items-center justify-center gap-2">
            <Flame size={18} />
            Hitung Kebutuhan Kalori
          </span>
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="animate-slide-up space-y-4">
          {/* BMR & TDEE */}
          <div className="grid grid-cols-2 gap-3">
            <div className="stat-card text-center">
              <div className="text-3xl font-black text-gradient-green">{result.bmr.toLocaleString('id-ID')}</div>
              <div className="text-xs font-bold uppercase tracking-wide mt-1" style={{ color: 'var(--text-muted)' }}>BMR</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Kalori istirahat</div>
            </div>
            <div className="stat-card text-center">
              <div className="text-3xl font-black" style={{ color: '#3b82f6' }}>{result.tdee.toLocaleString('id-ID')}</div>
              <div className="text-xs font-bold uppercase tracking-wide mt-1" style={{ color: 'var(--text-muted)' }}>TDEE</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Kalori maintenance</div>
            </div>
          </div>

          {/* Macros recommendation */}
          <div className="card p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><BarChart2 size={16} color="#3b82f6" /> Rekomendasi Makronutrisi</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Protein', value: result.protein, unit: 'g', color: '#3b82f6', Icon: Dumbbell },
                { label: 'Karbo', value: result.carb, unit: 'g', color: '#f97316', Icon: Wheat },
                { label: 'Lemak', value: result.fat, unit: 'g', color: '#a855f7', Icon: Target },
              ].map(m => (
                <div key={m.label} className="text-center p-3 rounded-xl" style={{ background: `${m.color}10` }}>
                  <div className="flex justify-center mb-1">
                    <m.Icon size={18} color={m.color} />
                  </div>
                  <div className="text-xl font-black" style={{ color: m.color }}>{m.value}{m.unit}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Surplus options */}
          <div>
            <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><Target size={16} color="#22c55e" /> Pilih Target Surplus Kalori</h3>
            <div className="space-y-3">
              {surplusOptions.map(opt => (
                <div
                  key={opt.label}
                  className="card p-4 cursor-pointer"
                  style={{ border: saved === opt.label ? `2px solid ${opt.color}` : undefined }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{opt.label}</span>
                        {opt.recommended && (
                          <span className="badge badge-green text-xs flex items-center gap-1"><Star size={9} fill="#22c55e" /> Disarankan</span>
                        )}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{opt.desc}</div>
                    </div>
                    <div className="text-2xl font-black" style={{ color: opt.color }}>
                      {opt.value.toLocaleString('id-ID')}
                      <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-muted)' }}>kcal</span>
                    </div>
                  </div>
                  <button
                    onClick={() => saveTarget(opt.value, opt.label)}
                    className="w-full py-2 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: saved === opt.label ? `${opt.color}20` : 'var(--bg-secondary)',
                      color: saved === opt.label ? opt.color : 'var(--text-secondary)',
                      border: `1px solid ${saved === opt.label ? opt.color : 'var(--border-color)'}`,
                    }}
                  >
                    {saved === opt.label ? '✓ Tersimpan!' : 'Gunakan Target Ini'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
