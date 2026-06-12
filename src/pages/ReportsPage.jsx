import { useState, useEffect, useRef } from 'react'
import { Printer, Calendar, Leaf, DollarSign, BarChart3, BookOpen, TrendingUp, TrendingDown, Sprout } from 'lucide-react'

const RANGES = [
  { label: 'Last 7 days',   days: 7 },
  { label: 'Last 30 days',  days: 30 },
  { label: 'Last 3 months', days: 90 },
  { label: 'Last 6 months', days: 180 },
  { label: 'This year',     days: 365 },
  { label: 'Custom',        days: null },
]

export default function ReportsPage() {
  const [selectedRange, setSelectedRange] = useState(RANGES[1])
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState(new Date().toISOString().slice(0,10))
  const [reportData, setReportData] = useState(null)
  const printRef = useRef()

  // Calculate date range
  const getDateRange = () => {
    const end = new Date()
    end.setHours(23, 59, 59)
    let start = new Date()

    if (selectedRange.days) {
      start.setDate(start.getDate() - selectedRange.days)
      start.setHours(0, 0, 0)
    } else {
      start = new Date(customStart + 'T00:00:00')
    }
    return { start, end }
  }

  const inRange = (dateStr, start, end) => {
    if (!dateStr) return false
    try {
      const d = new Date(dateStr + 'T12:00:00')
      return d >= start && d <= end
    } catch { return false }
  }

  // Generate report from localStorage data
  const generateReport = () => {
    const { start, end } = getDateRange()

    // Load all data sources
    const plants = JSON.parse(localStorage.getItem('gardenpilot_plants') || '[]')
    const expenses = JSON.parse(localStorage.getItem('gardenpilot_expenses') || '[]')
    const revenue = JSON.parse(localStorage.getItem('gardenpilot_revenue') || '[]')
    const calendarEvents = JSON.parse(localStorage.getItem('gardenpilot_calendar') || '[]')
    const journalEntries = JSON.parse(localStorage.getItem('gardenpilot_journal') || '[]')
    const beds = JSON.parse(localStorage.getItem('gardenpilot_beds') || '[]')

    // Plants in range
    const plantsInRange = plants.filter(p =>
      inRange(p.plantedDate, start, end) || inRange(p.createdAt, start, end))

    // All plants active
    const allPlants = plants

    // Category breakdown
    const categoryBreakdown = allPlants.reduce((acc, p) => {
      const cat = p.category || 'Other'
      acc[cat] = (acc[cat] || 0) + 1
      return acc
    }, {})

    // Status breakdown
    const statusBreakdown = allPlants.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1
      return acc
    }, {})

    // Germination stats
    const plantsWithSeeds = allPlants.filter(p => p.seedsPlanted > 0)
    const totalSeeds = plantsWithSeeds.reduce((s, p) => s + (p.seedsPlanted || 0), 0)
    const totalSprouted = plantsWithSeeds.reduce((s, p) => s + (p.seedsSprouted || 0), 0)
    const avgGermRate = totalSeeds > 0 ? Math.round((totalSprouted / totalSeeds) * 100) : 0

    // Grow again decisions
    const growAgain = allPlants.filter(p => p.growAgain === true).length
    const skipNext = allPlants.filter(p => p.growAgain === false).length

    // Harvests in range
    const allHarvests = []
    allPlants.forEach(p => {
      if (p.harvestLog) {
        p.harvestLog.forEach(h => {
          if (inRange(h.date, start, end)) {
            allHarvests.push({ ...h, plantName: p.name })
          }
        })
      }
    })
    const totalHarvestWeight = allHarvests.reduce((s, h) => s + (parseFloat(h.weight) || 0), 0)

    // Expenses in range
    const expensesInRange = expenses.filter(e => inRange(e.date, start, end))
    const totalSpent = expensesInRange.reduce((s, e) => s + (parseFloat(e.cost) || 0), 0)
    const seedSpend = expensesInRange.filter(e => e.category === 'Plants & Seeds').reduce((s, e) => s + (parseFloat(e.cost) || 0), 0)
    const supplySpend = expensesInRange.filter(e => e.category === 'Supplies').reduce((s, e) => s + (parseFloat(e.cost) || 0), 0)

    // Revenue in range
    const revenueInRange = revenue.filter(r => inRange(r.date, start, end))
    const totalRevenue = revenueInRange.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)

    // Calendar events in range
    const eventsInRange = calendarEvents.filter(e => inRange(e.date, start, end))
    const plantingEvents = eventsInRange.filter(e => e.type === 'plant').length
    const harvestEvents = eventsInRange.filter(e => e.type === 'harvest').length
    const taskEvents = eventsInRange.filter(e => e.type === 'task').length

    // Journal entries in range
    const journalInRange = journalEntries.filter(j => inRange(j.date, start, end))

    // Top plants by harvest
    const harvestByPlant = {}
    allHarvests.forEach(h => {
      harvestByPlant[h.plantName] = (harvestByPlant[h.plantName] || 0) + (parseFloat(h.weight) || 0)
    })
    const topHarvestPlants = Object.entries(harvestByPlant)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    setReportData({
      dateRange: { start, end },
      plants: { total: allPlants.length, inRange: plantsInRange.length, categoryBreakdown, statusBreakdown, growAgain, skipNext },
      seeds: { totalSeeds, totalSprouted, avgGermRate },
      harvests: { total: allHarvests.length, weight: totalHarvestWeight, topPlants: topHarvestPlants, list: allHarvests },
      expenses: { total: totalSpent, seedSpend, supplySpend, list: expensesInRange },
      revenue: { total: totalRevenue, list: revenueInRange },
      calendar: { total: eventsInRange.length, plantingEvents, harvestEvents, taskEvents },
      journal: { total: journalInRange.length, entries: journalInRange.slice(0, 3) },
      beds: { total: beds.length },
    })
  }

  useEffect(() => { generateReport() }, [selectedRange, customStart, customEnd])

  const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const formatDateStr = (str) => {
    try { return new Date(str + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
    catch { return str }
  }

  const handlePrint = () => {
    if (!reportData) return
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Garden Report</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Georgia, serif; padding: 40px; color: #1a3a17; max-width: 800px; margin: 0 auto; }
            h1 { font-size: 28px; color: #2d5a27; margin-bottom: 4px; }
            .subtitle { font-size: 13px; color: #6a8a65; margin-bottom: 32px; }
            .section { margin-bottom: 28px; border-bottom: 1px solid #d4e8cf; padding-bottom: 20px; }
            .section-title { font-size: 16px; font-weight: bold; color: #2d5a27; margin-bottom: 12px; }
            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 12px; }
            .stat { background: #f4f9f1; padding: 12px; border-radius: 8px; text-align: center; }
            .stat-num { font-size: 24px; font-weight: bold; color: #2d5a27; }
            .stat-label { font-size: 11px; color: #6a8a65; }
            .row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; border-bottom: 1px solid #edf5eb; }
            .footer { text-align: center; margin-top: 32px; font-size: 11px; color: #9ab095; }
          </style>
        </head>
        <body>
          <h1>🌱 Garden Report</h1>
          <p class="subtitle">${formatDate(reportData.dateRange.start)} — ${formatDate(reportData.dateRange.end)} · Generated ${new Date().toLocaleDateString()}</p>

          <div class="section">
            <div class="section-title">🌱 Plants</div>
            <div class="stats-grid">
              <div class="stat"><div class="stat-num">${reportData.plants.total}</div><div class="stat-label">Total plants</div></div>
              <div class="stat"><div class="stat-num">${reportData.seeds.avgGermRate}%</div><div class="stat-label">Avg germination</div></div>
              <div class="stat"><div class="stat-num">${reportData.plants.growAgain}</div><div class="stat-label">Grow again</div></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">🥕 Harvests</div>
            <div class="stats-grid">
              <div class="stat"><div class="stat-num">${reportData.harvests.total}</div><div class="stat-label">Harvest logs</div></div>
              <div class="stat"><div class="stat-num">${reportData.harvests.weight.toFixed(1)} lbs</div><div class="stat-label">Total weight</div></div>
              <div class="stat"><div class="stat-num">${reportData.harvests.topPlants.length}</div><div class="stat-label">Plant varieties</div></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">💰 Spending & Revenue</div>
            <div class="stats-grid">
              <div class="stat"><div class="stat-num">$${reportData.expenses.total.toFixed(2)}</div><div class="stat-label">Total spent</div></div>
              <div class="stat"><div class="stat-num">$${reportData.revenue.total.toFixed(2)}</div><div class="stat-label">Revenue earned</div></div>
              <div class="stat"><div class="stat-num">$${Math.abs(reportData.expenses.total - reportData.revenue.total).toFixed(2)}</div><div class="stat-label">${reportData.expenses.total > reportData.revenue.total ? 'Net cost' : 'Net profit'}</div></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">📅 Activity</div>
            <div class="stats-grid">
              <div class="stat"><div class="stat-num">${reportData.calendar.plantingEvents}</div><div class="stat-label">Planting events</div></div>
              <div class="stat"><div class="stat-num">${reportData.calendar.harvestEvents}</div><div class="stat-label">Harvest events</div></div>
              <div class="stat"><div class="stat-num">${reportData.journal.total}</div><div class="stat-label">Journal entries</div></div>
            </div>
          </div>

          <div class="footer">Garden Pilot · TheGardenPilot.com · Your smart guide to a better garden</div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => { printWindow.print(); printWindow.close() }, 500)
  }

  return (
    <div className="space-y-5 pb-20 max-w-3xl mx-auto" ref={printRef}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-garden-900">Reports</h1>
          <p className="text-garden-500 text-sm mt-1">
            {reportData && `${formatDate(reportData.dateRange.start)} — ${formatDate(reportData.dateRange.end)}`}
          </p>
        </div>
        <button onClick={handlePrint} className="btn-secondary text-sm flex-shrink-0">
          <Printer size={14} /> Print Report
        </button>
      </div>

      {/* Range selector */}
      <div className="card">
        <p className="text-sm font-medium text-garden-700 mb-3">Select time range</p>
        <div className="flex flex-wrap gap-2">
          {RANGES.map(range => (
            <button key={range.label} onClick={() => setSelectedRange(range)}
              className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                selectedRange.label === range.label
                  ? 'bg-garden-600 text-white border-garden-600'
                  : 'bg-white text-garden-600 border-garden-200 hover:border-garden-400'
              }`}>
              {range.label}
            </button>
          ))}
        </div>

        {/* Custom date range */}
        {selectedRange.days === null && (
          <div className="flex gap-3 mt-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-garden-600 mb-1">Start date</label>
              <input type="date" className="input-field text-sm"
                value={customStart} onChange={e => setCustomStart(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-garden-600 mb-1">End date</label>
              <input type="date" className="input-field text-sm"
                value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {reportData && (
        <>
          {/* Quick stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Leaf,        label: 'Total plants',    value: reportData.plants.total,          color: 'text-garden-600', bg: 'bg-garden-100' },
              { icon: Sprout,      label: 'Germination rate', value: `${reportData.seeds.avgGermRate}%`, color: 'text-lime-600',   bg: 'bg-lime-100' },
              { icon: TrendingDown,label: 'Total spent',     value: `$${reportData.expenses.total.toFixed(2)}`, color: 'text-red-500', bg: 'bg-red-100' },
              { icon: TrendingUp,  label: 'Revenue earned',  value: `$${reportData.revenue.total.toFixed(2)}`, color: 'text-garden-600', bg: 'bg-garden-100' },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="stat-card">
                <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                  <Icon size={16} className={color} />
                </div>
                <div className="font-display text-xl font-semibold text-garden-900">{value}</div>
                <div className="text-xs text-garden-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Plants Section */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-garden-100 rounded-xl flex items-center justify-center">
                <Leaf size={16} className="text-garden-600" />
              </div>
              <h2 className="font-display text-lg font-semibold text-garden-900">Plants</h2>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Total plants', value: reportData.plants.total },
                { label: 'Seeds planted', value: reportData.seeds.totalSeeds },
                { label: 'Seeds sprouted', value: reportData.seeds.totalSprouted },
              ].map(s => (
                <div key={s.label} className="text-center p-3 bg-garden-50 rounded-xl">
                  <div className="font-display text-2xl font-semibold text-garden-900">{s.value}</div>
                  <div className="text-xs text-garden-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Category breakdown */}
            {Object.keys(reportData.plants.categoryBreakdown).length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-garden-600 mb-2">By category</p>
                <div className="space-y-2">
                  {Object.entries(reportData.plants.categoryBreakdown).map(([cat, count]) => (
                    <div key={cat}>
                      <div className="flex justify-between text-xs text-garden-600 mb-1">
                        <span>{cat}</span><span className="font-medium">{count}</span>
                      </div>
                      <div className="h-1.5 bg-garden-100 rounded-full overflow-hidden">
                        <div className="h-full bg-garden-500 rounded-full"
                          style={{ width: `${(count / reportData.plants.total) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Germination */}
            {reportData.seeds.totalSeeds > 0 && (
              <div className="p-3 bg-garden-50 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-garden-800">Germination rate</span>
                  <span className="font-display text-lg font-semibold text-garden-700">{reportData.seeds.avgGermRate}%</span>
                </div>
                <div className="h-2.5 bg-garden-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-garden-400 to-garden-600 rounded-full transition-all duration-700"
                    style={{ width: `${reportData.seeds.avgGermRate}%` }} />
                </div>
              </div>
            )}

            {/* Grow again */}
            {(reportData.plants.growAgain > 0 || reportData.plants.skipNext > 0) && (
              <div className="flex gap-3 mt-3">
                <div className="flex-1 text-center p-3 bg-garden-50 rounded-xl border border-garden-200">
                  <div className="text-xl mb-1">⭐</div>
                  <div className="font-display text-xl font-semibold text-garden-900">{reportData.plants.growAgain}</div>
                  <div className="text-xs text-garden-400">Grow again</div>
                </div>
                <div className="flex-1 text-center p-3 bg-red-50 rounded-xl border border-red-100">
                  <div className="text-xl mb-1">❌</div>
                  <div className="font-display text-xl font-semibold text-garden-900">{reportData.plants.skipNext}</div>
                  <div className="text-xs text-garden-400">Skip next year</div>
                </div>
              </div>
            )}
          </div>

          {/* Harvest Section */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                <span className="text-base">🥕</span>
              </div>
              <h2 className="font-display text-lg font-semibold text-garden-900">Harvests</h2>
            </div>

            {reportData.harvests.total === 0 ? (
              <p className="text-garden-400 text-sm text-center py-4">No harvests logged in this period</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="text-center p-3 bg-amber-50 rounded-xl">
                    <div className="font-display text-2xl font-semibold text-garden-900">{reportData.harvests.total}</div>
                    <div className="text-xs text-garden-400 mt-0.5">Harvest logs</div>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded-xl">
                    <div className="font-display text-2xl font-semibold text-garden-900">{reportData.harvests.weight.toFixed(1)} lbs</div>
                    <div className="text-xs text-garden-400 mt-0.5">Total harvested</div>
                  </div>
                </div>

                {reportData.harvests.topPlants.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-garden-600 mb-2">Top producers</p>
                    <div className="space-y-2">
                      {reportData.harvests.topPlants.map(([name, weight]) => (
                        <div key={name} className="flex justify-between items-center text-sm">
                          <span className="text-garden-700">🥕 {name}</span>
                          <span className="font-medium text-garden-900">{weight.toFixed(1)} lbs</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Spending & Revenue Section */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign size={16} className="text-green-600" />
              </div>
              <h2 className="font-display text-lg font-semibold text-garden-900">Spending & Revenue</h2>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 bg-red-50 rounded-xl">
                <div className="font-display text-xl font-semibold text-garden-900">${reportData.expenses.total.toFixed(2)}</div>
                <div className="text-xs text-garden-400 mt-0.5">Total spent</div>
              </div>
              <div className="text-center p-3 bg-garden-50 rounded-xl">
                <div className="font-display text-xl font-semibold text-garden-900">${reportData.revenue.total.toFixed(2)}</div>
                <div className="text-xs text-garden-400 mt-0.5">Revenue</div>
              </div>
              <div className={`text-center p-3 rounded-xl ${reportData.expenses.total > reportData.revenue.total ? 'bg-red-50' : 'bg-garden-50'}`}>
                <div className="font-display text-xl font-semibold text-garden-900">
                  ${Math.abs(reportData.expenses.total - reportData.revenue.total).toFixed(2)}
                </div>
                <div className="text-xs text-garden-400 mt-0.5">
                  {reportData.expenses.total > reportData.revenue.total ? 'Net cost' : 'Net profit'}
                </div>
              </div>
            </div>

            {reportData.expenses.total > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-garden-600">Spending breakdown</p>
                {[
                  { label: 'Plants & Seeds', amount: reportData.expenses.seedSpend, color: 'bg-garden-500' },
                  { label: 'Supplies', amount: reportData.expenses.supplySpend, color: 'bg-soil-400' },
                ].map(({ label, amount, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs text-garden-600 mb-1">
                      <span>{label}</span><span className="font-medium">${amount.toFixed(2)}</span>
                    </div>
                    <div className="h-1.5 bg-garden-100 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`}
                        style={{ width: reportData.expenses.total > 0 ? `${(amount/reportData.expenses.total)*100}%` : '0%' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Revenue list */}
            {reportData.revenue.list.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-garden-600 mb-2">Revenue entries</p>
                <div className="space-y-1">
                  {reportData.revenue.list.map(r => (
                    <div key={r.id} className="flex justify-between text-sm py-1 border-b border-garden-50">
                      <span className="text-garden-700">{r.itemName}{r.soldAt ? ` · ${r.soldAt}` : ''}</span>
                      <span className="font-medium text-garden-600">+${parseFloat(r.amount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Activity Section */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar size={16} className="text-blue-600" />
              </div>
              <h2 className="font-display text-lg font-semibold text-garden-900">Activity</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { emoji: '🌱', label: 'Planting events', value: reportData.calendar.plantingEvents },
                { emoji: '🥕', label: 'Harvest events',  value: reportData.calendar.harvestEvents },
                { emoji: '✅', label: 'Tasks logged',    value: reportData.calendar.taskEvents },
                { emoji: '📔', label: 'Journal entries', value: reportData.journal.total },
              ].map(s => (
                <div key={s.label} className="text-center p-3 bg-garden-50 rounded-xl">
                  <div className="text-xl mb-1">{s.emoji}</div>
                  <div className="font-display text-2xl font-semibold text-garden-900">{s.value}</div>
                  <div className="text-xs text-garden-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Journal Preview */}
          {reportData.journal.entries.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                  <BookOpen size={16} className="text-purple-600" />
                </div>
                <h2 className="font-display text-lg font-semibold text-garden-900">Journal Highlights</h2>
              </div>
              <div className="space-y-3">
                {reportData.journal.entries.map(entry => (
                  <div key={entry.id} className="p-3 bg-garden-50 rounded-xl border-l-4 border-l-garden-400">
                    <p className="text-xs text-garden-500 mb-1">{entry.dateDisplay} · {entry.time}</p>
                    <p className="text-sm text-garden-800 line-clamp-3">{entry.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My Beds summary */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-soil-100 rounded-xl flex items-center justify-center">
                <BarChart3 size={16} className="text-soil-600" />
              </div>
              <h2 className="font-display text-lg font-semibold text-garden-900">Garden Overview</h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-garden-50 rounded-xl">
                <div className="font-display text-2xl font-semibold text-garden-900">{reportData.beds.total}</div>
                <div className="text-xs text-garden-400 mt-0.5">Garden beds</div>
              </div>
              <div className="text-center p-3 bg-garden-50 rounded-xl">
                <div className="font-display text-2xl font-semibold text-garden-900">{reportData.plants.total}</div>
                <div className="text-xs text-garden-400 mt-0.5">Total plants</div>
              </div>
              <div className="text-center p-3 bg-garden-50 rounded-xl">
                <div className="font-display text-2xl font-semibold text-garden-900">{reportData.calendar.total}</div>
                <div className="text-xs text-garden-400 mt-0.5">Calendar events</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
