import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { estimateTimeToTarget } from '../utils/helpers'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Target, TrendingUp, Calendar, Zap } from 'lucide-react'

export default function WeightPredictor() {
  const { state } = useApp()
  const { profile, weightLogs } = state

  const latestWeight = weightLogs.length > 0
    ? weightLogs[weightLogs.length - 1].weight
    : (profile?.weight || 60)

  const [currentWeight, setCurrentWeight] = useState(latestWeight)
  const [targetWeight, setTargetWeight] = useState(profile?.target_weight || latestWeight + 10)
  const [dailySurplus, setDailySurplus] = useState(profile?.surplus || 500)

  const daysNeeded = useMemo(() =>
    estimateTimeToTarget(currentWeight, targetWeight, dailySurplus),
    [currentWeight, targetWeight, dailySurplus]
  )

  const weeksNeeded = Math.ceil(daysNeeded / 7)
  const monthsNeeded = (daysNeeded / 30).toFixed(1)
  const weeklyGain = (dailySurplus * 7 / 7700).toFixed(2)
  const monthlyGain = (dailySurplus * 30 / 7700).toFixed(2)

  // Target date
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + daysNeeded)
  const targetDateStr = targetDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })

  // Prediction chart data
  const chartData = useMemo(() => {
    const data = []
    const weeklyGainNum = dailySurplus * 7 / 7700
    const totalWeeks = Math.ceil(daysNeeded / 7)
    const displayWeeks = Math.min(totalWeeks, 52)

    for (let week = 0; week <= displayWeeks; week++) {
      const predictedWeight = Math.min(
        currentWeight + (week * weeklyGainNum),
        targetWeight
      )
      const date = new Date()
      date.setDate(date.getDate() + week * 7)
      data.push({
        week: `M${week}`,
        weight: parseFloat(predictedWeight.toFixed(1)),
        target: targetWeight,
      })
    }
    return data
  }, [currentWeight, targetWeight, dailySurplus, daysNeeded])

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="px-3 py-2 rounded-xl shadow-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
          <div className="font-bold" style={{ color: '#22c55e' }}>{payload[0]?.value} kg</div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h1 className="section-title text-xl">Prediksi Target Berat</h1>
        <p className="section-subtitle">Estimasi waktu mencapai berat badan idealmu</p>
      </div>

      {/* Input Form */}
      <div className="card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label">Berat Sekarang (kg)</label>
            <input type="number" className="input-field" step={0.1} min={30} max={300}
              value={currentWeight} onChange={e => setCurrentWeight(Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Target Berat (kg)</label>
            <input type="number" className="input-field" step={0.1} min={30} max={300}
              value={targetWeight} onChange={e => setTargetWeight(Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Surplus Kalori/Hari</label>
            <div className="flex gap-2">
              {[250, 500, 750].map(s => (
                <button key={s} onClick={() => setDailySurplus(s)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold border transition-all"
                  style={{
                    background: dailySurplus === s ? 'rgba(34,197,94,0.08)' : 'var(--bg-secondary)',
                    borderColor: dailySurplus === s ? '#22c55e' : 'var(--border-color)',
                    color: dailySurplus === s ? '#22c55e' : 'var(--text-secondary)',
                  }}>
                  +{s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {targetWeight > currentWeight ? (
        <>
          {/* Main result card */}
          <div className="rounded-2xl p-6 text-white"
               style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', boxShadow: '0 8px 32px rgba(34,197,94,0.35)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Target size={20} />
              <span className="font-semibold">Estimasi Pencapaian Target</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-4xl font-black">{daysNeeded}</div>
                <div className="text-green-200">hari</div>
              </div>
              <div>
                <div className="text-4xl font-black">{monthsNeeded}</div>
                <div className="text-green-200">bulan</div>
              </div>
            </div>
            <div className="mt-4 py-3 px-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <div className="text-sm text-green-100">🎯 Perkiraan tercapai pada:</div>
              <div className="font-bold text-base mt-1">{targetDateStr}</div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Perlu Naik', value: `${(targetWeight - currentWeight).toFixed(1)} kg`, icon: '⚖️', color: '#22c55e' },
              { label: 'Per Minggu', value: `+${weeklyGain} kg`, icon: '📅', color: '#3b82f6' },
              { label: 'Per Bulan', value: `+${monthlyGain} kg`, icon: '🗓️', color: '#a855f7' },
              { label: 'Hari Tersisa', value: `${daysNeeded} hari`, icon: '⏰', color: '#f97316' },
            ].map((s, i) => (
              <div key={i} className="stat-card text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-lg font-black" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Prediction Chart */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} color="#22c55e" />
              <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Grafik Prediksi</h2>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData.filter((_, i) => i % Math.max(1, Math.floor(chartData.length / 10)) === 0 || i === chartData.length - 1)}
                         margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="predGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis domain={[currentWeight - 1, targetWeight + 1]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={targetWeight} stroke="#3b82f6" strokeDasharray="5 5"
                  label={{ value: `Target ${targetWeight}kg`, fontSize: 10, fill: '#3b82f6' }} />
                <Area type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={2.5}
                  fill="url(#predGradient)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Tips */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={18} color="#f97316" />
              <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Tips Bulking Efektif</h3>
            </div>
            <div className="space-y-2">
              {[
                '🥩 Konsumsi protein 1.8-2.2g per kg berat badan setiap hari',
                '🏋️ Latihan beban minimal 3x seminggu untuk maximize muscle gain',
                '😴 Tidur 7-9 jam per malam untuk recovery dan pertumbuhan otot',
                '📈 Surplus 500 kcal adalah sweet spot untuk lean bulk',
                '💧 Minum 3-4 liter air per hari untuk mendukung metabolisme',
                '📊 Ukur berat badan di waktu yang sama setiap hari (pagi setelah bangun)',
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="card empty-state p-12">
          <div className="empty-state-icon">🎯</div>
          <div className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
            Target berat harus lebih tinggi dari berat sekarang
          </div>
        </div>
      )}
    </div>
  )
}
