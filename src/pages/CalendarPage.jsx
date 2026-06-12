import { useState, useEffect } from 'react'
import { Plus, ChevronLeft, ChevronRight, X, Check, List, Grid } from 'lucide-react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const EVENT_TYPES = {
  plant:   { label: 'Planted',   color: 'bg-garden-500',  text: 'text-garden-700',  bg: 'bg-garden-100',  dot: 'bg-garden-500',  emoji: '🌱' },
  harvest: { label: 'Harvested', color: 'bg-amber-500',   text: 'text-amber-700',   bg: 'bg-amber-100',   dot: 'bg-amber-500',   emoji: '🥕' },
  task:    { label: 'Task',      color: 'bg-blue-500',    text: 'text-blue-700',    bg: 'bg-blue-100',    dot: 'bg-blue-500',    emoji: '✅' },
  manual:  { label: 'Event',     color: 'bg-purple-500',  text: 'text-purple-700',  bg: 'bg-purple-100',  dot: 'bg-purple-500',  emoji: '📅' },
  frost:   { label: 'Weather',   color: 'bg-slate-500',   text: 'text-slate-700',   bg: 'bg-slate-100',   dot: 'bg-slate-500',   emoji: '❄️' },
}

const MANUAL_EVENT_TYPES = [
  { value: 'plant',   label: '🌱 Planted' },
  { value: 'harvest', label: '🥕 Harvested' },
  { value: 'task',    label: '✅ Task / Reminder' },
  { value: 'manual',  label: '📅 General Event' },
]

export default function CalendarPage() {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [events, setEvents] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedDayEvents, setSelectedDayEvents] = useState(null)
  const [view, setView] = useState('month') // month | list

  // Load events from localStorage (manual + imported from plants/harvests)
  useEffect(() => {
    try {
      const savedEvents = localStorage.getItem('gardenpilot_calendar')
      if (savedEvents) setEvents(JSON.parse(savedEvents))
    } catch (e) { console.error('Error loading calendar:', e) }
  }, [])

  // Also pull in plant dates and harvest logs from My Plants
  useEffect(() => {
    try {
      const savedPlants = localStorage.getItem('gardenpilot_plants')
      if (!savedPlants) return
      const plants = JSON.parse(savedPlants)

      const savedEvents = localStorage.getItem('gardenpilot_calendar')
      const existingEvents = savedEvents ? JSON.parse(savedEvents) : []

      const plantEvents = []
      plants.forEach(plant => {
        // Planting date
        if (plant.plantedDate) {
          const key = `plant-${plant.id}-${plant.plantedDate}`
          if (!existingEvents.find(e => e.key === key)) {
            plantEvents.push({
              id: key, key,
              type: 'plant',
              title: `${plant.name} planted`,
              date: plant.plantedDate,
              plantId: plant.id,
              auto: true
            })
          }
        }
        // Harvest logs
        if (plant.harvestLog) {
          plant.harvestLog.forEach((h, i) => {
            if (h.date) {
              const key = `harvest-${plant.id}-${i}-${h.date}`
              if (!existingEvents.find(e => e.key === key)) {
                plantEvents.push({
                  id: key, key,
                  type: 'harvest',
                  title: `${plant.name} harvested${h.weight ? ` — ${h.weight} ${h.unit}` : ''}`,
                  date: h.date,
                  plantId: plant.id,
                  auto: true
                })
              }
            }
          })
        }
      })

      if (plantEvents.length > 0) {
        const merged = [...existingEvents, ...plantEvents]
        setEvents(merged)
        localStorage.setItem('gardenpilot_calendar', JSON.stringify(merged))
      }
    } catch (e) { console.error('Error syncing plant events:', e) }
  }, [])

  const saveEvents = (newEvents) => {
    setEvents(newEvents)
    localStorage.setItem('gardenpilot_calendar', JSON.stringify(newEvents))
  }

  const addEvent = (event) => {
    const newEvent = { ...event, id: Date.now(), key: `manual-${Date.now()}` }
    saveEvents([...events, newEvent])
    setShowAddModal(false)
    setSelectedDate(null)
  }

  const deleteEvent = (id) => {
    saveEvents(events.filter(e => e.id !== id))
  }

  // Calendar grid logic
  const firstDay = new Date(currentYear, currentMonth, 1).getDay()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate()

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
  }

  const getEventsForDate = (dateStr) => events.filter(e => e.date === dateStr)

  const formatDate = (year, month, day) =>
    `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`

  const handleDayClick = (dateStr) => {
    const dayEvents = getEventsForDate(dateStr)
    if (dayEvents.length > 0) {
      setSelectedDayEvents({ date: dateStr, events: dayEvents })
    } else {
      setSelectedDate(dateStr)
      setShowAddModal(true)
    }
  }

  const isToday = (dateStr) => dateStr === today.toISOString().slice(0,10)

  // List view — upcoming events sorted by date
  const upcomingEvents = [...events]
    .filter(e => e.date >= today.toISOString().slice(0,10))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 30)

  const pastEvents = [...events]
    .filter(e => e.date < today.toISOString().slice(0,10))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 20)

  const formatDisplayDate = (dateStr) => {
    try {
      return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric'
      })
    } catch { return dateStr }
  }

  // Build calendar grid cells
  const cells = []
  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, currentMonth: false, dateStr: null })
  }
  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, currentMonth: true, dateStr: formatDate(currentYear, currentMonth, d) })
  }
  // Next month days to fill grid
  const remaining = 42 - cells.length
  for (let i = 1; i <= remaining; i++) {
    cells.push({ day: i, currentMonth: false, dateStr: null })
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-garden-900">Calendar</h1>
          <p className="text-garden-500 text-sm mt-1">{events.length} events this season</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-white border border-garden-200 rounded-xl overflow-hidden">
            <button onClick={() => setView('month')}
              className={`px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1 ${
                view === 'month' ? 'bg-garden-600 text-white' : 'text-garden-600 hover:bg-garden-50'
              }`}>
              <Grid size={13} /> Month
            </button>
            <button onClick={() => setView('list')}
              className={`px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1 ${
                view === 'list' ? 'bg-garden-600 text-white' : 'text-garden-600 hover:bg-garden-50'
              }`}>
              <List size={13} /> List
            </button>
          </div>
          <button onClick={() => { setSelectedDate(today.toISOString().slice(0,10)); setShowAddModal(true) }}
            className="btn-primary text-sm">
            <Plus size={14} /> Add Event
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(EVENT_TYPES).map(([key, type]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${type.dot}`} />
            <span className="text-xs text-garden-500">{type.emoji} {type.label}</span>
          </div>
        ))}
      </div>

      {/* MONTH VIEW */}
      {view === 'month' && (
        <div className="card p-0 overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-garden-100">
            <button onClick={prevMonth}
              className="w-8 h-8 rounded-lg hover:bg-garden-50 flex items-center justify-center transition-colors">
              <ChevronLeft size={16} className="text-garden-600" />
            </button>
            <h2 className="font-display text-lg font-semibold text-garden-900">
              {MONTHS[currentMonth]} {currentYear}
            </h2>
            <button onClick={nextMonth}
              className="w-8 h-8 rounded-lg hover:bg-garden-50 flex items-center justify-center transition-colors">
              <ChevronRight size={16} className="text-garden-600" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-garden-100">
            {DAYS.map(d => (
              <div key={d} className="py-2 text-center text-xs font-medium text-garden-400">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {cells.map((cell, idx) => {
              const dayEvents = cell.dateStr ? getEventsForDate(cell.dateStr) : []
              const isCurrentDay = cell.dateStr && isToday(cell.dateStr)
              return (
                <div key={idx}
                  onClick={() => cell.currentMonth && cell.dateStr && handleDayClick(cell.dateStr)}
                  className={`min-h-[72px] p-1.5 border-r border-b border-garden-50 transition-colors ${
                    cell.currentMonth ? 'cursor-pointer hover:bg-garden-50' : 'bg-gray-50/50'
                  }`}>
                  {/* Day number */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mb-1 ${
                    isCurrentDay
                      ? 'bg-garden-600 text-white'
                      : cell.currentMonth ? 'text-garden-800' : 'text-garden-300'
                  }`}>
                    {cell.day}
                  </div>
                  {/* Event dots */}
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((event, i) => {
                      const type = EVENT_TYPES[event.type] || EVENT_TYPES.manual
                      return (
                        <div key={i}
                          className={`text-[10px] px-1 py-0.5 rounded font-medium truncate ${type.bg} ${type.text}`}>
                          {type.emoji} {event.title}
                        </div>
                      )
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-garden-400 px-1">+{dayEvents.length - 3} more</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      {view === 'list' && (
        <div className="space-y-4">
          {upcomingEvents.length > 0 && (
            <div>
              <p className="text-xs font-medium text-garden-500 uppercase tracking-wide mb-2">Upcoming</p>
              <div className="space-y-2">
                {upcomingEvents.map(event => {
                  const type = EVENT_TYPES[event.type] || EVENT_TYPES.manual
                  return (
                    <div key={event.id} className="card flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${type.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-garden-900 truncate">{event.title}</p>
                        <p className="text-xs text-garden-400">{formatDisplayDate(event.date)}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${type.bg} ${type.text} flex-shrink-0`}>
                        {type.emoji} {type.label}
                      </span>
                      {!event.auto && (
                        <button onClick={() => deleteEvent(event.id)}
                          className="w-6 h-6 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center flex-shrink-0">
                          <X size={10} className="text-red-400" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {pastEvents.length > 0 && (
            <div>
              <p className="text-xs font-medium text-garden-500 uppercase tracking-wide mb-2">Past events</p>
              <div className="space-y-2 opacity-70">
                {pastEvents.map(event => {
                  const type = EVENT_TYPES[event.type] || EVENT_TYPES.manual
                  return (
                    <div key={event.id} className="card flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${type.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-garden-900 truncate line-through">{event.title}</p>
                        <p className="text-xs text-garden-400">{formatDisplayDate(event.date)}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${type.bg} ${type.text} flex-shrink-0`}>
                        {type.emoji} {type.label}
                      </span>
                      {!event.auto && (
                        <button onClick={() => deleteEvent(event.id)}
                          className="w-6 h-6 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center flex-shrink-0">
                          <X size={10} className="text-red-400" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {events.length === 0 && (
            <div className="card text-center py-16">
              <p className="text-garden-400 text-sm">No events yet</p>
              <p className="text-garden-300 text-xs mt-1">Add plants and harvests in My Plants — they'll appear here automatically</p>
            </div>
          )}
        </div>
      )}

      {/* Day events modal */}
      {selectedDayEvents && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className="px-5 pt-5 pb-3 border-b border-garden-100 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold text-garden-900">
                  {formatDisplayDate(selectedDayEvents.date)}
                </h3>
                <p className="text-xs text-garden-400">{selectedDayEvents.events.length} events</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setSelectedDate(selectedDayEvents.date); setSelectedDayEvents(null); setShowAddModal(true) }}
                  className="btn-primary text-xs py-1.5 px-3">
                  <Plus size={12} /> Add
                </button>
                <button onClick={() => setSelectedDayEvents(null)}>
                  <X size={18} className="text-garden-400" />
                </button>
              </div>
            </div>
            <div className="px-5 py-4 space-y-2 max-h-80 overflow-y-auto">
              {selectedDayEvents.events.map(event => {
                const type = EVENT_TYPES[event.type] || EVENT_TYPES.manual
                return (
                  <div key={event.id} className={`flex items-center gap-3 p-3 rounded-xl ${type.bg}`}>
                    <span className="text-lg">{type.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${type.text}`}>{event.title}</p>
                      {event.notes && <p className="text-xs text-garden-500 mt-0.5">{event.notes}</p>}
                    </div>
                    {!event.auto && (
                      <button onClick={() => { deleteEvent(event.id); setSelectedDayEvents(null) }}
                        className="w-6 h-6 rounded-lg bg-white/50 hover:bg-red-100 flex items-center justify-center">
                        <X size={10} className="text-red-400" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddModal && (
        <AddEventModal
          defaultDate={selectedDate || today.toISOString().slice(0,10)}
          onSave={addEvent}
          onClose={() => { setShowAddModal(false); setSelectedDate(null) }}
        />
      )}
    </div>
  )
}

function AddEventModal({ defaultDate, onSave, onClose }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(defaultDate)
  const [type, setType] = useState('manual')
  const [notes, setNotes] = useState('')

  const handleSave = () => {
    if (!title.trim() || !date) return
    onSave({ title: title.trim(), date, type, notes: notes.trim() })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-garden-100 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-garden-900">Add event</h3>
          <button onClick={onClose}><X size={18} className="text-garden-400" /></button>
        </div>
        <div className="px-5 py-4 space-y-4">

          {/* Event type */}
          <div>
            <label className="block text-sm font-medium text-garden-700 mb-2">Event type</label>
            <div className="grid grid-cols-2 gap-2">
              {MANUAL_EVENT_TYPES.map(t => (
                <button key={t.value} onClick={() => setType(t.value)}
                  className={`p-2.5 rounded-xl border-2 text-sm font-medium text-left transition-all ${
                    type === t.value
                      ? 'border-garden-500 bg-garden-50 text-garden-800'
                      : 'border-garden-100 bg-white text-garden-600 hover:border-garden-300'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-garden-700 mb-1.5">What is it? *</label>
            <input className="input-field" placeholder="e.g. Water tomatoes, First frost expected"
              value={title} onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()} autoFocus />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-garden-700 mb-1.5">Date *</label>
            <input type="date" className="input-field"
              value={date} onChange={e => setDate(e.target.value)} />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-garden-700 mb-1.5">
              Notes <span className="text-garden-400 font-normal">(optional)</span>
            </label>
            <input className="input-field text-sm" placeholder="Any extra details..."
              value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="px-5 py-4 border-t border-garden-100 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center py-2.5 text-sm">
            Cancel
          </button>
          <button onClick={handleSave} disabled={!title.trim() || !date}
            className="btn-primary flex-1 justify-center py-2.5 text-sm disabled:opacity-40">
            <Check size={14} /> Save Event
          </button>
        </div>
      </div>
    </div>
  )
}
