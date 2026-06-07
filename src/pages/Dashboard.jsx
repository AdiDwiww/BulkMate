import { useApp } from '../context/AppContext'
import { calculateTotals, getGreeting, formatDate, MEAL_TYPES, getProgressColor } from '../utils/helpers'
import { TrendingUp, Flame, Dumbbell, Droplets, Scale, Plus, ChevronRight, Zap, Award } from 'lucide-react'

// Circular Progress Component
function CircularProgress({ value, max, size = 100, strokeWidth = 10, color = '#22c55e', label, sublabel }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const percentage = Math.min((value / max) * 100, 100)
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-bold" style={{ fontSize: size * 0.15, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {Math.round(value)}
          </span>
          {sublabel && (
            <span className="text-center" style={{ fontSize: size * 0.1, color: 'var(--text-muted)', lineHeight: 1.2 }}>
              {sublabel}
            </span>
          )}
        </div>
      </div>
      {label && (
        <div className="text-center">
          <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{label}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>dari {Math.round(max)}</div>
        </div>
      )}
    </div>
  )
}

// Macro card component
function MacroCard({ label, current, target, unit, color, emoji }) {
  const pct = Math.min((current / target) * 100, 100)
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        </div>
        <span className="badge" style={{ background: `${color}15`, color }}>
          {Math.round(pct)}%
        </span>
      </div>
      <div className="flex items-end gap-1 mb-3">
        <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{Math.round(current)}</span>
        <span className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>/ {Math.round(target)}{unit}</span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}cc, ${color})` }}
        />
      </div>
    </div>
  )
}

export default function Dashboard({ onPageChange }) {
  const { state } = useApp()
  const { dailyLogs, profile, nutritionTarget, weightLogs, currentDate } = state

  const todayLogs = dailyLogs.filter(l => l.date === currentDate)
  const totals = calculateTotals(dailyLogs, currentDate)

  const target = nutritionTarget || profile || {}
  const calorieTarget = target.daily_calorie_target || 2800
  const proteinTarget = target.protein_target || 140
  const carbTarget = target.carb_target || 350
  const fatTarget = target.fat_target || 90

  const calorieProgress = (totals.calories / calorieTarget) * 100
  const remaining = calorieTarget - totals.calories

  // Last weight
  const lastWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : (profile?.weight || 0)
  const prevWeight = weightLogs.length > 1 ? weightLogs[weightLogs.length - 2].weight : lastWeight
  const weightChange = lastWeight - prevWeight

  // Weekly average weight change
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const recentWeights = weightLogs.filter(w => new Date(w.date) >= weekAgo)
  const weeklyGain = recentWeights.length >= 2
    ? recentWeights[recentWeights.length - 1].weight - recentWeights[0].weight
    : 0

  const mealGroups = {
    breakfast: todayLogs.filter(l => l.meal_type === 'breakfast'),
    lunch: todayLogs.filter(l => l.meal_type === 'lunch'),
    dinner: todayLogs.filter(l => l.meal_type === 'dinner'),
    snack: todayLogs.filter(l => l.meal_type === 'snack'),
  }

  const bgCard = 'var(--bg-card)'
  const border = 'var(--border-color)'

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {getGreeting()}, {profile?.name?.split(' ')[0] || 'Sobat'}! 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {formatDate(currentDate)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {calorieProgress >= 80 && calorieProgress <= 110 && (
            <div className="badge badge-green">
              <Award size={11} />
              On Track
            </div>
          )}
          {calorieProgress < 50 && (
            <div className="badge badge-orange">
              <Flame size={11} />
              Perlu Makan!
            </div>
          )}
        </div>
      </div>

      {/* Main Calorie Card */}
      <div className="rounded-2xl p-6 text-white relative overflow-hidden"
           style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)', boxShadow: '0 8px 32px rgba(34,197,94,0.35)' }}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
             style={{ background: 'white', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10"
             style={{ background: 'white', transform: 'translate(-30%, 30%)' }} />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Flame size={20} />
            <span className="font-semibold text-green-100">Kalori Hari Ini</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-5xl font-black mb-1">
                {Math.round(totals.calories).toLocaleString('id-ID')}
              </div>
              <div className="text-green-200 text-sm">dari {calorieTarget.toLocaleString('id-ID')} kcal target</div>
              <div className="mt-3 flex items-center gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold">{Math.max(0, Math.round(remaining)).toLocaleString('id-ID')}</div>
                  <div className="text-xs text-green-200">Sisa</div>
                </div>
                <div className="h-8 w-px bg-white/20" />
                <div className="text-center">
                  <div className="text-xl font-bold">{Math.round(calorieProgress)}%</div>
                  <div className="text-xs text-green-200">Progress</div>
                </div>
                <div className="h-8 w-px bg-white/20" />
                <div className="text-center">
                  <div className="text-xl font-bold">{todayLogs.length}</div>
                  <div className="text-xs text-green-200">Log Makanan</div>
                </div>
              </div>
            </div>
            
            <CircularProgress
              value={totals.calories}
              max={calorieTarget}
              size={110}
              strokeWidth={10}
              color="white"
              label=""
            />
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-white transition-all duration-700"
                style={{ width: `${Math.min(calorieProgress, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Macros Grid */}
      <div className="grid grid-cols-3 gap-3">
        <MacroCard label="Protein" current={totals.protein} target={proteinTarget} unit="g" color="#3b82f6" emoji="💪" />
        <MacroCard label="Karbo" current={totals.carbs} target={carbTarget} unit="g" color="#f97316" emoji="🌾" />
        <MacroCard label="Lemak" current={totals.fat} target={fatTarget} unit="g" color="#a855f7" emoji="🥑" />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Weight */}
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl gradient-blue flex items-center justify-center flex-shrink-0"
               style={{ boxShadow: '0 4px 12px rgba(59,130,246,0.35)' }}>
            <Scale size={22} color="white" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Berat Terakhir</div>
            <div className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{lastWeight} <span className="text-sm font-normal">kg</span></div>
            {weightChange !== 0 && (
              <div className={`text-xs font-semibold ${weightChange > 0 ? 'text-green-500' : 'text-red-400'}`}>
                {weightChange > 0 ? '↑' : '↓'} {Math.abs(weightChange).toFixed(1)} kg
              </div>
            )}
          </div>
        </div>

        {/* Weekly gain */}
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl gradient-purple flex items-center justify-center flex-shrink-0"
               style={{ boxShadow: '0 4px 12px rgba(168,85,247,0.35)' }}>
            <TrendingUp size={22} color="white" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Naik Minggu Ini</div>
            <div className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
              {weeklyGain >= 0 ? '+' : ''}{weeklyGain.toFixed(2)} <span className="text-sm font-normal">kg</span>
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Target: +{((target.surplus || 500) / 7700 * 7).toFixed(2)} kg
            </div>
          </div>
        </div>
      </div>

      {/* Today's Meals Summary */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="section-title text-base">Ringkasan Hari Ini</div>
            <div className="section-subtitle">Makanan yang sudah dikonsumsi</div>
          </div>
          <button onClick={() => onPageChange('food-tracker')} className="btn-primary text-xs px-3 py-2 flex items-center gap-1">
            <Plus size={14} />
            Tambah
          </button>
        </div>

        <div className="space-y-3">
          {Object.entries(mealGroups).map(([type, logs]) => {
            const mealInfo = MEAL_TYPES[type]
            const mealCals = logs.reduce((s, l) => s + (l.calories || 0), 0)
            if (logs.length === 0) return null
            return (
              <div key={type}>
                <div className="flex items-center justify-between py-2 px-3 rounded-xl"
                     style={{ background: 'var(--bg-secondary)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{mealInfo.emoji}</span>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{mealInfo.label}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{logs.length} item</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm" style={{ color: mealInfo.color }}>{Math.round(mealCals)} kcal</span>
                  </div>
                </div>
              </div>
            )
          })}

          {todayLogs.length === 0 && (
            <div className="empty-state py-8">
              <div className="empty-state-icon">🍽️</div>
              <div className="font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Belum ada log makanan</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Mulai catat makanan pertamamu hari ini!</div>
            </div>
          )}
        </div>
      </div>

      {/* Smart Recommendation */}
      {remaining > 200 && (
        <div className="rounded-2xl p-5"
             style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0.04) 100%)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg gradient-blue flex items-center justify-center">
              <Zap size={16} color="white" />
            </div>
            <div>
              <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Rekomendasi Bulking</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Masih kurang {Math.round(remaining)} kcal lagi</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: '🥛 2 gelas susu', cal: 336 },
              { label: '🍌 2 pisang', cal: 214 },
              { label: '🍞 4 roti', cal: 318 },
            ].filter(item => item.cal <= remaining + 100).map(item => (
              <div key={item.label} className="badge badge-blue">
                {item.label} <span className="opacity-70">+{item.cal}kcal</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Target Progress */}
      {profile?.target_weight && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="section-title text-base">Progress Berat Badan</div>
              <div className="section-subtitle">{lastWeight} kg → {profile.target_weight} kg</div>
            </div>
            <button onClick={() => onPageChange('weight-tracker')} className="text-xs text-green-500 flex items-center gap-1 font-semibold">
              Detail <ChevronRight size={14} />
            </button>
          </div>
          
          <div className="relative mb-2">
            <div className="progress-bar" style={{ height: '12px' }}>
              <div
                className="progress-fill gradient-green"
                style={{
                  width: `${Math.min(((lastWeight - (profile.weight || lastWeight)) / ((profile.target_weight || lastWeight + 10) - (profile.weight || lastWeight))) * 100, 100)}%`
                }}
              />
            </div>
          </div>
          <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>Mulai: {profile.weight || lastWeight} kg</span>
            <span>Target: {profile.target_weight} kg</span>
          </div>
        </div>
      )}
    </div>
  )
}
