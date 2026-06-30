import { useState } from 'react'
import {
  ArrowLeft, Camera, Plus, Droplets, Zap, AlertTriangle,
  CheckCircle2, Leaf, BarChart2, TrendingUp, Star, X,
  ChevronDown, ChevronUp, Edit3, Trash2
} from 'lucide-react'

const QUICK_ACTIONS = [
  { id: 'watered',    label: 'I Watered',           emoji: '💧' },
  { id: 'sprouted',   label: 'Seeds Sprouted',       emoji: '🌱' },
  { id: 'fertilized', label: 'I Added Fertilizer',   emoji: '🌿' },
  { id: 'mulched',    label: 'I Added Mulch',         emoji: '🍂' },
  { id: 'bugs',       label: 'I Saw Bugs',            emoji: '🐛' },
  { id: 'disease',    label: 'I Saw Disease',         emoji: '⚠️' },
  { id: 'harvested',  label: 'I Harvested',           emoji: '🥕' },
  { id: 'photo',      label: 'I Took a Photo',        emoji: '📸' },
  { id: 'moved',      label: 'I Moved the Plant',     emoji: '📦' },
  { id: 'other',      label: 'Other',                 emoji: '📝' },
]

const MILESTONES = [
  'Seed Planted', 'Sprouted', 'First True Leaves', 'Potted Up',
  'Hardened Off', 'Moved Outdoors', 'Transplanted', 'Flowering',
  'Fruiting', 'Harvest Started', 'Finished'
]

const HEALTH_OPTIONS = ['Excellent', 'Good', 'Fair', 'Poor']
const HEALTH_COLORS = {
  Excellent: 'bg-garden-100 text-garden-800 border-garden-300',
  Good: 'bg-blue-100 text-blue-800 border-blue-300',
  Fair: 'bg-amber-100 text-amber-800 border-amber-300',
  Poor: 'bg-red-100 text-red-800 border-red-300',
}

function nowStamp() {
  const now = new Date()
  return now.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) +
    ' at ' + now.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true })
}
function todayLabel() {
  return new Date().toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
}

export default function PlantDetail({ plant, onBack, onUpdate, onDelete, statusColors }) {
  const [showTodayModal, setShowTodayModal] = useState(false)
  const [showHarvestModal, setShowHarvestModal] = useState(false)
  const [showGermModal, setShowGermModal] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  // Real data from the plant record (falls back to empty)
  const [notes, setNotes] = useState(Array.isArray(plant.notes) ? plant.notes : [])
  const [newNote, setNewNote] = useState('')
  const [harvestLog, setHarvestLog] = useState(Array.isArray(plant.harvestLog) ? plant.harvestLog : [])
  const [timeline, setTimeline] = useState(Array.isArray(plant.milestones) ? plant.milestones : [])
  const [germSprouted, setGermSprouted] = useState(plant.seedsSprouted || 0)
  const [growAgain, setGrowAgain] = useState(plant.growAgain ?? null)

  const colors = statusColors[plant.status] || statusColors['Growing']
  const germPct = plant.seedsPlanted > 0 ? Math.round((germSprouted / plant.seedsPlanted) * 100) : 0

  // Persist helper — merges changes and saves to Supabase
  const persist = (changes) => {
    onUpdate({ ...plant, ...changes })
  }

  const handleQuickAction = (action) => {
    const note = { id: Date.now(), text: action.label, date: todayLabel(), type: 'action', emoji: action.emoji }
    const updated = [note, ...notes]
    setNotes(updated)
    persist({ notes: updated })
    setShowTodayModal(false)
  }

  const addNote = () => {
    if (!newNote.trim()) return
    const updated = [{ id: Date.now(), text: newNote, date: todayLabel(), type: 'note' }, ...notes]
    setNotes(updated)
    persist({ notes: updated })
    setNewNote('')
  }

  const deleteNote = (id) => {
    const updated = notes.filter(n => n.id !== id)
    setNotes(updated)
    persist({ notes: updated })
  }

  const logHarvest = (weight, unit) => {
    const entry = { id: Date.now(), date: todayLabel(), weight, unit }
    const updated = [...harvestLog, entry]
    setHarvestLog(updated)
    persist({ harvestLog: updated, status: 'Harvesting' })
    setShowHarvestModal(false)
  }

  const deleteHarvest = (id) => {
    const updated = harvestLog.filter(h => h.id !== id)
    setHarvestLog(updated)
    persist({ harvestLog: updated })
  }

  const toggleMilestone = (m) => {
    const alreadyDone = timeline.find(x => x.name === m)
    let updated
    if (alreadyDone) {
      updated = timeline.filter(x => x.name !== m)
    } else {
      updated = [...timeline, { name: m, completedAt: nowStamp() }]
    }
    setTimeline(updated)
    persist({ milestones: updated })
  }

  const saveGerm = () => {
    const rate = plant.seedsPlanted > 0 ? Math.round((germSprouted / plant.seedsPlanted) * 100) : 0
    persist({ seedsSprouted: germSprouted, germRate: rate })
    setShowGermModal(false)
  }

  const saveGrowAgain = (val) => {
    setGrowAgain(val)
    persist({ growAgain: val })
  }

  const totalHarvest = harvestLog
    .filter(h => h.unit !== 'count')
    .reduce((s, h) => s + parseFloat(h.weight || 0), 0)

  return (
    <div className="min-h-screen bg-parchment pb-24">

      {/* Header */}
      <div className="bg-garden-800 px-4 pt-4 pb-5">
        <button onClick={onBack} className="flex items-center gap-2 text-garden-300 hover:text-white mb-4 text-sm">
          <ArrowLeft size={16} /> My Plants
        </button>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-garden-700 flex items-center justify-center text-3xl flex-shrink-0">
            🌱
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl font-semibold text-white leading-tight">{plant.name}</h1>
            {plant.variety && <p className="text-garden-400 text-sm">{plant.variety}</p>}
            <div className="flex items-center gap-2 mt-1">
              <span className={`badge text-[11px] ${colors.bg} ${colors.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} mr-1`} />
                {plant.status}
              </span>
              <span className="text-garden-400 text-xs">{plant.bed}</span>
            </div>
          </div>
          {onDelete && (
            <button onClick={onDelete}
              className="w-9 h-9 rounded-xl bg-garden-700 hover:bg-red-500/80 flex items-center justify-center transition-colors flex-shrink-0"
              title="Delete plant">
              <Trash2 size={15} className="text-garden-200" />
            </button>
          )}
        </div>
      </div>

      {/* What Happened Today - BIG BUTTON */}
      <div className="px-4 -mt-3">
        <button onClick={() => setShowTodayModal(true)}
          className="w-full bg-garden-600 hover:bg-garden-700 active:scale-[0.99] text-white rounded-2xl py-4 font-medium text-base shadow-lg transition-all flex items-center justify-center gap-2">
          <Zap size={18} /> What Happened Today?
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 mt-4 overflow-x-auto pb-1">
        {['overview', 'timeline', 'notes', 'harvest', 'photos'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium flex-shrink-0 transition-all capitalize ${
              activeTab === tab
                ? 'bg-garden-600 text-white'
                : 'bg-white text-garden-600 border border-garden-200 hover:border-garden-400'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="px-4 mt-4 space-y-4">

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-4 fade-in">

            {/* Insight */}
            <div className="card bg-garden-50 border-garden-200">
              <div className="flex items-start gap-2">
                <span className="text-xl">🌿</span>
                <div>
                  <p className="text-xs font-medium text-garden-700 mb-1">Garden Pilot Insight</p>
                  <p className="text-sm text-garden-600">
                    {plant.status === 'Unplanted'
                      ? `${plant.name} seeds are purchased and ready to plant. ${plant.seedsInPack > 0 ? `You have ${plant.seedsInPack} seeds in the pack. ` : ''}Click "Mark as Planted" when you put them in the ground.`
                      : plant.seedsPlanted > 0
                        ? `You planted ${plant.seedsPlanted} seeds and ${germSprouted} sprouted — a ${germPct}% success rate.${plant.daysToHarvest > 0 ? ` First harvest is expected in approximately ${plant.daysToHarvest} days.` : ' This plant is ready to harvest!'}`
                        : `${plant.name} has been planted. Update your seed count and germination as your garden grows.`
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Germination — only show when actually planted */}
            {plant.status !== 'Unplanted' && (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-garden-900">How many seeds sprouted?</h3>
                <button onClick={() => setShowGermModal(true)}
                  className="text-xs text-garden-600 bg-garden-50 border border-garden-200 px-3 py-1 rounded-full">
                  Update
                </button>
              </div>
              <div className="flex items-center gap-4 mb-3">
                <div className="text-center">
                  <div className="font-display text-3xl font-semibold text-garden-900">{germSprouted}</div>
                  <div className="text-xs text-garden-400">sprouted</div>
                </div>
                <div className="text-garden-300 text-xl">of</div>
                <div className="text-center">
                  <div className="font-display text-3xl font-semibold text-garden-500">{plant.seedsPlanted}</div>
                  <div className="text-xs text-garden-400">planted</div>
                </div>
                <div className="flex-1">
                  <div className="font-display text-3xl font-semibold text-garden-700 text-right">{germPct}%</div>
                  <div className="text-xs text-garden-400 text-right">success rate</div>
                </div>
              </div>
              <div className="h-3 bg-garden-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-garden-400 to-garden-600 transition-all duration-700"
                  style={{ width: `${germPct}%` }} />
              </div>
            </div>
            )}

            {/* Health */}
            <div className="card">
              <h3 className="font-medium text-garden-900 mb-3">How does it look?</h3>
              <div className="grid grid-cols-4 gap-2">
                {HEALTH_OPTIONS.map(h => (
                  <button key={h} onClick={() => persist({ health: h })}
                    className={`py-2.5 rounded-xl border-2 text-xs font-medium transition-all ${
                      plant.health === h
                        ? HEALTH_COLORS[h]
                        : 'border-garden-100 bg-white text-garden-500 hover:border-garden-300'
                    }`}>
                    {h === 'Excellent' ? '💪' : h === 'Good' ? '👍' : h === 'Fair' ? '😐' : '😟'}<br/>{h}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="card text-center">
                <div className="font-display text-2xl font-semibold text-garden-900">
                  {plant.plantedDate || '—'}
                </div>
                <div className="text-xs text-garden-400 mt-1">Date planted</div>
              </div>
              <div className="card text-center">
                <div className="font-display text-2xl font-semibold text-garden-900">
                  {plant.daysToHarvest > 0 ? `~${plant.daysToHarvest}d` : 'Now!'}
                </div>
                <div className="text-xs text-garden-400 mt-1">To harvest</div>
              </div>
            </div>

            {/* Grow Again */}
            <div className="card">
              <h3 className="font-medium text-garden-900 mb-3">Would you grow this again?</h3>
              <div className="flex gap-3">
                <button onClick={() => saveGrowAgain(true)}
                  className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    growAgain === true
                      ? 'border-garden-500 bg-garden-50 text-garden-800'
                      : 'border-garden-100 bg-white text-garden-600'
                  }`}>
                  ⭐ Grow Again
                </button>
                <button onClick={() => saveGrowAgain(false)}
                  className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    growAgain === false
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : 'border-garden-100 bg-white text-garden-600'
                  }`}>
                  ❌ Skip Next Year
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TIMELINE TAB */}
        {activeTab === 'timeline' && (
          <div className="space-y-3 fade-in">
            <p className="text-sm text-garden-500">Tap a milestone to mark it complete — date and time will be logged automatically</p>
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-garden-100" />
              {MILESTONES.map((m, i) => {
                const doneEntry = timeline.find(x => x.name === m)
                const done = !!doneEntry
                return (
                  <button key={m} onClick={() => toggleMilestone(m)}
                    className="relative flex items-center gap-4 w-full py-3 text-left group">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 z-10 border-2 transition-all ${
                      done
                        ? 'bg-garden-600 border-garden-600'
                        : 'bg-white border-garden-200 group-hover:border-garden-400'
                    }`}>
                      {done
                        ? <CheckCircle2 size={20} className="text-white" />
                        : <span className="text-xs font-medium text-garden-400">{i+1}</span>
                      }
                    </div>
                    <div className={`flex-1 py-3 px-4 rounded-xl border transition-all ${
                      done
                        ? 'bg-garden-50 border-garden-200'
                        : 'bg-white border-garden-100 group-hover:border-garden-200'
                    }`}>
                      <p className={`text-sm font-medium ${done ? 'text-garden-800' : 'text-garden-500'}`}>{m}</p>
                      {done && doneEntry.completedAt && (
                        <p className="text-xs text-garden-500 mt-0.5 font-medium">✅ {doneEntry.completedAt}</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === 'notes' && (
          <div className="space-y-4 fade-in">
            <div className="card">
              <textarea className="w-full text-sm text-garden-800 bg-transparent resize-none outline-none placeholder-garden-300"
                rows={3} placeholder="Add a note... e.g. Added compost today, pruned lower leaves..."
                value={newNote} onChange={e => setNewNote(e.target.value)} />
              <button onClick={addNote} disabled={!newNote.trim()}
                className="btn-primary text-sm disabled:opacity-40 mt-2">
                <Plus size={14} /> Add Note
              </button>
            </div>
            <div className="space-y-2">
              {notes.length === 0 ? (
                <div className="card text-center py-8">
                  <p className="text-garden-400 text-sm">No notes yet</p>
                  <p className="text-garden-300 text-xs mt-1">Add your first note above</p>
                </div>
              ) : notes.map(note => (
                <div key={note.id} className="card flex items-start gap-3">
                  <span className="text-lg">{note.emoji || (note.type === 'system' ? '⚙️' : '📝')}</span>
                  <div className="flex-1">
                    <p className="text-sm text-garden-800">{note.text}</p>
                    <p className="text-xs text-garden-400 mt-1">{note.date}</p>
                  </div>
                  <button onClick={() => deleteNote(note.id)}
                    className="w-6 h-6 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Trash2 size={11} className="text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HARVEST TAB */}
        {activeTab === 'harvest' && (
          <div className="space-y-4 fade-in">
            {totalHarvest > 0 && (
              <div className="card text-center bg-garden-50 border-garden-200">
                <div className="font-display text-4xl font-semibold text-garden-900">{totalHarvest} lbs</div>
                <div className="text-sm text-garden-500 mt-1">Total harvest from {plant.name}</div>
              </div>
            )}
            <button onClick={() => setShowHarvestModal(true)}
              className="w-full btn-primary justify-center py-4 text-base">
              🥕 Log a Harvest
            </button>
            {harvestLog.length === 0 ? (
              <div className="card text-center py-10">
                <p className="text-garden-400 text-sm">No harvests logged yet</p>
                <p className="text-garden-300 text-xs mt-1">Tap above when you're ready to harvest</p>
              </div>
            ) : (
              <div className="space-y-2">
                {harvestLog.map(h => (
                  <div key={h.id} className="card flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-garden-800">{h.weight} {h.unit}</p>
                      <p className="text-xs text-garden-400">{h.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🥕</span>
                      <button onClick={() => deleteHarvest(h.id)}
                        className="w-6 h-6 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center">
                        <Trash2 size={11} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PHOTOS TAB */}
        {activeTab === 'photos' && (
          <div className="space-y-4 fade-in">
            <button className="w-full border-2 border-dashed border-garden-300 rounded-2xl py-10 flex flex-col items-center gap-2 hover:bg-garden-50 transition-colors">
              <Camera size={28} className="text-garden-400" />
              <p className="text-sm font-medium text-garden-600">Add a photo</p>
              <p className="text-xs text-garden-400">Photo uploads coming soon</p>
            </button>
            <p className="text-center text-garden-400 text-sm">No photos yet</p>
          </div>
        )}
      </div>

      {/* WHAT HAPPENED TODAY MODAL */}
      {showTodayModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-semibold text-garden-900">What happened today?</h3>
              <button onClick={() => setShowTodayModal(false)}><X size={20} className="text-garden-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map(action => (
                <button key={action.id} onClick={() => handleQuickAction(action)}
                  className="flex items-center gap-3 p-4 bg-garden-50 hover:bg-garden-100 border border-garden-200 rounded-2xl text-left active:scale-95 transition-all">
                  <span className="text-2xl">{action.emoji}</span>
                  <span className="text-sm font-medium text-garden-800">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* GERMINATION UPDATE MODAL */}
      {showGermModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-semibold text-garden-900">Update sprouted seeds</h3>
              <button onClick={() => setShowGermModal(false)}><X size={20} className="text-garden-400" /></button>
            </div>
            <p className="text-sm text-garden-500 mb-4">How many seeds have sprouted so far?</p>
            <input type="number" min="0" max={plant.seedsPlanted}
              className="input-field text-2xl font-display text-center mb-4"
              value={germSprouted}
              onChange={e => setGermSprouted(parseInt(e.target.value) || 0)} />
            <button onClick={saveGerm} className="w-full btn-primary justify-center py-4">
              <CheckCircle2 size={16} /> Save Update
            </button>
          </div>
        </div>
      )}

      {/* HARVEST MODAL */}
      {showHarvestModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-semibold text-garden-900">Log a harvest</h3>
              <button onClick={() => setShowHarvestModal(false)}><X size={20} className="text-garden-400" /></button>
            </div>
            <HarvestForm onSave={logHarvest} plant={plant} />
          </div>
        </div>
      )}
    </div>
  )
}

function HarvestForm({ onSave, plant }) {
  const [weight, setWeight] = useState('')
  const [unit, setUnit] = useState('lbs')
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-garden-700 mb-1.5">How much did you harvest?</label>
        <div className="flex gap-2">
          <input type="number" min="0" step="0.1" className="input-field flex-1 text-lg"
            placeholder="0.0" value={weight} onChange={e => setWeight(e.target.value)} />
          <div className="flex gap-1">
            {['lbs', 'oz', 'count'].map(u => (
              <button key={u} onClick={() => setUnit(u)}
                className={`px-3 rounded-xl border text-sm font-medium transition-all ${
                  unit === u ? 'bg-garden-600 text-white border-garden-600' : 'bg-white text-garden-600 border-garden-200'
                }`}>
                {u}
              </button>
            ))}
          </div>
        </div>
      </div>
      <button onClick={() => onSave(weight, unit)} disabled={!weight}
        className="w-full btn-primary justify-center py-4 disabled:opacity-40">
        🥕 Save Harvest
      </button>
    </div>
  )
}
