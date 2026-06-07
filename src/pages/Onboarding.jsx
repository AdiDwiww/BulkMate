import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { calculateBMR, calculateTDEE, calculateProteinTarget, ACTIVITY_LEVELS } from '../utils/helpers'
import { ChevronRight, ChevronLeft, CheckCircle, Zap, User, Target, Activity } from 'lucide-react'

const steps = [
  { id: 0, label: 'Selamat Datang', icon: '👋' },
  { id: 1, label: 'Data Diri', icon: '👤' },
  { id: 2, label: 'Aktivitas', icon: '🏃' },
  { id: 3, label: 'Target', icon: '🎯' },
  { id: 4, label: 'Selesai!', icon: '🎉' },
]

export default function Onboarding({ onComplete }) {
  const { dispatch } = useApp()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: 'male',
    weight: '',
    height: '',
    activity_level: 'moderate',
    target_weight: '',
    surplus: 500,
  })

  const update = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const bmr = form.weight && form.height && form.age
    ? calculateBMR(form.gender, parseFloat(form.weight), parseFloat(form.height), parseInt(form.age))
    : 0
  const tdee = bmr ? calculateTDEE(bmr, form.activity_level) : 0
  const calorieTarget = tdee + Number(form.surplus)
  const proteinTarget = form.weight ? calculateProteinTarget(parseFloat(form.weight)) : 0

  const canNext = () => {
    if (step === 0) return true
    if (step === 1) return form.name && form.age && form.weight && form.height
    if (step === 2) return !!form.activity_level
    if (step === 3) return !!form.target_weight
    return true
  }

  const handleFinish = () => {
    const profile = {
      name: form.name,
      age: parseInt(form.age),
      gender: form.gender,
      weight: parseFloat(form.weight),
      height: parseFloat(form.height),
      activity_level: form.activity_level,
      target_weight: parseFloat(form.target_weight),
      surplus: Number(form.surplus),
      bmr,
      tdee,
      daily_calorie_target: calorieTarget,
      protein_target: proteinTarget,
      carb_target: Math.round((calorieTarget * 0.45) / 4),
      fat_target: Math.round((calorieTarget * 0.25) / 9),
    }
    dispatch({ type: 'SET_PROFILE', payload: profile })
    dispatch({ type: 'SET_NUTRITION_TARGET', payload: profile })
    dispatch({
      type: 'SET_USER',
      payload: { id: 'demo-user-1', name: form.name, email: 'demo@bulkmate.app' }
    })
    onComplete()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8"
         style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md animate-fade-in">

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
                style={{
                  background: i <= step ? '#22c55e' : 'var(--bg-secondary)',
                  color: i <= step ? 'white' : 'var(--text-muted)',
                  transform: i === step ? 'scale(1.15)' : 'scale(1)',
                  boxShadow: i === step ? '0 4px 12px rgba(34,197,94,0.4)' : 'none',
                }}>
                {i < step ? <CheckCircle size={14} /> : s.icon}
              </div>
              {i < steps.length - 1 && (
                <div className="w-8 h-0.5 rounded-full transition-all duration-300"
                     style={{ background: i < step ? '#22c55e' : 'var(--border-color)' }} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="card p-6">

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center animate-fade-in">
              <div className="w-20 h-20 rounded-3xl gradient-green flex items-center justify-center mx-auto mb-6"
                   style={{ boxShadow: '0 8px 32px rgba(34,197,94,0.45)' }}>
                <Zap size={38} color="white" />
              </div>
              <h1 className="text-2xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>
                Selamat Datang di BulkMate! 💪
              </h1>
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
                Asisten personal untuk membantu kamu menaikkan berat badan secara sehat.
                Isi data diri dulu agar kami bisa menghitung kebutuhan kalori yang tepat untukmu.
              </p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { emoji: '🔥', label: 'Kalkulator Kalori', desc: 'Otomatis' },
                  { emoji: '🤖', label: 'AI Meal Planner', desc: 'Gemini AI' },
                  { emoji: '📊', label: 'Progress Tracker', desc: 'Real-time' },
                ].map(f => (
                  <div key={f.label} className="p-3 rounded-xl text-center"
                       style={{ background: 'var(--bg-secondary)' }}>
                    <div className="text-2xl mb-1">{f.emoji}</div>
                    <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{f.label}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Data Diri */}
          {step === 1 && (
            <div className="animate-fade-in space-y-4">
              <div className="text-center mb-4">
                <div className="text-3xl mb-2">👤</div>
                <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Data Diri</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Digunakan untuk menghitung BMR & kebutuhan nutrisi</p>
              </div>
              <div>
                <label className="label">Nama Panggilan</label>
                <input type="text" className="input-field" placeholder="Contoh: Andi"
                  value={form.name} onChange={e => update('name', e.target.value)} autoFocus />
              </div>
              <div>
                <label className="label">Jenis Kelamin</label>
                <div className="grid grid-cols-2 gap-3">
                  {[{ val: 'male', label: '👨 Laki-laki' }, { val: 'female', label: '👩 Perempuan' }].map(g => (
                    <button key={g.val} onClick={() => update('gender', g.val)}
                      className="py-3 rounded-xl border text-sm font-semibold transition-all"
                      style={{
                        background: form.gender === g.val ? 'rgba(34,197,94,0.08)' : 'var(--bg-secondary)',
                        borderColor: form.gender === g.val ? '#22c55e' : 'var(--border-color)',
                        color: form.gender === g.val ? '#22c55e' : 'var(--text-secondary)',
                      }}>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Umur</label>
                  <input type="number" className="input-field" placeholder="21" min={15} max={60}
                    value={form.age} onChange={e => update('age', e.target.value)} />
                </div>
                <div>
                  <label className="label">BB (kg)</label>
                  <input type="number" className="input-field" placeholder="58" min={30} max={200} step={0.1}
                    value={form.weight} onChange={e => update('weight', e.target.value)} />
                </div>
                <div>
                  <label className="label">TB (cm)</label>
                  <input type="number" className="input-field" placeholder="170" min={140} max={220}
                    value={form.height} onChange={e => update('height', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Aktivitas */}
          {step === 2 && (
            <div className="animate-fade-in space-y-4">
              <div className="text-center mb-4">
                <div className="text-3xl mb-2">🏃</div>
                <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Tingkat Aktivitas</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Berapa sering kamu berolahraga per minggu?</p>
              </div>
              <div className="space-y-2">
                {Object.entries(ACTIVITY_LEVELS).map(([key, act]) => (
                  <button key={key} onClick={() => update('activity_level', key)}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all"
                    style={{
                      background: form.activity_level === key ? 'rgba(34,197,94,0.08)' : 'var(--bg-secondary)',
                      borderColor: form.activity_level === key ? '#22c55e' : 'var(--border-color)',
                    }}>
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                         style={{ borderColor: form.activity_level === key ? '#22c55e' : 'var(--border-color)' }}>
                      {form.activity_level === key && (
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{act.label}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Multiplier: ×{act.multiplier}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Target */}
          {step === 3 && (
            <div className="animate-fade-in space-y-4">
              <div className="text-center mb-4">
                <div className="text-3xl mb-2">🎯</div>
                <h2 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Target Bulking</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Berapa berat badan yang ingin kamu capai?</p>
              </div>
              <div>
                <label className="label">Target Berat Badan (kg)</label>
                <input type="number" className="input-field" placeholder="68" min={30} max={200} step={0.1}
                  value={form.target_weight} onChange={e => update('target_weight', e.target.value)} autoFocus />
              </div>
              <div>
                <label className="label">Tipe Bulking</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 250, emoji: '🥗', label: 'Clean', desc: '+250 kcal' },
                    { val: 500, emoji: '🍗', label: 'Lean', desc: '+500 kcal' },
                    { val: 750, emoji: '🍔', label: 'Dirty', desc: '+750 kcal' },
                  ].map(opt => (
                    <button key={opt.val} onClick={() => update('surplus', opt.val)}
                      className="py-3 rounded-xl border text-center transition-all"
                      style={{
                        background: form.surplus === opt.val ? 'rgba(34,197,94,0.08)' : 'var(--bg-secondary)',
                        borderColor: form.surplus === opt.val ? '#22c55e' : 'var(--border-color)',
                      }}>
                      <div className="text-xl mb-0.5">{opt.emoji}</div>
                      <div className="text-xs font-bold" style={{ color: form.surplus === opt.val ? '#22c55e' : 'var(--text-primary)' }}>
                        {opt.label}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculated preview */}
              {bmr > 0 && (
                <div className="rounded-2xl p-4"
                     style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.04))', border: '1px solid rgba(34,197,94,0.15)' }}>
                  <div className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: '#22c55e' }}>
                    ✨ Hasil Kalkulasi Untukmu
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Target Kalori', value: `${calorieTarget} kcal`, color: '#22c55e' },
                      { label: 'Target Protein', value: `${proteinTarget}g/hari`, color: '#3b82f6' },
                      { label: 'BMR', value: `${bmr} kcal`, color: '#f97316' },
                      { label: 'TDEE', value: `${tdee} kcal`, color: '#a855f7' },
                    ].map(t => (
                      <div key={t.label} className="text-center">
                        <div className="font-black text-lg" style={{ color: t.color }}>{t.value}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Done */}
          {step === 4 && (
            <div className="text-center animate-fade-in">
              <div className="w-20 h-20 rounded-3xl gradient-green flex items-center justify-center mx-auto mb-6"
                   style={{ boxShadow: '0 8px 32px rgba(34,197,94,0.45)' }}>
                <CheckCircle size={38} color="white" />
              </div>
              <h2 className="text-2xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>
                Siap Bulking, {form.name}! 🎉
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                Target kalorimu sudah disiapkan. Mari mulai perjalanan bulkingmu!
              </p>
              <div className="rounded-2xl p-4 mb-6 text-left"
                   style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: '⚡ Target Kalori', value: `${calorieTarget} kcal/hari` },
                    { label: '💪 Target Protein', value: `${proteinTarget}g/hari` },
                    { label: '⚖️ Berat Sekarang', value: `${form.weight} kg` },
                    { label: '🎯 Target Berat', value: `${form.target_weight} kg` },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</div>
                      <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="btn-secondary flex items-center gap-2 px-4">
                <ChevronLeft size={16} />
                Kembali
              </button>
            )}

            {step < 4 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext()}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
                style={{ opacity: canNext() ? 1 : 0.5 }}>
                {step === 0 ? 'Mulai Setup' : 'Lanjut'}
                <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={handleFinish}
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-3">
                <Zap size={18} />
                Mulai BulkMate!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
