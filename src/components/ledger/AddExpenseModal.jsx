import { useState } from 'react'
import { X, Check } from 'lucide-react'

const STORES = [
  "Johnny's Seeds", "Burpee", "Baker Creek", "Park Seed",
  "Home Depot", "Lowe's", "Local Garden Center", "Amazon",
  "Tractor Supply", "Walmart", "Online", "Other"
]

export default function AddExpenseModal({ onSave, onClose }) {
  const [category, setCategory] = useState('')
  const [itemName, setItemName] = useState('')
  const [store, setStore] = useState('')
  const [customStore, setCustomStore] = useState('')
  const [cost, setCost] = useState('')
  const [seedCount, setSeedCount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')

  const canSave = category && itemName.trim() && cost

  const handleSave = () => {
    if (!canSave) return
    onSave({
      category,
      itemName: itemName.trim(),
      store: store === 'Other' ? customStore : store,
      cost: parseFloat(cost),
      seedCount: seedCount ? parseInt(seedCount) : null,
      date,
      notes: notes.trim(),
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-garden-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-semibold text-garden-900">Add expense</h3>
            <button onClick={onClose}><X size={20} className="text-garden-400" /></button>
          </div>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1 space-y-4">

          {/* Category — first and required */}
          <div>
            <label className="block text-sm font-medium text-garden-700 mb-2">Category *</label>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setCategory('Plants & Seeds')}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                  category === 'Plants & Seeds'
                    ? 'border-garden-500 bg-garden-50'
                    : 'border-garden-100 bg-white hover:border-garden-300'
                }`}>
                <span className="text-3xl">🌱</span>
                <span className="text-sm font-medium text-garden-800">Plants & Seeds</span>
              </button>
              <button onClick={() => setCategory('Supplies')}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                  category === 'Supplies'
                    ? 'border-garden-500 bg-garden-50'
                    : 'border-garden-100 bg-white hover:border-garden-300'
                }`}>
                <span className="text-3xl">🔧</span>
                <span className="text-sm font-medium text-garden-800">Supplies</span>
              </button>
            </div>
            {category === 'Plants & Seeds' && (
              <p className="text-xs text-garden-500 mt-2 flex items-center gap-1">
                🌿 You'll be able to import this into My Plants after saving
              </p>
            )}
          </div>

          {/* Item name */}
          <div>
            <label className="block text-sm font-medium text-garden-700 mb-1.5">
              What did you buy? *
            </label>
            <input className="input-field" placeholder={
              category === 'Plants & Seeds' ? 'e.g. Roma Tomato Seeds, Zinnia Mix' : 'e.g. Compost, Garden Hose, Fertilizer'
            }
              value={itemName} onChange={e => setItemName(e.target.value)} />
          </div>

          {/* Store */}
          <div>
            <label className="block text-sm font-medium text-garden-700 mb-2">
              Where did you buy it? <span className="text-garden-400 font-normal">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {STORES.map(s => (
                <button key={s} onClick={() => setStore(s)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${
                    store === s
                      ? 'bg-garden-600 text-white border-garden-600'
                      : 'bg-white text-garden-600 border-garden-200 hover:border-garden-400'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
            {store === 'Other' && (
              <input className="input-field mt-2 text-sm" placeholder="Type store or source name"
                value={customStore} onChange={e => setCustomStore(e.target.value)} />
            )}
          </div>

          {/* Cost */}
          <div>
            <label className="block text-sm font-medium text-garden-700 mb-1.5">How much did it cost? *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-garden-400 font-medium">$</span>
              <input type="number" min="0" step="0.01" className="input-field pl-7"
                placeholder="0.00" value={cost} onChange={e => setCost(e.target.value)} />
            </div>
          </div>

          {/* Seed count — only for Plants & Seeds */}
          {category === 'Plants & Seeds' && (
            <div>
              <label className="block text-sm font-medium text-garden-700 mb-1.5">
                How many seeds in the pack? <span className="text-garden-400 font-normal">(optional)</span>
              </label>
              <input type="number" min="0" className="input-field"
                placeholder="e.g. 50" value={seedCount} onChange={e => setSeedCount(e.target.value)} />
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-garden-700 mb-1.5">Date</label>
            <input type="date" className="input-field"
              value={date} onChange={e => setDate(e.target.value)} />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-garden-700 mb-1.5">
              Notes <span className="text-garden-400 font-normal">(optional)</span>
            </label>
            <textarea className="input-field resize-none text-sm" rows={2}
              placeholder="Any additional notes..."
              value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-garden-100 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center py-2.5">
            Cancel
          </button>
          <button onClick={handleSave} disabled={!canSave}
            className="btn-primary flex-1 justify-center py-2.5 disabled:opacity-40">
            <Check size={15} /> Save Expense
          </button>
        </div>
      </div>
    </div>
  )
}
