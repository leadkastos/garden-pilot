import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, X, Leaf } from 'lucide-react'

const SEED_SOURCES = [
  "Johnny's Seeds", "Burpee", "Baker Creek", "Home Depot",
  "Lowe's", "Local Garden Center", "Saved Seeds", "Gifted Seeds", "Other"
]
const START_LOCATIONS = [
  "Indoors", "Seed Tray", "Greenhouse", "Raised Bed",
  "Garden Bed", "Container", "Direct Sow"
]
const CATEGORIES = [
  { label: "Tomato", emoji: "🍅" },
  { label: "Pepper", emoji: "🌶️" },
  { label: "Lettuce", emoji: "🥬" },
  { label: "Cucumber", emoji: "🥒" },
  { label: "Herb", emoji: "🌿" },
  { label: "Carrot", emoji: "🥕" },
  { label: "Squash", emoji: "🎃" },
  { label: "Flower", emoji: "🌸" },
  { label: "Bean", emoji: "🫘" },
  { label: "Corn", emoji: "🌽" },
  { label: "Onion", emoji: "🧅" },
  { label: "Other", emoji: "🌱" },
]

const STEPS = ['Plant Info', 'Seed Source', 'Planting', 'Location', 'Done']

export default function AddPlantWizard({ onSave, onCancel }) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState({
    name: '', variety: '', category: '',
    seedSource: '', seedPacketName: '', purchaseYear: '',
    seedsPlanted: '', plantedDate: '', startLocation: '', germDays: '',
    bed: '', sunExposure: '', notes: '',
    status: 'Seeded', health: 'Good', seedsSprouted: 0,
    nextAction: 'Watch for Sprouts', daysToHarvest: 60,
    photo: null
  })

  const update = (field, val) => setData(d => ({ ...d, [field]: val }))

  const canNext = () => {
    if (step === 0) return data.name.trim() && data.category
    if (step === 2) return data.seedsPlanted && data.plantedDate
    return true
  }

  const handleSave = () => {
    onSave({
      ...data,
      seedsPlanted: parseInt(data.seedsPlanted) || 0,
      germRate: 0,
    })
  }

  return (
    <div className="min-h-screen bg-parchment">
      {/* Header */}
      <div className="bg-garden-800 px-4 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onCancel} className="text-garden-300 hover:text-white">
            <X size={20} />
          </button>
          <span className="text-white font-medium">Add a Plant</span>
        </div>
        {/* Progress */}
        <div className="flex gap-1.5">
          {STEPS.slice(0,-1).map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1.5 rounded-full transition-all ${i <= step ? 'bg-garden-400' : 'bg-garden-700'}`} />
              <p className={`text-[10px] mt-1 ${i === step ? 'text-garden-300' : 'text-garden-600'}`}>{s}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-5 space-y-4 max-w-lg mx-auto">

        {/* Step 0: Plant Info */}
        {step === 0 && (
          <div className="space-y-4 fade-in">
            <div>
              <h2 className="font-display text-2xl font-semibold text-garden-900 mb-1">What are you growing?</h2>
              <p className="text-garden-500 text-sm">Start with the basics</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-garden-700 mb-1.5">Plant name *</label>
              <input className="input-field text-base" placeholder="e.g. Roma Tomato"
                value={data.name} onChange={e => update('name', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-garden-700 mb-1.5">Variety <span className="text-garden-400 font-normal">(optional)</span></label>
              <input className="input-field" placeholder="e.g. San Marzano, Celebrity"
                value={data.variety} onChange={e => update('variety', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-garden-700 mb-2">Plant type *</label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map(c => (
                  <button key={c.label} onClick={() => update('category', c.label)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                      data.category === c.label
                        ? 'border-garden-500 bg-garden-50'
                        : 'border-garden-100 bg-white hover:border-garden-300'
                    }`}>
                    <span className="text-2xl">{c.emoji}</span>
                    <span className="text-xs font-medium text-garden-700">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Seed Source */}
        {step === 1 && (
          <div className="space-y-4 fade-in">
            <div>
              <h2 className="font-display text-2xl font-semibold text-garden-900 mb-1">Where did the seeds come from?</h2>
              <p className="text-garden-500 text-sm">This helps track which sources work best</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SEED_SOURCES.map(s => (
                <button key={s} onClick={() => update('seedSource', s)}
                  className={`p-3 rounded-xl border-2 text-sm font-medium text-left transition-all ${
                    data.seedSource === s
                      ? 'border-garden-500 bg-garden-50 text-garden-800'
                      : 'border-garden-100 bg-white text-garden-600 hover:border-garden-300'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
            {data.seedSource && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-garden-700 mb-1.5">Seed packet name <span className="text-garden-400 font-normal">(optional)</span></label>
                  <input className="input-field" placeholder="Name on the packet"
                    value={data.seedPacketName} onChange={e => update('seedPacketName', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-garden-700 mb-1.5">Purchase year <span className="text-garden-400 font-normal">(optional)</span></label>
                  <input className="input-field" placeholder="e.g. 2026"
                    value={data.purchaseYear} onChange={e => update('purchaseYear', e.target.value)} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Planting */}
        {step === 2 && (
          <div className="space-y-4 fade-in">
            <div>
              <h2 className="font-display text-2xl font-semibold text-garden-900 mb-1">Planting details</h2>
              <p className="text-garden-500 text-sm">Tell us how many you planted and when</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-garden-700 mb-1.5">How many seeds did you plant? *</label>
              <input className="input-field text-lg font-medium" type="number" min="1" placeholder="e.g. 24"
                value={data.seedsPlanted} onChange={e => update('seedsPlanted', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-garden-700 mb-1.5">When did you plant them? *</label>
              <input className="input-field" type="date"
                value={data.plantedDate} onChange={e => update('plantedDate', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-garden-700 mb-2">Where did you start them?</label>
              <div className="grid grid-cols-2 gap-2">
                {START_LOCATIONS.map(l => (
                  <button key={l} onClick={() => update('startLocation', l)}
                    className={`p-3 rounded-xl border-2 text-sm font-medium text-left transition-all ${
                      data.startLocation === l
                        ? 'border-garden-500 bg-garden-50 text-garden-800'
                        : 'border-garden-100 bg-white text-garden-600 hover:border-garden-300'
                    }`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-garden-700 mb-1.5">Expected days to sprout <span className="text-garden-400 font-normal">(optional)</span></label>
              <input className="input-field" type="number" placeholder="e.g. 7"
                value={data.germDays} onChange={e => update('germDays', e.target.value)} />
            </div>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div className="space-y-4 fade-in">
            <div>
              <h2 className="font-display text-2xl font-semibold text-garden-900 mb-1">Where will it live?</h2>
              <p className="text-garden-500 text-sm">Helps organize your garden layout</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-garden-700 mb-1.5">Bed or container name</label>
              <input className="input-field" placeholder="e.g. Bed #2, Front Container, Greenhouse A"
                value={data.bed} onChange={e => update('bed', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-garden-700 mb-2">Sun exposure</label>
              <div className="grid grid-cols-3 gap-2">
                {['Full Sun', 'Part Sun', 'Shade'].map(s => (
                  <button key={s} onClick={() => update('sunExposure', s)}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      data.sunExposure === s
                        ? 'border-garden-500 bg-garden-50 text-garden-800'
                        : 'border-garden-100 bg-white text-garden-600 hover:border-garden-300'
                    }`}>
                    {s === 'Full Sun' ? '☀️' : s === 'Part Sun' ? '⛅' : '🌥️'} {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-garden-700 mb-1.5">Notes <span className="text-garden-400 font-normal">(optional)</span></label>
              <textarea className="input-field resize-none" rows={3}
                placeholder="Anything else worth noting..."
                value={data.notes} onChange={e => update('notes', e.target.value)} />
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div className="space-y-4 fade-in">
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-garden-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-4xl">
                {CATEGORIES.find(c => c.label === data.category)?.emoji || '🌱'}
              </div>
              <h2 className="font-display text-2xl font-semibold text-garden-900 mb-1">{data.name}</h2>
              {data.variety && <p className="text-garden-500 text-sm">{data.variety}</p>}
            </div>
            <div className="card space-y-3">
              {[
                ['Category', data.category],
                ['Seed source', data.seedSource || '—'],
                ['Seeds planted', data.seedsPlanted || '—'],
                ['Planted', data.plantedDate || '—'],
                ['Location', data.startLocation || '—'],
                ['Bed', data.bed || '—'],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-garden-500">{label}</span>
                  <span className="text-garden-800 font-medium">{val}</span>
                </div>
              ))}
            </div>
            <button onClick={handleSave}
              className="w-full btn-primary justify-center py-4 text-base">
              <Check size={18} /> Save Plant
            </button>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      {step < 4 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-garden-100 px-4 py-3 flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="btn-secondary flex-shrink-0">
              <ArrowLeft size={16} />
            </button>
          )}
          <button onClick={() => step === 3 ? setStep(4) : setStep(s => s + 1)}
            disabled={!canNext()}
            className="btn-primary flex-1 justify-center py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed">
            {step === 3 ? 'Review & Save' : 'Continue'}
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
