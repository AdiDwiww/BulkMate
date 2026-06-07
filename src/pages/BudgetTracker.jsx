import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { formatCurrency, formatDateShort } from '../utils/helpers'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Wallet, Plus, Trash2, X, TrendingUp, Coffee, ShoppingCart } from 'lucide-react'

export default function BudgetTracker() {
  const { state, dispatch } = useApp()
  const { expenses } = state

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    name: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'meal',
  })

  const categories = {
    meal: { label: 'Makanan Utama', emoji: '🍚', color: '#22c55e' },
    snack: { label: 'Jajan/Snack', emoji: '🍪', color: '#f97316' },
    supplement: { label: 'Suplemen', emoji: '💊', color: '#3b82f6' },
    grocery: { label: 'Belanja Bahan', emoji: '🛒', color: '#a855f7' },
    drink: { label: 'Minuman', emoji: '☕', color: '#ec4899' },
  }

  const today = new Date().toISOString().split('T')[0]
  const thisWeekStart = new Date()
  thisWeekStart.setDate(thisWeekStart.getDate() - 7)
  const thisMonthStart = new Date()
  thisMonthStart.setDate(1)

  const dailyTotal = expenses.filter(e => e.date === today).reduce((s, e) => s + Number(e.amount), 0)
  const weeklyTotal = expenses.filter(e => new Date(e.date) >= thisWeekStart).reduce((s, e) => s + Number(e.amount), 0)
  const monthlyTotal = expenses.filter(e => new Date(e.date) >= thisMonthStart).reduce((s, e) => s + Number(e.amount), 0)

  // Chart data - last 7 days
  const chartData = useMemo(() => {
    const data = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const total = expenses.filter(e => e.date === dateStr).reduce((s, e) => s + Number(e.amount), 0)
      data.push({ date: formatDateShort(dateStr), amount: total })
    }
    return data
  }, [expenses])

  const handleAdd = () => {
    if (!form.name || !form.amount) return
    dispatch({ type: 'ADD_EXPENSE', payload: form })
    setForm({ name: '', amount: '', date: today, category: 'meal' })
    setShowModal(false)
  }

  // Kategori breakdown
  const categoryBreakdown = useMemo(() => {
    return Object.entries(categories).map(([key, cat]) => {
      const catExpenses = expenses.filter(e => e.category === key)
      const total = catExpenses.reduce((s, e) => s + Number(e.amount), 0)
      return { ...cat, key, total, count: catExpenses.length }
    }).filter(c => c.total > 0).sort((a, b) => b.total - a.total)
  }, [expenses])

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title text-xl">Budget Tracker</h1>
          <p className="section-subtitle">Catat pengeluaran makanan harianmu</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 px-3 py-2">
          <Plus size={16} />
          <span className="hidden sm:inline">Catat</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Hari Ini', value: formatCurrency(dailyTotal), icon: '📅', color: '#22c55e' },
          { label: 'Minggu Ini', value: formatCurrency(weeklyTotal), icon: '📆', color: '#3b82f6' },
          { label: 'Bulan Ini', value: formatCurrency(monthlyTotal), icon: '🗓️', color: '#a855f7' },
        ].map((s, i) => (
          <div key={i} className="stat-card text-center">
            <div className="text-xl mb-1">{s.icon}</div>
            <div className="font-black text-sm" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card p-5">
        <h2 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Pengeluaran 7 Hari Terakhir</h2>
        {chartData.some(d => d.amount > 0) ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => [formatCurrency(v), 'Pengeluaran']}
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px' }} />
              <Bar dataKey="amount" fill="#22c55e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state h-40">
            <div className="empty-state-icon">💰</div>
            <div className="text-sm">Belum ada pengeluaran dicatat</div>
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="card p-5">
          <h2 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Breakdown Kategori</h2>
          <div className="space-y-3">
            {categoryBreakdown.map(cat => (
              <div key={cat.key} className="flex items-center gap-3">
                <div className="text-xl w-8 flex-shrink-0">{cat.emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{cat.label}</span>
                    <span className="font-bold text-sm" style={{ color: cat.color }}>{formatCurrency(cat.total)}</span>
                  </div>
                  <div className="progress-bar" style={{ height: '6px' }}>
                    <div className="progress-fill"
                         style={{ width: `${(cat.total / monthlyTotal) * 100}%`, background: cat.color }} />
                  </div>
                </div>
                <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {Math.round((cat.total / monthlyTotal) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Expenses */}
      <div className="card p-5">
        <h2 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Riwayat Pengeluaran</h2>
        {expenses.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
            {[...expenses].reverse().map(exp => {
              const cat = categories[exp.category] || categories.meal
              return (
                <div key={exp.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl"
                     style={{ background: 'var(--bg-secondary)' }}>
                  <div className="text-xl flex-shrink-0">{cat.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{exp.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {formatDateShort(exp.date)} · {cat.label}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-bold text-sm" style={{ color: cat.color }}>{formatCurrency(exp.amount)}</span>
                    <button onClick={() => dispatch({ type: 'DELETE_EXPENSE', payload: exp.id })}
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
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
            <div className="empty-state-icon">💳</div>
            <div className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Belum ada pengeluaran</div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
              <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Catat Pengeluaran</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'var(--bg-secondary)' }}>
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">Nama Item</label>
                <input type="text" className="input-field" placeholder="Contoh: Nasi Goreng"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
              </div>
              <div>
                <label className="label">Harga (Rp)</label>
                <input type="number" className="input-field" placeholder="15000"
                  value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} min={0} />
              </div>
              <div>
                <label className="label">Kategori</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(categories).map(([key, cat]) => (
                    <button key={key} onClick={() => setForm(f => ({ ...f, category: key }))}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all"
                      style={{
                        background: form.category === key ? `${cat.color}10` : 'var(--bg-secondary)',
                        borderColor: form.category === key ? cat.color : 'var(--border-color)',
                        color: form.category === key ? cat.color : 'var(--text-secondary)',
                      }}>
                      <span>{cat.emoji}</span>
                      <span className="font-medium">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Tanggal</label>
                <input type="date" className="input-field" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <button onClick={handleAdd} disabled={!form.name || !form.amount}
                className="btn-primary w-full"
                style={{ opacity: (!form.name || !form.amount) ? 0.5 : 1 }}>
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
