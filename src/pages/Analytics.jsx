import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { calculateTotals, formatDateShort, formatCurrency } from '../utils/helpers'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { BarChart3, TrendingUp, Download, Flame, Dumbbell, Scale, Wallet, CalendarDays, PieChartIcon } from 'lucide-react'

export default function Analytics() {
  const { state } = useApp()
  const { dailyLogs, weightLogs, expenses, nutritionTarget, profile } = state
  const [exportLoading, setExportLoading] = useState(false)

  const target = nutritionTarget || profile || {}
  const calorieTarget = target.daily_calorie_target || 2800
  const proteinTarget = target.protein_target || 140

  // Last 14 days data
  const last14Days = useMemo(() => {
    const data = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const t = calculateTotals(dailyLogs, dateStr)
      const weight = weightLogs.find(w => w.date === dateStr)?.weight || null
      const expense = expenses.filter(e => e.date === dateStr).reduce((s, e) => s + Number(e.amount), 0)
      data.push({
        date: formatDateShort(dateStr),
        calories: Math.round(t.calories),
        protein: parseFloat(t.protein.toFixed(1)),
        carbs: parseFloat(t.carbs.toFixed(1)),
        fat: parseFloat(t.fat.toFixed(1)),
        weight,
        expense,
        calTarget: calorieTarget,
        proteinTarget: proteinTarget,
      })
    }
    return data
  }, [dailyLogs, weightLogs, expenses, calorieTarget, proteinTarget])

  // Averages
  const daysWithData = last14Days.filter(d => d.calories > 0)
  const avgCalories = daysWithData.length > 0
    ? Math.round(daysWithData.reduce((s, d) => s + d.calories, 0) / daysWithData.length)
    : 0
  const avgProtein = daysWithData.length > 0
    ? (daysWithData.reduce((s, d) => s + d.protein, 0) / daysWithData.length).toFixed(1)
    : 0

  const weightData = weightLogs.slice(-14).map(w => ({
    date: formatDateShort(w.date),
    weight: w.weight,
  }))

  const latestWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : (profile?.weight || 0)
  const firstWeight = weightLogs.length > 0 ? weightLogs[0].weight : latestWeight
  const totalGain = (latestWeight - firstWeight).toFixed(1)

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const monthExpenses = expenses.filter(e => {
    const m = new Date()
    m.setDate(1)
    return new Date(e.date) >= m
  }).reduce((s, e) => s + Number(e.amount), 0)

  // Consistency score
  const loggedDays = last14Days.filter(d => d.calories > 0).length
  const consistency = Math.round((loggedDays / 14) * 100)

  // Macro pie chart data
  const today = new Date().toISOString().split('T')[0]
  const todayTotals = calculateTotals(dailyLogs, today)
  const pieMacroData = [
    { name: 'Protein', value: Math.round(todayTotals.protein * 4), color: '#3b82f6' },
    { name: 'Karbo', value: Math.round(todayTotals.carbs * 4), color: '#f97316' },
    { name: 'Lemak', value: Math.round(todayTotals.fat * 9), color: '#a855f7' },
  ].filter(d => d.value > 0)

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div className="px-3 py-2 rounded-xl shadow-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', fontSize: '12px' }}>
          <div style={{ color: 'var(--text-muted)' }}>{label}</div>
          {payload.map(p => (
            <div key={p.name} style={{ color: p.color, fontWeight: 600 }}>
              {p.name}: {p.value}
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  const handleExportPDF = async () => {
    setExportLoading(true)
    setTimeout(() => {
      const content = `BULKMATE - LAPORAN BULKING\n\n` +
        `Nama: ${profile?.name || 'User'}\n` +
        `Periode: 14 hari terakhir\n\n` +
        `=== RINGKASAN ===\n` +
        `Rata-rata Kalori: ${avgCalories} kcal/hari\n` +
        `Rata-rata Protein: ${avgProtein} g/hari\n` +
        `Berat Awal: ${firstWeight} kg\n` +
        `Berat Sekarang: ${latestWeight} kg\n` +
        `Total Kenaikan: +${totalGain} kg\n` +
        `Konsistensi: ${consistency}%\n` +
        `Total Pengeluaran Makanan: ${formatCurrency(totalExpenses)}\n\n` +
        `=== LOG BERAT BADAN ===\n` +
        weightLogs.slice(-10).map(w => `${w.date}: ${w.weight} kg`).join('\n')

      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bulkmate-report-${today}.txt`
      a.click()
      setExportLoading(false)
    }, 1000)
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title text-xl">Analytics</h1>
          <p className="section-subtitle">Analisis mendalam progress bulkingmu</p>
        </div>
        <button onClick={handleExportPDF} disabled={exportLoading}
          className="btn-secondary flex items-center gap-2 text-sm px-3 py-2">
          <Download size={15} />
          Export
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { Icon: Flame,       label: 'Avg. Kalori/Hari',  value: `${avgCalories} kcal`, pct: Math.round((avgCalories/calorieTarget)*100), color: '#22c55e' },
          { Icon: Dumbbell,    label: 'Avg. Protein/Hari', value: `${avgProtein}g`,       pct: Math.round((Number(avgProtein)/proteinTarget)*100), color: '#3b82f6' },
          { Icon: Scale,       label: 'Total Kenaikan BB', value: `+${totalGain} kg`,     pct: 100, color: '#a855f7' },
          { Icon: CalendarDays,label: 'Konsistensi',       value: `${consistency}%`,      pct: consistency, color: '#f97316' },
        ].map((m, i) => (
          <div key={i} className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <m.Icon size={16} color={m.color} />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{m.label}</span>
            </div>
            <div className="font-black text-lg mb-2" style={{ color: m.color }}>{m.value}</div>
            <div className="progress-bar" style={{ height: '4px' }}>
              <div className="progress-fill" style={{ width: `${Math.min(m.pct, 100)}%`, background: m.color }} />
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{m.pct}%</div>
          </div>
        ))}
      </div>

      {/* Calorie Chart */}
      <div className="card p-5">
        <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><BarChart3 size={16} color="#22c55e" /> Kalori 14 Hari Terakhir</h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={last14Days} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
            <defs>
              <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} interval={1} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="calTarget" stroke="#ef4444" strokeDasharray="5 5"
              strokeWidth={1.5} dot={false} name="Target" />
            <Area type="monotone" dataKey="calories" stroke="#22c55e" strokeWidth={2}
              fill="url(#calGrad)" dot={false} name="Kalori" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Protein Chart */}
      <div className="card p-5">
        <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><Dumbbell size={16} color="#3b82f6" /> Protein 14 Hari Terakhir</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={last14Days} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} interval={1} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="protein" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Protein (g)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weight + Macro Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Weight chart */}
        <div className="card p-5">
          <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><Scale size={16} color="#a855f7" /> Berat Badan</h2>
          {weightData.length >= 2 ? (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={weightData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="weight" stroke="#a855f7" strokeWidth={2.5}
                  dot={{ fill: '#a855f7', r: 4 }} name="BB (kg)" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state h-40">
              <div className="empty-state-icon"><Scale size={28} color="var(--text-muted)" /></div>
              <div className="text-sm">Belum cukup data</div>
            </div>
          )}
        </div>

        {/* Macro pie */}
        <div className="card p-5">
          <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><PieChartIcon size={16} color="#f97316" /> Makro Hari Ini</h2>
          {pieMacroData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={pieMacroData} cx="50%" cy="50%" innerRadius={40} outerRadius={60}
                       dataKey="value" paddingAngle={3}>
                    {pieMacroData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {pieMacroData.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <div className="text-sm flex-1" style={{ color: 'var(--text-secondary)' }}>{d.name}</div>
                    <div className="text-sm font-bold" style={{ color: d.color }}>
                      {Math.round((d.value / pieMacroData.reduce((s, p) => s + p.value, 0)) * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state h-36">
              <div className="empty-state-icon"><PieChartIcon size={28} color="var(--text-muted)" /></div>
              <div className="text-sm">Belum ada data hari ini</div>
            </div>
          )}
        </div>
      </div>

      {/* Expense Chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><Wallet size={16} color="#f97316" /> Pengeluaran Makanan</h2>
          <div className="text-sm font-bold text-green-500">Total: {formatCurrency(monthExpenses)}/bulan</div>
        </div>
        {last14Days.some(d => d.expense > 0) ? (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={last14Days.filter(d => d.expense > 0)} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={v => `${v/1000}k`} />
              <Tooltip formatter={v => [formatCurrency(v), 'Pengeluaran']}
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }} />
              <Bar dataKey="expense" fill="#f97316" radius={[4, 4, 0, 0]} name="Pengeluaran" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state h-36">
            <div className="empty-state-icon"><Wallet size={28} color="var(--text-muted)" /></div>
            <div className="text-sm">Belum ada data pengeluaran</div>
          </div>
        )}
      </div>
    </div>
  )
}
