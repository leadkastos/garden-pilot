import { useState, useEffect } from 'react'
import { Plus, TrendingDown, TrendingUp, DollarSign, ShoppingBag } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useWriteGuard } from '../lib/useWriteGuard'
import AddExpenseModal from '../components/ledger/AddExpenseModal'
import AddRevenueModal from '../components/ledger/AddRevenueModal'
import LedgerEntry from '../components/ledger/LedgerEntry'
const TABS = ['All', 'Expenses', 'Revenue']
export default function LedgerPage() {
  const { user } = useAuth()
  const guard = useWriteGuard()
  const [expenses, setExpenses] = useState([])
  const [revenue, setRevenue] = useState([])
  const [trackedExpenses, setTrackedExpenses] = useState([])
  const [activeTab, setActiveTab] = useState('All')
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showRevenueModal, setShowRevenueModal] = useState(false)
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString())
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!user) return
    fetchAll()
  }, [user])
  const fetchAll = async () => {
    setLoading(true)
    const [expRes, revRes] = await Promise.all([
      supabase.from('expenses').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('revenue').select('*').eq('user_id', user.id).order('date', { ascending: false }),
    ])
    if (!expRes.error) setExpenses(expRes.data || [])
    if (!revRes.error) setRevenue(revRes.data || [])
    // Track which expenses have been imported to plants
    const tracked = (expRes.data || []).filter(e => e.tracked_in_plants).map(e => e.id)
    setTrackedExpenses(tracked)
    setLoading(false)
  }
  const addExpense = async (expense) => {
    if (!guard()) return
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id: user.id,
        category: expense.category,
        item_name: expense.itemName,
        store: expense.store || null,
        cost: expense.cost,
        seed_count: expense.seedCount || null,
        date: expense.date,
        notes: expense.notes || null,
        tracked_in_plants: false,
      })
      .select()
      .single()
    if (!error && data) setExpenses(prev => [data, ...prev])
    setShowExpenseModal(false)
  }
  const addRevenue = async (rev) => {
    if (!guard()) return
    const { data, error } = await supabase
      .from('revenue')
      .insert({
        user_id: user.id,
        item_name: rev.itemName,
        sold_at: rev.soldAt || null,
        amount: rev.amount,
        quantity: rev.quantity || null,
        unit: rev.unit || null,
        date: rev.date,
        notes: rev.notes || null,
      })
      .select()
      .single()
    if (!error && data) setRevenue(prev => [data, ...prev])
    setShowRevenueModal(false)
  }
  const deleteExpense = async (id) => {
    if (!guard()) return
    await supabase.from('expenses').delete().eq('id', id).eq('user_id', user.id)
    setExpenses(prev => prev.filter(e => e.id !== id))
  }
  const deleteRevenue = async (id) => {
    if (!guard()) return
    await supabase.from('revenue').delete().eq('id', id).eq('user_id', user.id)
    setRevenue(prev => prev.filter(r => r.id !== id))
  }
  const handleImportToPlants = async (expense) => {
    if (!guard()) return
    // Add to plants table
    await supabase.from('plants').insert({
      user_id: user.id,
      name: expense.item_name,
      category: 'Vegetable',
      status: 'Unplanted',
      health: 'Good',
      bed: '⚠️ Needs a bed',
      seeds_in_pack: expense.seed_count || 0,
      seeds_planted: 0,
      seeds_sprouted: 0,
      next_action: 'Plant your seeds when ready',
      seed_source: expense.store || null,
      harvest_log: [],
      milestones: [],
      notes: [],
      imported_from_ledger: true,
    })
    // Mark expense as tracked
    await supabase.from('expenses').update({ tracked_in_plants: true }).eq('id', expense.id)
    setTrackedExpenses(prev => [...prev, expense.id])
    setExpenses(prev => prev.map(e => e.id === expense.id ? { ...e, tracked_in_plants: true } : e))
  }
  const filteredExpenses = expenses.filter(e => e.date?.startsWith(yearFilter))
  const filteredRevenue = revenue.filter(r => r.date?.startsWith(yearFilter))
  const totalSpent = filteredExpenses.reduce((s, e) => s + (parseFloat(e.cost) || 0), 0)
  const totalRevenue = filteredRevenue.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)
  const netCost = totalSpent - totalRevenue
  const seedSpend = filteredExpenses.filter(e => e.category === 'Plants & Seeds').reduce((s, e) => s + (parseFloat(e.cost) || 0), 0)
  const supplySpend = filteredExpenses.filter(e => e.category === 'Supplies').reduce((s, e) => s + (parseFloat(e.cost) || 0), 0)
  const availableYears = [...new Set([
    ...expenses.map(e => e.date?.slice(0,4)),
    ...revenue.map(r => r.date?.slice(0,4)),
    new Date().getFullYear().toString()
  ])].filter(Boolean).sort().reverse()
  return (
    <div className="space-y-5 pb-20">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold text-garden-900">Garden Ledger</h1>
          <p className="text-garden-500 text-sm mt-1">Track your garden spending and revenue</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowRevenueModal(true)} className="btn-secondary text-sm">
            <TrendingUp size={14} /> Add Revenue
          </button>
          <button onClick={() => setShowExpenseModal(true)} className="btn-primary text-sm">
            <Plus size={14} /> Add Expense
          </button>
        </div>
      </div>
      {/* Year filter */}
      <div className="flex gap-2 items-center">
        <span className="text-xs text-garden-500 font-medium">Year:</span>
        <div className="flex gap-1.5">
          {availableYears.map(year => (
            <button key={year} onClick={() => setYearFilter(year)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                yearFilter === year ? 'bg-garden-600 text-white' : 'bg-white border border-garden-200 text-garden-600 hover:border-garden-400'
              }`}>
              {year}
            </button>
          ))}
        </div>
      </div>
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-2">
            <TrendingDown size={16} className="text-red-500" />
          </div>
          <div className="font-display text-2xl font-semibold text-garden-900">${totalSpent.toFixed(2)}</div>
          <div className="text-xs text-garden-400 mt-1">Total spent</div>
        </div>
        <div className="card text-center">
          <div className="w-8 h-8 bg-garden-100 rounded-xl flex items-center justify-center mx-auto mb-2">
            <TrendingUp size={16} className="text-garden-600" />
          </div>
          <div className="font-display text-2xl font-semibold text-garden-900">${totalRevenue.toFixed(2)}</div>
          <div className="text-xs text-garden-400 mt-1">Total revenue</div>
        </div>
        <div className={`card text-center ${netCost > 0 ? 'bg-red-50 border-red-100' : 'bg-garden-50 border-garden-100'}`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2 ${netCost > 0 ? 'bg-red-100' : 'bg-garden-100'}`}>
            <DollarSign size={16} className={netCost > 0 ? 'text-red-500' : 'text-garden-600'} />
          </div>
          <div className="font-display text-2xl font-semibold text-garden-900">${Math.abs(netCost).toFixed(2)}</div>
          <div className="text-xs text-garden-400 mt-1">{netCost > 0 ? 'Net cost' : 'Net profit'}</div>
        </div>
      </div>
      {/* Spend breakdown */}
      {totalSpent > 0 && (
        <div className="card">
          <h3 className="font-medium text-garden-900 text-sm mb-3">Spending breakdown</h3>
          <div className="space-y-2.5">
            {[
              { label: 'Plants & Seeds', amount: seedSpend, color: 'bg-garden-500' },
              { label: 'Supplies', amount: supplySpend, color: 'bg-soil-400' },
            ].map(({ label, amount, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs text-garden-600 mb-1">
                  <span>{label}</span>
                  <span className="font-medium">${amount.toFixed(2)}</span>
                </div>
                <div className="h-2 bg-garden-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${color} transition-all duration-500`}
                    style={{ width: `${totalSpent > 0 ? (amount/totalSpent)*100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-garden-600 text-white' : 'bg-white border border-garden-200 text-garden-600 hover:border-garden-400'
            }`}>
            {tab}
            {tab === 'Expenses' && filteredExpenses.length > 0 && <span className="ml-1.5 text-xs opacity-70">({filteredExpenses.length})</span>}
            {tab === 'Revenue' && filteredRevenue.length > 0 && <span className="ml-1.5 text-xs opacity-70">({filteredRevenue.length})</span>}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-garden-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {(activeTab === 'All' || activeTab === 'Expenses') && (
            <div className="space-y-2">
              {activeTab === 'All' && filteredExpenses.length > 0 && (
                <p className="text-xs font-medium text-garden-500 uppercase tracking-wide">Expenses</p>
              )}
              {filteredExpenses.length === 0 && activeTab === 'Expenses' ? (
                <div className="card text-center py-10">
                  <ShoppingBag size={28} className="text-garden-300 mx-auto mb-3" />
                  <p className="text-garden-400 text-sm">No expenses yet for {yearFilter}</p>
                  <button onClick={() => setShowExpenseModal(true)} className="btn-primary mx-auto mt-4 text-sm">
                    <Plus size={14} /> Add first expense
                  </button>
                </div>
              ) : (
                filteredExpenses.map(expense => (
                  <LedgerEntry key={expense.id}
                    entry={{ ...expense, itemName: expense.item_name, seedCount: expense.seed_count }}
                    type="expense"
                    onDelete={() => deleteExpense(expense.id)}
                    isTracked={expense.tracked_in_plants}
                    onImportToPlants={() => handleImportToPlants(expense)} />
                ))
              )}
            </div>
          )}
          {(activeTab === 'All' || activeTab === 'Revenue') && (
            <div className="space-y-2">
              {activeTab === 'All' && filteredRevenue.length > 0 && (
                <p className="text-xs font-medium text-garden-500 uppercase tracking-wide mt-2">Revenue</p>
              )}
              {filteredRevenue.length === 0 && activeTab === 'Revenue' ? (
                <div className="card text-center py-10">
                  <TrendingUp size={28} className="text-garden-300 mx-auto mb-3" />
                  <p className="text-garden-400 text-sm">No revenue recorded yet for {yearFilter}</p>
                  <button onClick={() => setShowRevenueModal(true)} className="btn-primary mx-auto mt-4 text-sm">
                    <Plus size={14} /> Add first sale
                  </button>
                </div>
              ) : (
                filteredRevenue.map(rev => (
                  <LedgerEntry key={rev.id}
                    entry={{ ...rev, itemName: rev.item_name, soldAt: rev.sold_at }}
                    type="revenue"
                    onDelete={() => deleteRevenue(rev.id)} />
                ))
              )}
            </div>
          )}
          {activeTab === 'All' && filteredExpenses.length === 0 && filteredRevenue.length === 0 && (
            <div className="card text-center py-16">
              <div className="w-16 h-16 bg-garden-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <DollarSign size={28} className="text-garden-400" />
              </div>
              <h3 className="font-display text-lg font-semibold text-garden-800 mb-2">Nothing logged yet</h3>
              <p className="text-garden-400 text-sm mb-5">Start tracking your garden spending and sales</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setShowExpenseModal(true)} className="btn-primary text-sm"><Plus size={14} /> Add Expense</button>
                <button onClick={() => setShowRevenueModal(true)} className="btn-secondary text-sm"><TrendingUp size={14} /> Add Revenue</button>
              </div>
            </div>
          )}
        </>
      )}
      {showExpenseModal && <AddExpenseModal onSave={addExpense} onClose={() => setShowExpenseModal(false)} />}
      {showRevenueModal && <AddRevenueModal onSave={addRevenue} onClose={() => setShowRevenueModal(false)} />}
    </div>
  )
}
