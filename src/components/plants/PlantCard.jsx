import { Camera, BarChart2, Droplets, ChevronRight, Zap } from 'lucide-react'

export default function PlantCard({ plant, statusColors, onClick }) {
  const colors = statusColors[plant.status] || statusColors['Growing']
  const germPct = plant.seedsPlanted > 0 ? Math.round((plant.seedsSprouted / plant.seedsPlanted) * 100) : 0

  const healthColor = {
    Excellent: 'text-garden-600',
    Good: 'text-blue-600',
    Fair: 'text-amber-600',
    Poor: 'text-red-600',
  }[plant.health] || 'text-garden-600'

  const isUrgent = plant.nextAction?.toLowerCase().includes('today') ||
                   plant.nextAction?.toLowerCase().includes('!')

  return (
    <div onClick={onClick}
      className="card cursor-pointer hover:shadow-card-hover active:scale-[0.99] transition-all duration-150">

      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {/* Plant avatar */}
          <div className="w-12 h-12 rounded-2xl bg-garden-100 flex items-center justify-center flex-shrink-0 text-2xl">
            {plant.photo ? (
              <img src={plant.photo} alt={plant.name} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <span>{getCategoryEmoji(plant.category)}</span>
            )}
          </div>
          <div>
            <h3 className="font-display text-base font-semibold text-garden-900 leading-tight">{plant.name}</h3>
            {plant.variety && <p className="text-xs text-garden-400 mt-0.5">{plant.variety}</p>}
            <p className="text-xs text-garden-500 mt-0.5">{plant.bed} · Planted {plant.plantedDate}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className={`badge text-[11px] font-medium ${colors.bg} ${colors.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} mr-1`} />
            {plant.status}
          </span>
          <span className={`text-[11px] font-medium ${healthColor}`}>{plant.health}</span>
        </div>
      </div>

      {/* Germination bar */}
      {plant.seedsPlanted > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-garden-500 mb-1">
            <span>{plant.seedsSprouted} of {plant.seedsPlanted} seeds sprouted</span>
            <span className="font-medium text-garden-700">{germPct}%</span>
          </div>
          <div className="h-2 bg-garden-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-garden-400 to-garden-600 transition-all duration-500"
              style={{ width: `${germPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Next action */}
      {plant.nextAction && (
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
          {plant.daysToHarvest === 0 && plant.status === 'Harvesting' && (
            <span className="ml-auto text-[11px] font-medium text-red-500">Harvest now!</span>
          )}
        </div>
      )}

      {/* Action buttons */}
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
    </div>
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
