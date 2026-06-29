import { useState, useEffect, useRef } from 'react'
import { Plus, BookOpen, Printer, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const SEASONS = {
  '01': 'Winter', '02': 'Winter', '03': 'Spring',
  '04': 'Spring', '05': 'Spring', '06': 'Summer',
  '07': 'Summer', '08': 'Summer', '09': 'Fall',
  '10': 'Fall',   '11': 'Fall',   '12': 'Winter'
}

const SEASON_EMOJIS = { Winter: '❄️', Spring: '🌱', Summer: '☀️', Fall: '🍂' }

const MOODS = [
  { emoji: '😊', label: 'Great day' },
  { emoji: '🌱', label: 'Planted' },
  { emoji: '💪', label: 'Hard work' },
  { emoji: '🌧️', label: 'Rainy day' },
  { emoji: '🐛', label: 'Pest trouble' },
  { emoji: '🎉', label: 'First harvest' },
  { emoji: '📚', label: 'Learning' },
  { emoji: '😤', label: 'Frustrating' },
]

export default function JournalPage() {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [newEntry, setNewEntry] = useState('')
  const [selectedMood, setSelectedMood] = useState(null)
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString())
  const [expandedEntry, setExpandedEntry] = useState(null)
  const [loading, setLoading] = useState(true)
  const textareaRef = useRef()

  useEffect(() => {
    if (!user) return
    fetchEntries()
  }, [user])

  const fetchEntries = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setEntries(data || [])
    setLoading(false)
  }

  const saveEntry = async () => {
    if (!newEntry.trim()) return
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const dateStr = now.toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.id,
        text: newEntry.trim(),
        mood: selectedMood,
        date: dateStr,
        time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        date_display: now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
        season: SEASONS[month],
        year: now.getFullYear().toString(),
        month,
      })
      .select()
      .single()

    if (!error && data) {
      setEntries(prev => [data, ...prev])
      setNewEntry('')
      setSelectedMood(null)
    }
  }

  const deleteEntry = async (id) => {
    if (!confirm('Delete this journal entry?')) return
    await supabase.from('journal_entries').delete().eq('id', id).eq('user_id', user.id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const filteredEntries = entries.filter(e => e.year === yearFilter)

  const availableYears = [...new Set([
    ...entries.map(e => e.year),
    new Date().getFullYear().toString()
  ])].filter(Boolean).sort().reverse()

  const groupedBySeason = filteredEntries.reduce((acc, entry) => {
    const season = `${entry.season} ${entry.year}`
    if (!acc[season]) acc[season] = []
    acc[season].push(entry)
    return acc
  }, {})

  const seasonOrder = ['Spring', 'Summer', 'Fall', 'Winter']
  const sortedSeasons = Object.keys(groupedBySeason).sort((a, b) => {
    const [aSeason] = a.split(' ')
    const [bSeason] = b.split(' ')
    return seasonOrder.indexOf(aSeason) - seasonOrder.indexOf(bSeason)
  })

  const todayEntries = filteredEntries.filter(e => e.date === new Date().toISOString().slice(0,10))
  const thisWeekCount = filteredEntries.filter(e => {
    const entryDate = new Date(e.date)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return entryDate >= weekAgo
  }).length

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    const entriesHTML = sortedSeasons.map(season => {
      const [seasonName] = season.split(' ')
      const emoji = SEASON_EMOJIS[seasonName] || '🌱'
      return `
        <div class="season-section">
          <h2 class="season-title">${emoji} ${season}</h2>
          ${groupedBySeason[season].map(e => `
            <div class="entry">
              <div class="entry-header">
                <span class="entry-date">${e.date_display}</span>
                ${e.mood ? `<span class="entry-mood">${e.mood.emoji} ${e.mood.label}</span>` : ''}
                <span class="entry-time">${e.time}</span>
              </div>
              <p class="entry-text">${e.text}</p>
            </div>
          `).join('')}
        </div>
      `
    }).join('')

    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>My Garden Journal ${yearFilter}</title>
      <style>
        body { font-family: Georgia, serif; padding: 40px; color: #1a3a17; max-width: 800px; margin: 0 auto; }
        h1 { font-size: 28px; color: #2d5a27; } .subtitle { font-size: 13px; color: #6a8a65; margin-bottom: 32px; }
        .season-title { font-size: 20px; color: #2d5a27; border-bottom: 1px solid #c8e0c3; padding-bottom: 8px; margin: 24px 0 16px; }
        .entry { margin-bottom: 20px; padding: 12px; border-left: 3px solid #4a9e3f; background: #f9fdf7; }
        .entry-header { display: flex; gap: 12px; margin-bottom: 6px; font-size: 12px; color: #6a8a65; }
        .entry-date { font-weight: bold; color: #2d5a27; }
        .entry-text { font-size: 14px; line-height: 1.7; }
        .footer { text-align: center; margin-top: 32px; font-size: 11px; color: #9ab095; }
      </style></head><body>
      <h1>🌱 My Garden Journal</h1>
      <p class="subtitle">${yearFilter} Growing Season · ${filteredEntries.length} entries</p>
      ${entriesHTML}
      <div class="footer">Garden Pilot · TheGardenPilot.com</div>
      </body></html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => { printWindow.print(); printWindow.close() }, 500)
  }

  return (
    <div className="space-y-5 pb-20 max-w-2xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-garden-900">My Journal</h1>
          <p className="text-garden-500 text-sm mt-1">Your personal gardening diary</p>
        </div>
        <button onClick={handlePrint} className="btn-secondary text-sm flex-shrink-0">
          <Printer size={14} /> Generate {yearFilter}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card">
          <div className="font-display text-2xl font-semibold text-garden-900">{filteredEntries.length}</div>
          <div className="text-xs text-garden-400 mt-1">{yearFilter} entries</div>
        </div>
        <div className="stat-card">
          <div className="font-display text-2xl font-semibold text-garden-900">{thisWeekCount}</div>
          <div className="text-xs text-garden-400 mt-1">This week</div>
        </div>
        <div className="stat-card">
          <div className="font-display text-2xl font-semibold text-garden-900">{todayEntries.length}</div>
          <div className="text-xs text-garden-400 mt-1">Today</div>
        </div>
      </div>

      {/* New Entry */}
      <div className="card">
        <h3 className="font-medium text-garden-900 mb-3">What happened in your garden today?</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {MOODS.map(mood => (
            <button key={mood.label} onClick={() => setSelectedMood(selectedMood?.label === mood.label ? null : mood)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                selectedMood?.label === mood.label ? 'bg-garden-600 text-white border-garden-600' : 'bg-white text-garden-600 border-garden-200 hover:border-garden-400'
              }`}>
              {mood.emoji} {mood.label}
            </button>
          ))}
        </div>
        <textarea ref={textareaRef} className="input-field resize-none text-sm leading-relaxed" rows={5}
          placeholder="Write about your garden today... What did you plant? What did you notice? How did it feel to be out there?"
          value={newEntry} onChange={e => setNewEntry(e.target.value)} />
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-garden-400">
            {new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}
            {selectedMood && ` · ${selectedMood.emoji} ${selectedMood.label}`}
          </p>
          <button onClick={saveEntry} disabled={!newEntry.trim()} className="btn-primary text-sm disabled:opacity-40">
            <Plus size={14} /> Save Entry
          </button>
        </div>
      </div>

      {/* Year filter */}
      {availableYears.length > 0 && (
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
      )}

      {/* Entries */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-garden-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-garden-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-garden-400" />
          </div>
          <h3 className="font-display text-lg font-semibold text-garden-800 mb-2">Your journal is empty</h3>
          <p className="text-garden-400 text-sm max-w-xs mx-auto">Start writing about your garden. Every entry becomes part of your season's story.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedSeasons.map(season => {
            const [seasonName] = season.split(' ')
            const emoji = SEASON_EMOJIS[seasonName] || '🌱'
            return (
              <div key={season}>
                <div className="flex items-center gap-3 my-4">
                  <div className="h-px flex-1 bg-garden-100" />
                  <span className="text-xs font-medium text-garden-500 bg-parchment px-2">{emoji} {season}</span>
                  <div className="h-px flex-1 bg-garden-100" />
                </div>
                {groupedBySeason[season].map(entry => (
                  <div key={entry.id} className="card border-l-4 border-l-garden-400 hover:shadow-card-hover transition-all mb-3">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="text-xs font-medium text-garden-600">{entry.date_display}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[11px] text-garden-400">{entry.time}</p>
                          {entry.mood && (
                            <span className="text-[11px] bg-garden-50 text-garden-600 px-2 py-0.5 rounded-full border border-garden-100">
                              {entry.mood.emoji} {entry.mood.label}
                            </span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => deleteEntry(entry.id)}
                        className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors flex-shrink-0">
                        <Trash2 size={11} className="text-red-400" />
                      </button>
                    </div>
                    <p className={`text-sm text-garden-800 leading-relaxed ${expandedEntry !== entry.id && entry.text.length > 200 ? 'line-clamp-4' : ''}`}>
                      {entry.text}
                    </p>
                    {entry.text.length > 200 && (
                      <button onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                        className="text-xs text-garden-500 hover:text-garden-700 mt-1 font-medium">
                        {expandedEntry === entry.id ? 'Show less' : 'Read more'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
