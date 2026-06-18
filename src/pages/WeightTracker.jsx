import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { formatDateShort } from '../utils/helpers'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart
} from 'recharts'
import { Scale, Plus, TrendingUp, TrendingDown, Calendar, X, CalendarDays, CalendarRange, BarChart2, Trash2 } from 'lucide-react'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="px-3 py-2 rounded-xl shadow-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
        <div className="text-lg font-black" style={{ color: '#22c55e' }}>{payload[0].value} kg</div>
      </div>
    )
  }
  return null
}

export default function WeightTracker() {
  const { state, dispatch } = useApp()
  const { weightLogs, profile } = state

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    weight: profile?.weight || '',
    date: new Date().toISOString().split('T')[0],
    note: '',
  })
  const [range, setRange] = useState('month') // week | month | year

  const handleAdd = () => {
    if (!form.weight) return
    dispatch({
      type: 'ADD_WEIGHT_LOG',
      payload: {
        weight: Number(form.weight),
        date: form.date,
        note: form.note,
      }
    })
    setShowModal(false)
    setForm(f => ({ ...f, weight: '', note: '' }))
  }

  // Filter logs based on range
  const now = new Date()
  const filtered = weightLogs.filter(w => {
    const d = new Date(w.date)
    if (range === 'week') {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return d >= weekAgo
    } else if (range === 'month') {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      return d >= monthAgo
    } else {
      const yearAgo = new Date()
      yearAgo.setFullYear(yearAgo.getFullYear() - 1)
      return d >= yearAgo
    }
  })

  const chartData = filtered.map(w => ({
    date: formatDateShort(w.date),
    weight: w.weight,
  }))

  // Stats
  const latestWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : (profile?.weight || 0)
  const startWeight = weightLogs.length > 0 ? weightLogs[0].weight : latestWeight
  const totalGain = latestWeight - startWeight

  // Weekly average
  const weekLogs = weightLogs.filter(w => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return new Date(w.date) >= weekAgo
  })
  const weekGain = weekLogs.length >= 2
    ? weekLogs[weekLogs.length - 1].weight - weekLogs[0].weight
    : 0

  // Monthly average
  const monthLogs = weightLogs.filter(w => {
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    return new Date(w.date) >= monthAgo
  })
  const monthGain = monthLogs.length >= 2
    ? monthLogs[monthLogs.length - 1].weight - monthLogs[0].weight
    : 0

  const yDomain = chartData.length > 0
    ? [Math.floor(Math.min(...chartData.map(d => d.weight)) - 1), Math.ceil(Math.max(...chartData.map(d => d.weight)) + 1)]
    : ['auto', 'auto']

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center justify-between">
        <div className="mobile-page-header">
          <h1 className="section-title text-xl">Berat Badan</h1>
          <p className="section-subtitle">Pantau progress berat badan bulkingmu</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 px-3 py-2">
          <Plus size={16} />
          <span className="hidden sm:inline">Catat BB</span>
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Berat Sekarang', value: `${latestWeight} kg`, color: '#22c55e', Icon: Scale },
          { label: 'Total Naik', value: `${totalGain >= 0 ? '+' : ''}${totalGain.toFixed(1)} kg`, color: totalGain >= 0 ? '#22c55e' : '#ef4444', Icon: totalGain >= 0 ? TrendingUp : TrendingDown },
          { label: 'Naik Minggu Ini', value: `${weekGain >= 0 ? '+' : ''}${weekGain.toFixed(2)} kg`, color: weekGain >= 0 ? '#3b82f6' : '#ef4444', Icon: CalendarDays },
          { label: 'Naik Bulan Ini', value: `${monthGain >= 0 ? '+' : ''}${monthGain.toFixed(2)} kg`, color: monthGain >= 0 ? '#a855f7' : '#ef4444', Icon: CalendarRange },
        ].map((stat, i) => (
          <div key={i} className="stat-card text-center">
            <div className="flex justify-center mb-1"><stat.Icon size={20} color={stat.color} /></div>
            <div className="text-xl font-black" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>Grafik Berat Badan</h2>
          <div className="tab-nav" style={{ padding: '3px' }}>
            {[
              { key: 'week', label: '7H' },
              { key: 'month', label: '1B' },
              { key: 'year', label: '1T' },
            ].map(r => (
              <button key={r.key} onClick={() => setRange(r.key)}
                className={`tab-btn px-3 py-1.5 text-xs ${range === r.key ? 'active' : ''}`}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {chartData.length >= 2 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis domain={yDomain} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip content={<CustomTooltip />} />
              {profile?.target_weight && (
                <ReferenceLine y={profile.target_weight} stroke="#3b82f6" strokeDasharray="5 5"
                  label={{ value: `Target ${profile.target_weight}kg`, fontSize: 10, fill: '#3b82f6' }} />
              )}
              <Area type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={2.5}
                fill="url(#weightGradient)" dot={{ fill: '#22c55e', r: 4 }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state h-52">
            <div className="empty-state-icon"><BarChart2 size={28} color="var(--text-muted)" /></div>
            <div className="font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Belum cukup data</div>
            <div className="text-sm">Catat minimal 2 data berat badan untuk melihat grafik</div>
          </div>
        )}
      </div>

      {/* History */}
      <div className="card p-5">
        <h2 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Riwayat Berat Badan</h2>
        {weightLogs.length > 0 ? (
          <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
            {[...weightLogs].reverse().map((log, i) => {
              const prev = [...weightLogs].reverse()[i + 1]
              const change = prev ? log.weight - prev.weight : 0
              return (
                <div key={log.id} className="flex items-center justify-between py-2.5 px-4 rounded-xl"
                     style={{ background: 'var(--bg-secondary)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl gradient-green flex items-center justify-center">
                      <Scale size={16} color="white" />
                    </div>
                    <div>
                      <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{log.weight} kg</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDateShort(log.date)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {change !== 0 && (
                      <span className={`text-sm font-bold ${change > 0 ? 'text-green-500' : 'text-red-400'}`}>
                        {change > 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)} kg
                      </span>
                    )}
                    <button onClick={() => dispatch({ type: 'DELETE_WEIGHT_LOG', payload: log.id })}
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="empty-state py-8">
            <div className="empty-state-icon"><Scale size={28} color="var(--text-muted)" /></div>
            <div className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Belum ada data berat badan</div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
              <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Catat Berat Badan</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'var(--bg-secondary)' }}>
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">Berat Badan</label>
                <div className="flex items-center gap-2">
                  <input type="number" className="input-field" placeholder="58.5" step={0.1} min={20} max={300}
                    value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} autoFocus />
                  <span className="text-sm flex-shrink-0" style={{ color: 'var(--text-muted)' }}>kg</span>
                </div>
              </div>
              <div>
                <label className="label">Tanggal</label>
                <input type="date" className="input-field" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className="label">Catatan (opsional)</label>
                <input type="text" className="input-field" placeholder="Contoh: Setelah sarapan"
                  value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
              </div>
              <button onClick={handleAdd} disabled={!form.weight} className="btn-primary w-full"
                style={{ opacity: !form.weight ? 0.5 : 1 }}>
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
