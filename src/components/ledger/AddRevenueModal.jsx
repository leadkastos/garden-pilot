import { useState } from 'react'
import { X, Check } from 'lucide-react'

const SELL_LOCATIONS = [
  "Farmers Market", "Roadside Stand", "Neighbor", "CSA Box",
  "Restaurant", "Online", "Friend/Family", "Other"
]

export default function AddRevenueModal({ onSave, onClose }) {
  const [itemName, setItemName] = useState('')
  const [soldAt, setSoldAt] = useState('')
  const [customLocation, setCustomLocation] = useState('')
  const [amount, setAmount] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('bunches')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')

  const canSave = itemName.trim() && amount

  const handleSave = () => {
    if (!canSave) return
    onSave({
      itemName: itemName.trim(),
      soldAt: soldAt === 'Other' ? customLocation : soldAt,
      amount: parseFloat(amount),
      quantity: quantity ? parseFloat(quantity) : null,
      unit,
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
            <div>
              <h3 className="font-display text-xl font-semibold text-garden-900">Add revenue</h3>
              <p className="text-xs text-garden-400 mt-0.5">Record what you sold from your garden</p>
            </div>
            <button onClick={onClose}><X size={20} className="text-garden-400" /></button>
          </div>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1 space-y-4">

          {/* What did you sell */}
          <div>
            <label className="block text-sm font-medium text-garden-700 mb-1.5">
              What did you sell? *
            </label>
            <input className="input-field" placeholder="e.g. Zinnias, Tomatoes, Basil bundles"
              value={itemName} onChange={e => setItemName(e.target.value)} />
          </div>

          {/* Where sold */}
          <div>
            <label className="block text-sm font-medium text-garden-700 mb-2">
              Where did you sell it? <span className="text-garden-400 font-normal">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {SELL_LOCATIONS.map(s => (
                <button key={s} onClick={() => setSoldAt(s)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${
                    soldAt === s
                      ? 'bg-garden-600 text-white border-garden-600'
                      : 'bg-white text-garden-600 border-garden-200 hover:border-garden-400'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
            {soldAt === 'Other' && (
              <input className="input-field mt-2 text-sm" placeholder="Where did you sell it?"
                value={customLocation} onChange={e => setCustomLocation(e.target.value)} />
            )}
          </div>

          {/* Amount earned */}
          <div>
            <label className="block text-sm font-medium text-garden-700 mb-1.5">
              How much did you earn? *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-garden-400 font-medium">$</span>
              <input type="number" min="0" step="0.01" className="input-field pl-7"
                placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-garden-700 mb-1.5">
              How much did you sell? <span className="text-garden-400 font-normal">(optional)</span>
            </label>
            <div className="flex gap-2">
              <input type="number" min="0" step="0.1" className="input-field flex-1"
                placeholder="e.g. 12" value={quantity} onChange={e => setQuantity(e.target.value)} />
              <select className="input-field w-36" value={unit} onChange={e => setUnit(e.target.value)}>
                <option>bunches</option>
                <option>lbs</option>
                <option>oz</option>
                <option>stems</option>
                <option>plants</option>
                <option>bags</option>
                <option>jars</option>
                <option>count</option>
              </select>
            </div>
          </div>

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
              placeholder="e.g. Sold at Saturday farmers market, great demand for zinnias"
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
            <Check size={15} /> Save Revenue
          </button>
        </div>
      </div>
    </div>
  )
}
