import { useState } from 'react'
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react'

export default function LedgerEntry({ entry, type, onDelete }) {
  const [expanded, setExpanded] = useState(false)

  const isExpense = type === 'expense'
  const isPlantSeed = isExpense && entry.category === 'Plants & Seeds'

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      })
    } catch { return dateStr }
  }

  return (
    <div className={`card border ${isExpense ? 'border-garden-100' : 'border-garden-200 bg-garden-50/30'}`}>
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isExpense
            ? isPlantSeed ? 'bg-garden-100' : 'bg-soil-100'
            : 'bg-garden-100'
        }`}>
          <span className="text-xl">
            {!isExpense ? '💰' : isPlantSeed ? '🌱' : '🔧'}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-garden-900 truncate">{entry.itemName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {entry.store && <span className="text-xs text-garden-400">{entry.store}</span>}
            {entry.soldAt && <span className="text-xs text-garden-400">{entry.soldAt}</span>}
            {(entry.store || entry.soldAt) && <span className="text-garden-200">·</span>}
            <span className="text-xs text-garden-400">{formatDate(entry.date)}</span>
          </div>
        </div>

        {/* Amount */}
        <div className="text-right flex-shrink-0">
          <p className={`font-display text-base font-semibold ${isExpense ? 'text-garden-900' : 'text-garden-600'}`}>
            {!isExpense ? '+' : '-'}${parseFloat(isExpense ? entry.cost : entry.amount).toFixed(2)}
          </p>
          {isExpense && (
            <p className="text-[10px] text-garden-400">{entry.category}</p>
          )}
          {!isExpense && entry.quantity && (
            <p className="text-[10px] text-garden-400">{entry.quantity} {entry.unit}</p>
          )}
        </div>

        {/* Expand + Delete */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {(entry.seedCount || entry.notes) && (
            <button onClick={() => setExpanded(!expanded)}
              className="w-7 h-7 rounded-lg bg-garden-50 hover:bg-garden-100 flex items-center justify-center transition-colors">
              {expanded
                ? <ChevronUp size={13} className="text-garden-500" />
                : <ChevronDown size={13} className="text-garden-500" />}
            </button>
          )}
          <button onClick={onDelete}
            className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors">
            <Trash2 size={11} className="text-red-400" />
          </button>
        </div>
      </div>

      {/* Expanded details */}
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
              <span className="text-garden-800 font-medium">
                ${(parseFloat(entry.cost) / parseInt(entry.seedCount)).toFixed(3)}
              </span>
            </div>
          )}
          {entry.notes && (
            <div className="text-xs text-garden-500 pt-1 border-t border-garden-50">
              {entry.notes}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
