import { useState } from 'react'
import { Trash2, ChevronDown, ChevronUp, AlertTriangle, Check } from 'lucide-react'

export default function LedgerEntry({ entry, type, onDelete, isTracked, onImportToPlants }) {
  const [expanded, setExpanded] = useState(false)
  const [showImportConfirm, setShowImportConfirm] = useState(false)

  const isExpense = type === 'expense'
  const isPlantSeed = isExpense && entry.category === 'Plants & Seeds'
  const showWarning = isPlantSeed && !isTracked

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      })
    } catch { return dateStr }
  }

  return (
    <>
      <div className={`card border ${isExpense ? 'border-garden-100' : 'border-garden-200 bg-garden-50/30'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isExpense ? isPlantSeed ? 'bg-garden-100' : 'bg-soil-100' : 'bg-garden-100'
          }`}>
            <span className="text-xl">{!isExpense ? '💰' : isPlantSeed ? '🌱' : '🔧'}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-garden-900 truncate">{entry.itemName}</p>
              {showWarning && (
                <button onClick={(e) => { e.stopPropagation(); setShowImportConfirm(true) }}
                  className="flex-shrink-0 group relative"
                  title="Not tracked in My Plants yet">
                  <AlertTriangle size={15} className="text-amber-500 hover:text-amber-600 transition-colors" />
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-44 text-[10px] bg-amber-900 text-white px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center z-10">
                    Not in My Plants yet — click to track
                  </span>
                </button>
              )}
              {isPlantSeed && isTracked && (
                <Check size={14} className="text-garden-500 flex-shrink-0" title="Added to My Plants" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {entry.store && <span className="text-xs text-garden-400">{entry.store}</span>}
              {entry.soldAt && <span className="text-xs text-garden-400">{entry.soldAt}</span>}
              {(entry.store || entry.soldAt) && <span className="text-garden-200">·</span>}
              <span className="text-xs text-garden-400">{formatDate(entry.date)}</span>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <p className={`font-display text-base font-semibold ${isExpense ? 'text-garden-900' : 'text-garden-600'}`}>
              {!isExpense ? '+' : '-'}${parseFloat(isExpense ? entry.cost : entry.amount).toFixed(2)}
            </p>
            {isExpense && <p className="text-[10px] text-garden-400">{entry.category}</p>}
            {!isExpense && entry.quantity && <p className="text-[10px] text-garden-400">{entry.quantity} {entry.unit}</p>}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {(entry.seedCount || entry.notes) && (
              <button onClick={() => setExpanded(!expanded)}
                className="w-7 h-7 rounded-lg bg-garden-50 hover:bg-garden-100 flex items-center justify-center transition-colors">
                {expanded ? <ChevronUp size={13} className="text-garden-500" /> : <ChevronDown size={13} className="text-garden-500" />}
              </button>
            )}
            <button onClick={onDelete}
              className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors">
              <Trash2 size={11} className="text-red-400" />
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-garden-100 space-y-1.5">
            {entry.seedCount && (
              <div className="flex justify-between text-xs">
                <span className="text-garden-500">Seeds in pack</span>
                <span className="text-garden-800 font-medium">{entry.seedCount} seeds</span>
              </div>
            )}
            {entry.seedCount && entry.cost && (
              <div className="flex justify-between text-xs">
                <span className="text-garden-500">Cost per seed</span>
                <span className="text-garden-800 font-medium">${(parseFloat(entry.cost) / parseInt(entry.seedCount)).toFixed(3)}</span>
              </div>
            )}
            {entry.notes && (
              <div className="text-xs text-garden-500 pt-1 border-t border-garden-50">{entry.notes}</div>
            )}
          </div>
        )}
      </div>

      {showImportConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-garden-100">
              <h3 className="font-display text-lg font-semibold text-garden-900 mb-1">Add to My Plants?</h3>
              <p className="text-sm text-garden-500">
                <span className="font-medium text-garden-800">{entry.itemName}</span> will be added to My Plants as "Unplanted" so you can track it when you're ready to sow.
              </p>
            </div>
            <div className="px-5 py-4 flex gap-3">
              <button onClick={() => setShowImportConfirm(false)}
                className="btn-secondary flex-1 justify-center py-2.5 text-sm">Not now</button>
              <button onClick={() => { onImportToPlants(); setShowImportConfirm(false) }}
                className="btn-primary flex-1 justify-center py-2.5 text-sm">✅ Yes, track it</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
