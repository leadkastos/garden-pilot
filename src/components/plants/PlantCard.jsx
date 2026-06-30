import { useState } from 'react'
import { Camera, BarChart2, ChevronRight, Zap, Sprout, X, Check, Trash2 } from 'lucide-react'
export default function PlantCard({ plant, statusColors, onClick, onUpdate, onDelete }) {
  const [showPlantModal, setShowPlantModal] = useState(false)
  const [plantDate, setPlantDate] = useState(new Date().toISOString().slice(0,10))
  const [seedsPlanted, setSeedsPlanted] = useState(plant.seedsInPack || '')
  const isUnplanted = plant.status === 'Unplanted'
  const colors = isUnplanted
    ? { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' }
    : statusColors[plant.status] || statusColors['Growing']
  const germPct = plant.seedsPlanted > 0
    ? Math.round((plant.seedsSprouted / plant.seedsPlanted) * 100)
    : 0
  const healthColor = {
    Excellent: 'text-garden-600',
    Good: 'text-blue-600',
    Fair: 'text-amber-600',
    Poor: 'text-red-600',
  }[plant.health] || 'text-garden-600'
  const isUrgent = plant.nextAction?.toLowerCase().includes('today') ||
                   plant.nextAction?.toLowerCase().includes('!')
  const handleMarkPlanted = (e) => {
    e.stopPropagation()
    setShowPlantModal(true)
  }
  const confirmPlanted = (e) => {
    e.stopPropagation()
    if (onUpdate) {
      onUpdate({
        ...plant,
        status: 'Seeded',
        plantedDate: plantDate,
        seedsPlanted: parseInt(seedsPlanted) || 0,
        nextAction: 'Watch for Sprouts',
        daysToHarvest: 60,
      })
    }
    setShowPlantModal(false)
  }
  return (
    <>
      <div onClick={onClick}
        className={`card cursor-pointer hover:shadow-card-hover active:scale-[0.99] transition-all duration-150 ${
          isUnplanted ? 'border-slate-200 bg-slate-50/50' : ''
        }`}>
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl ${
              isUnplanted ? 'bg-slate-100' : 'bg-garden-100'
            }`}>
              {plant.photo
                ? <img src={plant.photo} alt={plant.name} className="w-full h-full object-cover rounded-2xl" />
                : <span>{getCategoryEmoji(plant.category)}</span>
              }
            </div>
            <div>
              <h3 className="font-display text-base font-semibold text-garden-900 leading-tight">{plant.name}</h3>
              {plant.variety && <p className="text-xs text-garden-400 mt-0.5">{plant.variety}</p>}
              <p className="text-xs text-garden-500 mt-0.5">
                {plant.bed}
                {!isUnplanted && plant.plantedDate && ` · Planted ${plant.plantedDate}`}
                {isUnplanted && ' · Not planted yet'}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <span className={`badge text-[11px] font-medium ${colors.bg} ${colors.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} mr-1`} />
                {plant.status}
              </span>
              {onDelete && (
                <button onClick={e => { e.stopPropagation(); onDelete() }}
                  className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors flex-shrink-0"
                  title="Delete plant">
                  <Trash2 size={12} className="text-red-400" />
                </button>
              )}
            </div>
            {!isUnplanted && <span className={`text-[11px] font-medium ${healthColor}`}>{plant.health}</span>}
          </div>
        </div>
        {/* Unplanted state — seeds in pack info */}
        {isUnplanted && (
          <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-lg">🌱</span>
              <div className="flex-1">
                <p className="text-xs font-medium text-amber-800">Seeds purchased — not planted yet</p>
                {plant.seedsInPack > 0 && (
                  <p className="text-xs text-amber-600 mt-0.5">{plant.seedsInPack} seeds in pack</p>
                )}
                {plant.seedSource && (
                  <p className="text-xs text-amber-600">From: {plant.seedSource}</p>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Germination bar — only when actually planted */}
        {!isUnplanted && plant.seedsPlanted > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-garden-500 mb-1">
              <span>{plant.seedsSprouted} of {plant.seedsPlanted} seeds sprouted</span>
              <span className="font-medium text-garden-700">{germPct}%</span>
            </div>
            <div className="h-2 bg-garden-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-garden-400 to-garden-600 transition-all duration-500"
                style={{ width: `${germPct}%` }} />
            </div>
          </div>
        )}
        {/* Next action — only when planted */}
        {!isUnplanted && plant.nextAction && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-3 ${
            isUrgent ? 'bg-amber-50 border border-amber-200' : 'bg-garden-50 border border-garden-100'
          }`}>
            <Zap size={13} className={isUrgent ? 'text-amber-500' : 'text-garden-500'} />
            <span className={`text-xs font-medium ${isUrgent ? 'text-amber-700' : 'text-garden-700'}`}>
              {plant.nextAction}
            </span>
            {plant.daysToHarvest > 0 && (
              <span className="ml-auto text-[11px] text-garden-400">~{plant.daysToHarvest}d to harvest</span>
            )}
          </div>
        )}
        {/* Action buttons */}
        {isUnplanted ? (
          <button
            onClick={handleMarkPlanted}
            className="w-full py-2.5 bg-garden-600 hover:bg-garden-700 text-white rounded-xl text-xs font-medium active:scale-95 transition-all flex items-center justify-center gap-2">
            <Sprout size={14} /> Mark as Planted
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={e => { e.stopPropagation(); onClick() }}
              className="flex-1 text-xs py-2 bg-garden-600 text-white rounded-xl font-medium hover:bg-garden-700 active:scale-95 transition-all text-center">
              What Happened Today?
            </button>
            <button onClick={e => { e.stopPropagation(); onClick() }}
              className="px-3 py-2 bg-garden-50 border border-garden-200 rounded-xl hover:bg-garden-100 active:scale-95 transition-all">
              <Camera size={14} className="text-garden-600" />
            </button>
            <button onClick={e => { e.stopPropagation(); onClick() }}
              className="px-3 py-2 bg-garden-50 border border-garden-200 rounded-xl hover:bg-garden-100 active:scale-95 transition-all">
              <BarChart2 size={14} className="text-garden-600" />
            </button>
            <button onClick={e => { e.stopPropagation(); onClick() }}
              className="px-3 py-2 bg-garden-50 border border-garden-200 rounded-xl hover:bg-garden-100 active:scale-95 transition-all">
              <ChevronRight size={14} className="text-garden-600" />
            </button>
          </div>
        )}
      </div>
      {/* Mark as Planted Modal */}
      {showPlantModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4"
          onClick={e => e.stopPropagation()}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-garden-100">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold text-garden-900">
                  🌱 Mark as Planted
                </h3>
                <button onClick={e => { e.stopPropagation(); setShowPlantModal(false) }}>
                  <X size={18} className="text-garden-400" />
                </button>
              </div>
              <p className="text-xs text-garden-500 mt-1">{plant.name}</p>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-garden-700 mb-1.5">
                  When did you plant them?
                </label>
                <input type="date" className="input-field"
                  value={plantDate} onChange={e => setPlantDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-garden-700 mb-1.5">
                  How many seeds did you plant?
                </label>
                <input type="number" min="0" className="input-field"
                  placeholder={`e.g. ${plant.seedsInPack || 10}`}
                  value={seedsPlanted} onChange={e => setSeedsPlanted(e.target.value)} />
                {plant.seedsInPack > 0 && (
                  <p className="text-xs text-garden-400 mt-1">
                    You have {plant.seedsInPack} seeds in the pack
                  </p>
                )}
              </div>
            </div>
            <div className="px-5 py-4 border-t border-garden-100 flex gap-3">
              <button onClick={e => { e.stopPropagation(); setShowPlantModal(false) }}
                className="btn-secondary flex-1 justify-center py-2.5 text-sm">
                Cancel
              </button>
              <button onClick={confirmPlanted}
                className="btn-primary flex-1 justify-center py-2.5 text-sm">
                <Check size={14} /> Confirm Planted
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
function getCategoryEmoji(category) {
  const map = {
    Tomato: '🍅', Pepper: '🌶️', Lettuce: '🥬', Cucumber: '🥒',
    Basil: '🌿', Herb: '🌿', Carrot: '🥕', Squash: '🎃',
    Flower: '🌸', Bean: '🫘', Corn: '🌽', Onion: '🧅',
    Garlic: '🧄', Zucchini: '🥒', Default: '🌱'
  }
  return map[category] || map['Default']
}
