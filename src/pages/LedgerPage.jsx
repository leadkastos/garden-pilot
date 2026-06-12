import { useState, useEffect } from 'react'
import { Plus, TrendingDown, TrendingUp, DollarSign, Leaf, ShoppingBag } from 'lucide-react'
import AddExpenseModal from '../components/ledger/AddExpenseModal'
import AddRevenueModal from '../components/ledger/AddRevenueModal'
import LedgerEntry from '../components/ledger/LedgerEntry'

const TABS = ['All', 'Expenses', 'Revenue']

export default function LedgerPage() {
  const [expenses, setExpenses] = useState([])
  const [revenue, setRevenue] = useState([])
  const [activeTab, setActiveTab] = useState('All')
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showRevenueModal, setShowRevenueModal] = useState(false)
  const [pendingPlantImport, setPendingPlantImport] = useState(() => {
    try {
      const saved = localStorage.getItem('gardenpilot_pending_import')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString())

  // Save pending import to localStorage whenever it changes
  useEffect(() => {
    try {
      if (pendingPlantImport) {
        localStorage.setItem('gardenpilot_pending_import', JSON.stringify(pendingPlantImport))
      } else {
        localStorage.removeItem('gardenpilot_pending_import')
      }
    } catch (e) { console.error('Error saving pending import:', e) }
  }, [pendingPlantImport])

  // Load from localStorage
  useEffect(() => {
    try {
      const savedExp = localStorage.getItem('gardenpilot_expenses')
      const savedRev = localStorage.getItem('gardenpilot_revenue')
      if (savedExp) setExpenses(JSON.parse(savedExp))
      if (savedRev) setRevenue(JSON.parse(savedRev))
    } catch (e) { console.error('Error loading ledger:', e) }
  }, [])

  // Save expenses
  useEffect(() => {
    try {
      localStorage.setItem('gardenpilot_expenses', JSON.stringify(expenses))
    } catch (e) { console.error('Error saving expenses:', e) }
  }, [expenses])

  // Save revenue
  useEffect(() => {
    try {
      localStorage.setItem('gardenpilot_revenue', JSON.stringify(revenue))
    } catch (e) { console.error('Error saving revenue:', e) }
  }, [revenue])

  const addExpense = (expense) => {
    const newExpense = { ...expense, id: Date.now() }
    setExpenses(prev => [newExpense, ...prev])
    setShowExpenseModal(false)
    // If it's a plant/seed purchase, show the yellow banner
    if (expense.category === 'Plants & Seeds') {
      setPendingPlantImport(newExpense)
    }
  }

  const addRevenue = (rev) => {
    setRevenue(prev => [{ ...rev, id: Date.now() }, ...prev])
    setShowRevenueModal(false)
  }

  const deleteExpense = (id) => setExpenses(prev => prev.filter(e => e.id !== id))
  const deleteRevenue = (id) => setRevenue(prev => prev.filter(r => r.id !== id))

  const handleImportToPlants = () => {
    if (!pendingPlantImport) return
    try {
      const savedPlants = localStorage.getItem('gardenpilot_plants')
      const plants = savedPlants ? JSON.parse(savedPlants) : []
      const newPlant = {
        id: Date.now(),
        name: pendingPlantImport.itemName,
        variety: '',
        category: 'Vegetable',
        // Unplanted = seeds purchased but not yet in the ground
        status: 'Unplanted',
        health: 'Good',
        bed: '⚠️ Needs a bed',
        // Seeds in pack is informational only — NOT seeds planted
        seedsInPack: pendingPlantImport.seedCount || 0,
        seedsPlanted: 0,
        seedsSprouted: 0,
        nextAction: 'Plant your seeds when ready',
        daysToHarvest: 0,
        photo: null,
        germRate: 0,
        plantedDate: null,
        seedSource: pendingPlantImport.store || '',
        importedFromLedger: true,
      }
      localStorage.setItem('gardenpilot_plants', JSON.stringify([...plants, newPlant]))
    } catch (e) { console.error('Error importing to plants:', e) }
    setPendingPlantImport(null)
  }

  // Filter by year
  const filteredExpenses = expenses.filter(e =>
    e.date?.startsWith(yearFilter))
  const filteredRevenue = revenue.filter(r =>
    r.date?.startsWith(yearFilter))

  // Totals
  const totalSpent = filteredExpenses.reduce((s, e) => s + (parseFloat(e.cost) || 0), 0)
  const totalRevenue = filteredRevenue.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)
  const netCost = totalSpent - totalRevenue

  // Expense breakdown
  const seedSpend = filteredExpenses
    .filter(e => e.category === 'Plants & Seeds')
    .reduce((s, e) => s + (parseFloat(e.cost) || 0), 0)
  const supplySpend = filteredExpenses
    .filter(e => e.category === 'Supplies')
    .reduce((s, e) => s + (parseFloat(e.cost) || 0), 0)

  const availableYears = [...new Set([
    ...expenses.map(e => e.date?.slice(0,4)),
    ...revenue.map(r => r.date?.slice(0,4)),
    new Date().getFullYear().toString()
  ])].filter(Boolean).sort().reverse()

  return (
    <div className="space-y-5 pb-20">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold text-garden-900">Garden Ledger</h1>
          <p className="text-garden-500 text-sm mt-1">Track your garden spending and revenue</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowRevenueModal(true)}
            className="btn-secondary text-sm">
            <TrendingUp size={14} /> Add Revenue
          </button>
          <button onClick={() => setShowExpenseModal(true)}
            className="btn-primary text-sm">
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
                yearFilter === year
                  ? 'bg-garden-600 text-white'
                  : 'bg-white border border-garden-200 text-garden-600 hover:border-garden-400'
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
          <div className="font-display text-2xl font-semibold text-garden-900">
            ${totalSpent.toFixed(2)}
          </div>
          <div className="text-xs text-garden-400 mt-1">Total spent</div>
        </div>
        <div className="card text-center">
          <div className="w-8 h-8 bg-garden-100 rounded-xl flex items-center justify-center mx-auto mb-2">
            <TrendingUp size={16} className="text-garden-600" />
          </div>
          <div className="font-display text-2xl font-semibold text-garden-900">
            ${totalRevenue.toFixed(2)}
          </div>
          <div className="text-xs text-garden-400 mt-1">Total revenue</div>
        </div>
        <div className={`card text-center ${netCost > 0 ? 'bg-red-50 border-red-100' : 'bg-garden-50 border-garden-100'}`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2 ${netCost > 0 ? 'bg-red-100' : 'bg-garden-100'}`}>
            <DollarSign size={16} className={netCost > 0 ? 'text-red-500' : 'text-garden-600'} />
          </div>
          <div className="font-display text-2xl font-semibold text-garden-900">
            ${Math.abs(netCost).toFixed(2)}
          </div>
          <div className="text-xs text-garden-400 mt-1">
            {netCost > 0 ? 'Net cost' : 'Net profit'}
          </div>
        </div>
      </div>

      {/* Spend breakdown */}
      {totalSpent > 0 && (
        <div className="card">
          <h3 className="font-medium text-garden-900 text-sm mb-3">Spending breakdown</h3>
          <div className="space-y-2.5">
            {[
              { label: 'Plants & Seeds', amount: seedSpend, color: 'bg-garden-500', pct: totalSpent > 0 ? (seedSpend/totalSpent)*100 : 0 },
              { label: 'Supplies', amount: supplySpend, color: 'bg-soil-400', pct: totalSpent > 0 ? (supplySpend/totalSpent)*100 : 0 },
            ].map(({ label, amount, color, pct }) => (
              <div key={label}>
                <div className="flex justify-between text-xs text-garden-600 mb-1">
                  <span>{label}</span>
                  <span className="font-medium">${amount.toFixed(2)}</span>
                </div>
                <div className="h-2 bg-garden-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${color} transition-all duration-500`}
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending plant import banner */}
      {pendingPlantImport && (
        <div className="card bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">🌱</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">
                You added <span className="font-bold">{pendingPlantImport.itemName}</span> to your expenses
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Would you like to start tracking this in My Plants?
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={() => {
              setPendingPlantImport(null)
              localStorage.removeItem('gardenpilot_pending_import')
            }}
              className="flex-1 py-2 text-xs font-medium text-amber-700 bg-white border border-amber-200 rounded-xl hover:bg-amber-50 transition-colors">
              Not now
            </button>
            <button onClick={handleImportToPlants}
              className="flex-1 py-2 text-xs font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors">
              ✅ Yes, add to My Plants
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-garden-600 text-white'
                : 'bg-white border border-garden-200 text-garden-600 hover:border-garden-400'
            }`}>
            {tab}
            {tab === 'Expenses' && filteredExpenses.length > 0 && (
              <span className="ml-1.5 text-xs opacity-70">({filteredExpenses.length})</span>
            )}
            {tab === 'Revenue' && filteredRevenue.length > 0 && (
              <span className="ml-1.5 text-xs opacity-70">({filteredRevenue.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Entries */}
      {(activeTab === 'All' || activeTab === 'Expenses') && (
        <div className="space-y-2">
          {activeTab === 'All' && filteredExpenses.length > 0 && (
            <p className="text-xs font-medium text-garden-500 uppercase tracking-wide">Expenses</p>
          )}
          {filteredExpenses.length === 0 && (activeTab === 'Expenses' || activeTab === 'All') ? (
            activeTab === 'Expenses' && (
              <div className="card text-center py-10">
                <ShoppingBag size={28} className="text-garden-300 mx-auto mb-3" />
                <p className="text-garden-400 text-sm">No expenses yet for {yearFilter}</p>
                <button onClick={() => setShowExpenseModal(true)} className="btn-primary mx-auto mt-4 text-sm">
                  <Plus size={14} /> Add first expense
                </button>
              </div>
            )
          ) : (
            filteredExpenses.map(expense => (
              <LedgerEntry key={expense.id} entry={expense} type="expense"
                onDelete={() => deleteExpense(expense.id)} />
            ))
          )}
        </div>
      )}

      {(activeTab === 'All' || activeTab === 'Revenue') && (
        <div className="space-y-2">
          {activeTab === 'All' && filteredRevenue.length > 0 && (
            <p className="text-xs font-medium text-garden-500 uppercase tracking-wide mt-2">Revenue</p>
          )}
          {filteredRevenue.length === 0 && (activeTab === 'Revenue' || activeTab === 'All') ? (
            activeTab === 'Revenue' && (
              <div className="card text-center py-10">
                <TrendingUp size={28} className="text-garden-300 mx-auto mb-3" />
                <p className="text-garden-400 text-sm">No revenue recorded yet for {yearFilter}</p>
                <button onClick={() => setShowRevenueModal(true)} className="btn-primary mx-auto mt-4 text-sm">
                  <Plus size={14} /> Add first sale
                </button>
              </div>
            )
          ) : (
            filteredRevenue.map(rev => (
              <LedgerEntry key={rev.id} entry={rev} type="revenue"
                onDelete={() => deleteRevenue(rev.id)} />
            ))
          )}
        </div>
      )}

      {/* Empty state for All tab */}
      {activeTab === 'All' && filteredExpenses.length === 0 && filteredRevenue.length === 0 && (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-garden-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <DollarSign size={28} className="text-garden-400" />
          </div>
          <h3 className="font-display text-lg font-semibold text-garden-800 mb-2">Nothing logged yet</h3>
          <p className="text-garden-400 text-sm mb-5">Start tracking your garden spending and sales</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setShowExpenseModal(true)} className="btn-primary text-sm">
              <Plus size={14} /> Add Expense
            </button>
            <button onClick={() => setShowRevenueModal(true)} className="btn-secondary text-sm">
              <TrendingUp size={14} /> Add Revenue
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showExpenseModal && (
        <AddExpenseModal onSave={addExpense} onClose={() => setShowExpenseModal(false)} />
      )}
      {showRevenueModal && (
        <AddRevenueModal onSave={addRevenue} onClose={() => setShowRevenueModal(false)} />
      )}
    </div>
  )
}
