import { useState, useEffect } from 'react'
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/AuthContext'
import { checkFrostRisk } from '../../lib/frostCheck'

const CHECKOUT_URL = 'https://realworldbusiness.co/garden-navi-176819'

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

const STEPS = ['Plant Info', 'Seed Source', 'Planting', 'Location', 'Bed', 'Done']

export default function AddPlantWizard({ onSave, onCancel }) {
  const { user, profile, isReadOnly } = useAuth()
  const [step, setStep] = useState(0)
  const [beds, setBeds] = useState([])
  const [frostModal, setFrostModal] = useState(null)
  const [frostDismissedKey, setFrostDismissedKey] = useState('')
  const [data, setData] = useState({
    name: '', variety: '', category: '',
    seedSource: '', seedPacketName: '', purchaseYear: '',
    seedsInPack: '',
    notPlantedYet: false,
    seedsPlanted: '', plantedDate: '', startLocation: '', germDays: '',
    daysToMaturity: '', productionWeeks: '',
    bed: '', sunExposure: '', notes: '',
    status: 'Seeded', health: 'Good', seedsSprouted: 0,
    nextAction: 'Watch for Sprouts', daysToHarvest: 60,
    bedAssignment: null, // 'existing', 'later', 'none'
    assignedBedId: null,
    photo: null
  })

  // Load existing beds from Supabase
  useEffect(() => {
    if (!user) return
    const loadBeds = async () => {
      const { data: bedRows, error } = await supabase
        .from('beds')
        .select('*')
        .eq('user_id', user.id)
      if (!error) setBeds(bedRows || [])
    }
    loadBeds()
  }, [user])

  const update = (field, val) => setData(d => ({ ...d, [field]: val }))

  // Pop the frost modal when a warning-level risk first appears for the current inputs
  useEffect(() => {
    if (data.notPlantedYet) return
    const risk = checkFrostRisk({
      planting: data.plantedDate,
      maturityDays: data.daysToMaturity,
      productionWeeks: data.productionWeeks,
      springFrost: profile?.last_spring_frost,
      fallFrost: profile?.first_fall_frost,
    })
    if (risk && risk.level === 'warning') {
      const key = `${data.plantedDate}|${data.daysToMaturity}|${data.productionWeeks}`
      if (key !== frostDismissedKey) setFrostModal(risk)
    } else {
      setFrostModal(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.plantedDate, data.daysToMaturity, data.productionWeeks, data.notPlantedYet, profile?.last_spring_frost, profile?.first_fall_frost])

  const canNext = () => {
    if (step === 0) return data.name.trim() && data.category
    if (step === 2) {
      // If not planting yet, no planting details required
      if (data.notPlantedYet) return true
      return data.seedsPlanted && data.plantedDate
    }
    return true
  }

  const getEmoji = () => CATEGORIES.find(c => c.label === data.category)?.emoji || '🌱'

  const handleSave = () => {
    if (isReadOnly) {
      if (window.confirm('Your trial has ended. Subscribe to add new plants. Go to checkout now?')) {
        window.location.href = CHECKOUT_URL
      }
      return
    }
    const plant = {
      ...data,
      seedsPlanted: data.notPlantedYet ? 0 : (parseInt(data.seedsPlanted) || 0),
      germRate: 0,
      status: data.notPlantedYet ? 'Unplanted' : data.status,
      plantedDate: data.notPlantedYet ? '' : data.plantedDate,
      nextAction: data.notPlantedYet ? 'Ready to plant' : data.nextAction,
      // Unplanted seeds never get a bed
      bed: data.notPlantedYet
        ? '—'
        : data.assignedBedId
          ? beds.find(b => b.id === data.assignedBedId)?.name || data.bed
          : data.bedAssignment === 'later' ? '⚠️ Needs a bed' : data.bed || '—'
    }
    onSave(plant)
  }

  // When "not planted yet" is checked, jump Planting -> Review (skip Location + Bed)
  const handleNext = () => {
    if (step === 2 && data.notPlantedYet) { setStep(5); return }
    if (step === 4) { setStep(5); return }
    setStep(s => s + 1)
  }

  const handleBack = () => {
    // Coming back from Review when unplanted returns to Planting
    if (step === 5 && data.notPlantedYet) { setStep(2); return }
    setStep(s => s - 1)
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
          {STEPS.slice(0, -1).map((s, i) => (
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
                  <button key={c.label} onClick={() => {
                    update('category', c.label)
                    // Auto-fill name only if empty or previously auto-filled from a category
                    if (!data.name || CATEGORIES.some(cat => cat.label === data.name)) {
                      update('name', c.label)
                    }
                  }}
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
                  <label className="block text-sm font-medium text-garden-700 mb-1.5">Seeds in pack <span className="text-garden-400 font-normal">(optional)</span></label>
                  <input className="input-field" type="number" min="0" placeholder="e.g. 50"
                    value={data.seedsInPack} onChange={e => update('seedsInPack', e.target.value)} />
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

            {/* Not-planted-yet toggle */}
            <button
              onClick={() => update('notPlantedYet', !data.notPlantedYet)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                data.notPlantedYet
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-garden-100 bg-white hover:border-amber-300'
              }`}>
              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                data.notPlantedYet ? 'bg-amber-400 border-amber-400' : 'border-garden-300 bg-white'
              }`}>
                {data.notPlantedYet && <Check size={14} className="text-white" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-garden-900">I haven't planted these yet</p>
                <p className="text-xs text-garden-400">Just tracking the seeds for now — plant them later</p>
              </div>
            </button>

            {!data.notPlantedYet && (
              <>
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
                <div>
                  <label className="block text-sm font-medium text-garden-700 mb-1.5">Days to maturity <span className="text-garden-400 font-normal">(from seed packet)</span></label>
                  <input className="input-field" type="number" placeholder="e.g. 60"
                    value={data.daysToMaturity} onChange={e => update('daysToMaturity', e.target.value)} />
                  <p className="text-xs text-garden-400 mt-1">How long until it's ready to harvest. Powers frost warnings.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-garden-700 mb-1.5">How long does it produce? <span className="text-garden-400 font-normal">(weeks, optional)</span></label>
                  <input className="input-field" type="number" placeholder="e.g. 3"
                    value={data.productionWeeks} onChange={e => update('productionWeeks', e.target.value)} />
                  <p className="text-xs text-garden-400 mt-1">For plants you pick repeatedly (beans, zinnias). Leave blank for single-harvest plants.</p>
                </div>

                {(() => {
                  const risk = checkFrostRisk({
                    planting: data.plantedDate,
                    maturityDays: data.daysToMaturity,
                    productionWeeks: data.productionWeeks,
                    springFrost: profile?.last_spring_frost,
                    fallFrost: profile?.first_fall_frost,
                  })
                  if (!risk) return null
                  const isWarn = risk.level === 'warning'
                  return (
                    <div className={`rounded-xl p-3 border ${isWarn ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
                      <div className="flex items-start gap-2">
                        <span className="text-lg flex-shrink-0">{isWarn ? '⚠️' : '⏳'}</span>
                        <p className={`text-xs leading-relaxed ${isWarn ? 'text-amber-800' : 'text-blue-800'}`}>{risk.message}</p>
                      </div>
                    </div>
                  )
                })()}
              </>
            )}
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div className="space-y-4 fade-in">
            <div>
              <h2 className="font-display text-2xl font-semibold text-garden-900 mb-1">Any other details?</h2>
              <p className="text-garden-500 text-sm">Optional — you can skip this</p>
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

        {/* Step 4: WHERE DOES THIS PLANT GO? */}
        {step === 4 && (
          <div className="space-y-4 fade-in">
            <div>
              <h2 className="font-display text-2xl font-semibold text-garden-900 mb-1">
                Where does this plant go?
              </h2>
              <p className="text-garden-500 text-sm">
                Assign {data.name} to a garden bed so everything stays connected
              </p>
            </div>

            {/* Option 1 — Assign to existing bed */}
            {beds.length > 0 && (
              <div>
                <p className="text-xs font-medium text-garden-600 mb-2">Assign to an existing bed</p>
                <div className="space-y-2">
                  {beds.map(bed => (
                    <button key={bed.id}
                      onClick={() => { update('assignedBedId', bed.id); update('bedAssignment', 'existing') }}
                      className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                        data.assignedBedId === bed.id
                          ? 'border-garden-500 bg-garden-50'
                          : 'border-garden-100 bg-white hover:border-garden-300'
                      }`}>
                      <div className="w-10 h-10 bg-garden-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">🛏️</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-garden-900">{bed.name}</p>
                        <p className="text-xs text-garden-400">
                          {bed.length}ft × {bed.width}ft · {(bed.plants || []).reduce((s, p) => s + (p.placed?.length || 0), 0)} plants
                        </p>
                      </div>
                      {data.assignedBedId === bed.id && (
                        <div className="w-6 h-6 bg-garden-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-garden-100" />
              <span className="text-xs text-garden-400">or</span>
              <div className="flex-1 h-px bg-garden-100" />
            </div>

            {/* Option 2 — Create a bed later */}
            <button
              onClick={() => { update('bedAssignment', 'later'); update('assignedBedId', null) }}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                data.bedAssignment === 'later' && !data.assignedBedId
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-garden-100 bg-white hover:border-amber-300'
              }`}>
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-xl">⏳</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-garden-900">I'll create a bed for it later</p>
                <p className="text-xs text-garden-400">Plant will show a "Needs a bed" reminder</p>
              </div>
              {data.bedAssignment === 'later' && !data.assignedBedId && (
                <div className="w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-white" />
                </div>
              )}
            </button>

            {/* Option 3 — No bed needed */}
            <button
              onClick={() => { update('bedAssignment', 'none'); update('assignedBedId', null) }}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                data.bedAssignment === 'none'
                  ? 'border-garden-400 bg-garden-50'
                  : 'border-garden-100 bg-white hover:border-garden-300'
              }`}>
              <div className="w-10 h-10 bg-garden-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-xl">🪴</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-garden-900">No bed needed</p>
                <p className="text-xs text-garden-400">Container, direct sow, or standalone plant</p>
              </div>
              {data.bedAssignment === 'none' && (
                <div className="w-6 h-6 bg-garden-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check size={12} className="text-white" />
                </div>
              )}
            </button>
          </div>
        )}

        {/* Step 5: Confirm */}
        {step === 5 && (
          <div className="space-y-4 fade-in">
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-garden-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-4xl">
                {getEmoji()}
              </div>
              <h2 className="font-display text-2xl font-semibold text-garden-900 mb-1">{data.name}</h2>
              {data.variety && <p className="text-garden-500 text-sm">{data.variety}</p>}
            </div>
            <div className="card space-y-3">
              {(data.notPlantedYet
                ? [
                    ['Category', data.category],
                    ['Seed source', data.seedSource || '—'],
                    ['Seeds in pack', data.seedsInPack || '—'],
                    ['Status', '🟡 Not planted yet'],
                  ]
                : [
                    ['Category', data.category],
                    ['Seed source', data.seedSource || '—'],
                    ['Seeds planted', data.seedsPlanted || '—'],
                    ['Planted', data.plantedDate || '—'],
                    ['Starting location', data.startLocation || '—'],
                    ['Assigned bed', data.assignedBedId
                      ? beds.find(b => b.id === data.assignedBedId)?.name
                      : data.bedAssignment === 'later' ? '⚠️ Needs a bed'
                      : data.bedAssignment === 'none' ? 'No bed needed'
                      : '—'],
                  ]
              ).map(([label, val]) => (
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

      {/* Frost warning popup */}
      {frostModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className="px-5 pt-6 pb-4 text-center">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="font-display text-lg font-semibold text-garden-900 mb-2">
                {frostModal.kind === 'too-early' ? 'Planting a bit early' : 'Frost timing warning'}
              </h3>
              <p className="text-sm text-garden-600 leading-relaxed">{frostModal.message}</p>
            </div>
            <div className="px-5 pb-5 pt-1">
              <button
                onClick={() => {
                  setFrostDismissedKey(`${data.plantedDate}|${data.daysToMaturity}|${data.productionWeeks}`)
                  setFrostModal(null)
                }}
                className="w-full btn-primary justify-center py-3 text-sm">
                Got it — continue anyway
              </button>
              <p className="text-center text-xs text-garden-400 mt-2">Dates are estimates and vary year to year.</p>
            </div>
          </div>
        </div>
      )}
      {/* Bottom nav */}
      {step < 5 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-garden-100 px-4 py-3 flex gap-3">
          {step > 0 && (
            <button onClick={handleBack} className="btn-secondary flex-shrink-0">
              <ArrowLeft size={16} />
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={step < 4 && !canNext()}
            className="btn-primary flex-1 justify-center py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed">
            {(step === 4 || (step === 2 && data.notPlantedYet)) ? 'Review & Save' : 'Continue'}
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
