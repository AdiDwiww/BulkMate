import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { calculateTotals, BULKING_FOODS } from '../utils/helpers'
import { Brain, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Zap, Info } from 'lucide-react'

export default function NutritionWarning() {
  const { state } = useApp()
  const { dailyLogs, nutritionTarget, profile, weightLogs } = state

  const target = nutritionTarget || profile || {}
  const calorieTarget = target.daily_calorie_target || 2800
  const proteinTarget = target.protein_target || 140
  const fatTarget = target.fat_target || 90

  const today = new Date().toISOString().split('T')[0]
  const totals = calculateTotals(dailyLogs, today)

  // Last 7 days analysis
  const warnings = useMemo(() => {
    const issues = []

    // Today's issues
    const calPct = (totals.calories / calorieTarget) * 100
    const proteinPct = (totals.protein / proteinTarget) * 100
    const fatPct = (totals.fat / fatTarget) * 100

    if (calPct < 50) {
      issues.push({
        type: 'error',
        icon: '🔥',
        title: 'Kalori Hari Ini Sangat Kurang!',
        desc: `Baru ${Math.round(totals.calories)} kcal dari target ${calorieTarget} kcal. Kurang ${Math.round(calorieTarget - totals.calories)} kcal lagi.`,
        action: 'Tambah makan segera!',
        severity: 'high',
      })
    } else if (calPct < 80) {
      issues.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Kalori Hari Ini Masih Kurang',
        desc: `Sudah ${Math.round(calPct)}% dari target. Masih kurang ${Math.round(calorieTarget - totals.calories)} kcal.`,
        action: 'Tambah 1-2 porsi makan lagi',
        severity: 'medium',
      })
    } else if (calPct > 120) {
      issues.push({
        type: 'info',
        icon: '📊',
        title: 'Kalori Melebihi Target',
        desc: `Sudah ${Math.round(totals.calories)} kcal, melebihi target ${calorieTarget} kcal. Excess ${Math.round(totals.calories - calorieTarget)} kcal.`,
        action: 'Kurangi porsi makan berikutnya',
        severity: 'low',
      })
    }

    if (proteinPct < 60) {
      issues.push({
        type: 'error',
        icon: '💪',
        title: 'Protein Sangat Rendah',
        desc: `Hanya ${Math.round(totals.protein)}g protein dari target ${proteinTarget}g. Ini akan menghambat pertumbuhan otot.`,
        action: 'Tambah sumber protein: ayam, telur, tempe',
        severity: 'high',
      })
    } else if (proteinPct < 80) {
      issues.push({
        type: 'warning',
        icon: '🥩',
        title: 'Protein Masih Kurang',
        desc: `Sudah ${Math.round(totals.protein)}g dari ${proteinTarget}g target. Masih kurang ${Math.round(proteinTarget - totals.protein)}g protein.`,
        action: 'Tambah 2 butir telur atau 100g ayam',
        severity: 'medium',
      })
    }

    if (fatPct > 140) {
      issues.push({
        type: 'warning',
        icon: '🧈',
        title: 'Konsumsi Lemak Berlebihan',
        desc: `Lemak hari ini ${Math.round(totals.fat)}g, melebihi target ${fatTarget}g. Terlalu banyak lemak bisa memperlambat pencernaan.`,
        action: 'Pilih metode masak yang lebih sehat',
        severity: 'medium',
      })
    }

    // 7-day protein analysis
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayTotals = calculateTotals(dailyLogs, dateStr)
      last7Days.push(dayTotals)
    }

    const avgProtein7 = last7Days.reduce((s, d) => s + d.protein, 0) / 7
    const avgCal7 = last7Days.reduce((s, d) => s + d.calories, 0) / 7
    const lowProteinDays = last7Days.filter(d => d.protein < proteinTarget * 0.7).length

    if (lowProteinDays >= 4) {
      issues.push({
        type: 'error',
        icon: '📅',
        title: 'Protein Rendah Selama 7 Hari',
        desc: `${lowProteinDays} dari 7 hari terakhir, konsumsi protein di bawah 70% target. Rata-rata hanya ${Math.round(avgProtein7)}g/hari.`,
        action: 'Prioritaskan sumber protein di setiap makan',
        severity: 'high',
      })
    }

    if (avgCal7 < calorieTarget * 0.7) {
      issues.push({
        type: 'warning',
        icon: '📉',
        title: 'Rata-rata Kalori Minggu Ini Rendah',
        desc: `Rata-rata kalori 7 hari: ${Math.round(avgCal7)} kcal. Jauh di bawah target ${calorieTarget} kcal/hari.`,
        action: 'Pertimbangkan menambahkan snack bergizi',
        severity: 'medium',
      })
    }

    // Weight gain check
    if (weightLogs.length >= 7) {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const recentLogs = weightLogs.filter(w => new Date(w.date) >= weekAgo)
      if (recentLogs.length >= 2) {
        const weightGain = recentLogs[recentLogs.length - 1].weight - recentLogs[0].weight
        if (weightGain < 0.1) {
          issues.push({
            type: 'warning',
            icon: '⚖️',
            title: 'Berat Badan Tidak Naik',
            desc: `Berat badan minggu ini hanya naik ${weightGain.toFixed(2)} kg. Surplus kalori mungkin perlu ditingkatkan.`,
            action: 'Coba tambah 200-300 kcal dari target saat ini',
            severity: 'medium',
          })
        }
      }
    }

    if (issues.length === 0) {
      issues.push({
        type: 'success',
        icon: '🎉',
        title: 'Nutrisi Hari Ini On Track!',
        desc: `Kalori: ${Math.round(totals.calories)} kcal (${Math.round(calPct)}%), Protein: ${Math.round(totals.protein)}g (${Math.round(proteinPct)}%). Pertahankan!`,
        action: null,
        severity: 'none',
      })
    }

    return issues
  }, [dailyLogs, totals, calorieTarget, proteinTarget, fatTarget, weightLogs])

  // Smart recommendations
  const remaining = calorieTarget - totals.calories
  const proteinRemaining = proteinTarget - totals.protein

  const getWarningStyle = (type) => {
    switch (type) {
      case 'error': return { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', color: '#ef4444', iconBg: 'rgba(239,68,68,0.1)' }
      case 'warning': return { bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)', color: '#f97316', iconBg: 'rgba(249,115,22,0.1)' }
      case 'info': return { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', color: '#3b82f6', iconBg: 'rgba(59,130,246,0.1)' }
      case 'success': return { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', color: '#22c55e', iconBg: 'rgba(34,197,94,0.1)' }
      default: return {}
    }
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div>
        <h1 className="section-title text-xl">Smart Nutrition Warning</h1>
        <p className="section-subtitle">AI menganalisis pola makan dan memberikan peringatan</p>
      </div>

      {/* Today's Quick Stats */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain size={20} color="#a855f7" />
          <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Analisis Hari Ini</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: 'Kalori', pct: Math.round((totals.calories / calorieTarget) * 100),
              current: Math.round(totals.calories), target: calorieTarget, unit: 'kcal', color: '#22c55e'
            },
            {
              label: 'Protein', pct: Math.round((totals.protein / proteinTarget) * 100),
              current: Math.round(totals.protein), target: proteinTarget, unit: 'g', color: '#3b82f6'
            },
          ].map(m => (
            <div key={m.label} className="p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{m.label}</span>
                <span className="text-xs font-bold" style={{ color: m.pct >= 80 ? m.color : '#f97316' }}>
                  {m.pct}%
                </span>
              </div>
              <div className="font-black" style={{ color: m.pct >= 80 ? m.color : 'var(--text-primary)' }}>
                {m.current}<span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>/{m.target}{m.unit}</span>
              </div>
              <div className="progress-bar mt-2">
                <div className="progress-fill"
                     style={{ width: `${Math.min(m.pct, 100)}%`, background: m.pct >= 80 ? m.color : '#f97316' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Warnings List */}
      <div className="space-y-3">
        {warnings.map((w, i) => {
          const style = getWarningStyle(w.type)
          return (
            <div key={i} className="rounded-2xl p-4 animate-slide-up"
                 style={{ background: style.bg, border: `1px solid ${style.border}`, animationDelay: `${i * 80}ms` }}>
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">{w.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{w.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{w.desc}</div>
                  {w.action && (
                    <div className="mt-2 text-xs font-semibold flex items-center gap-1" style={{ color: style.color }}>
                      <Zap size={11} />
                      {w.action}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Smart Bulk Recommendations */}
      {remaining > 200 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl gradient-green flex items-center justify-center">
              <Zap size={18} color="white" />
            </div>
            <div>
              <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Smart Bulk Recommendation</h2>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Masih kurang {Math.round(remaining)} kcal & {Math.round(proteinRemaining > 0 ? proteinRemaining : 0)}g protein
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {BULKING_FOODS
              .filter(f => f.calories <= remaining + 100)
              .slice(0, 5)
              .map((food, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 px-4 rounded-xl"
                   style={{ background: 'var(--bg-secondary)' }}>
                <div>
                  <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{food.name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>P: {food.protein}g</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-green-500">+{food.calories} kcal</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips based on patterns */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info size={18} color="#3b82f6" />
          <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Tips Bulking Hari Ini</h2>
        </div>
        <div className="space-y-3">
          {[
            { icon: '🥩', tip: 'Makan protein di setiap waktu makan - target 30-40g per sesi', color: '#3b82f6' },
            { icon: '⏰', tip: 'Makan setiap 3-4 jam untuk menjaga anabolisme', color: '#22c55e' },
            { icon: '🥤', tip: 'Minum susu atau protein shake sebelum tidur untuk nocturnal protein', color: '#a855f7' },
            { icon: '🏋️', tip: 'Progressive overload di gym untuk memastikan kalori masuk ke otot, bukan lemak', color: '#f97316' },
          ].map((t, i) => (
            <div key={i} className="flex items-start gap-3 py-2 px-3 rounded-xl"
                 style={{ background: `${t.color}08` }}>
              <span className="text-lg flex-shrink-0">{t.icon}</span>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
