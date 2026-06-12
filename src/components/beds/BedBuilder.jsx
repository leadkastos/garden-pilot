import { useState, useRef } from 'react'
import { ArrowLeft, Plus, Trash2, Check, GripVertical, X } from 'lucide-react'

const PLANT_LIBRARY = [
  { name:'Tomato',     emoji:'🍅', color:'#ef4444' },
  { name:'Pepper',     emoji:'🌶️', color:'#f97316' },
  { name:'Cucumber',   emoji:'🥒', color:'#84cc16' },
  { name:'Zucchini',   emoji:'🎃', color:'#f59e0b' },
  { name:'Lettuce',    emoji:'🥬', color:'#22c55e' },
  { name:'Carrot',     emoji:'🥕', color:'#f97316' },
  { name:'Basil',      emoji:'🌿', color:'#16a34a' },
  { name:'Rosemary',   emoji:'🌿', color:'#15803d' },
  { name:'Mint',       emoji:'🍃', color:'#4ade80' },
  { name:'Lavender',   emoji:'💜', color:'#a855f7' },
  { name:'Sunflower',  emoji:'🌻', color:'#eab308' },
  { name:'Zinnia',     emoji:'🌸', color:'#ec4899' },
  { name:'Marigold',   emoji:'🌼', color:'#f59e0b' },
  { name:'Rose',       emoji:'🌹', color:'#e11d48' },
  { name:'Beans',      emoji:'🫘', color:'#84cc16' },
  { name:'Corn',       emoji:'🌽', color:'#eab308' },
  { name:'Onion',      emoji:'🧅', color:'#a3a3a3' },
  { name:'Garlic',     emoji:'🧄', color:'#d4d4d4' },
  { name:'Strawberry', emoji:'🍓', color:'#ef4444' },
  { name:'Spinach',    emoji:'🍃', color:'#16a34a' },
  { name:'Kale',       emoji:'🥦', color:'#15803d' },
  { name:'Broccoli',   emoji:'🥦', color:'#16a34a' },
  { name:'Custom',     emoji:'🌱', color:'#4a9e3f' },
]

let plantIdCounter = 100

export default function BedBuilder({ bed, onSave, onCancel }) {
  const [step, setStep] = useState(bed ? 2 : 0)
  const [name, setName] = useState(bed?.name || '')
  const [length, setLength] = useState(bed?.length || '')
  const [width, setWidth] = useState(bed?.width || '')
  const [plants, setPlants] = useState(bed?.plants || [])
  const [showPlantPicker, setShowPlantPicker] = useState(false)
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [customPlant, setCustomPlant] = useState({ name: '', emoji: '🌱' })

  const cols = Math.min(parseInt(length) * 2 || 0, 24)
  const rows = Math.min(parseInt(width) * 2 || 0, 16)

  // Build placed grid
  const grid = Array(rows).fill(null).map(() => Array(cols).fill(null))
  plants.forEach(plant => {
    plant.placed?.forEach(pos => {
      if (pos.row < rows && pos.col < cols) {
        grid[pos.row][pos.col] = { ...plant, posKey: `${pos.row}-${pos.col}` }
      }
    })
  })

  const addPlant = (template) => {
    const newPlant = {
      id: `plant-${++plantIdCounter}`,
      name: template.name === 'Custom' ? customPlant.name || 'My Plant' : template.name,
      emoji: template.name === 'Custom' ? customPlant.emoji : template.emoji,
      color: template.color,
      placed: []
    }
    setPlants(prev => [...prev, newPlant])
    setShowPlantPicker(false)
  }

  const removePlant = (plantId) => {
    setPlants(prev => prev.filter(p => p.id !== plantId))
  }

  const duplicatePlantIcon = (plantId) => {
    // Adds a new unplaced copy — shown in palette, user drags it to the grid
    const source = plants.find(p => p.id === plantId)
    if (!source) return
    const newPlant = {
      ...source,
      id: `plant-${++plantIdCounter}`,
      placed: []
    }
    setPlants(prev => [...prev, newPlant])
  }

  const handleCellDrop = (row, col) => {
    if (!dragging) return
    // Check if cell is occupied
    const occupied = plants.some(p => p.placed?.some(pos => pos.row === row && pos.col === col))
    if (occupied) return

    setPlants(prev => prev.map(p => {
      if (p.id !== dragging.plantId) return p
      // If moving an existing placed icon
      if (dragging.fromPos) {
        const newPlaced = p.placed.filter(pos => !(pos.row === dragging.fromPos.row && pos.col === dragging.fromPos.col))
        return { ...p, placed: [...newPlaced, { row, col }] }
      }
      // Placing a new icon from the palette
      return { ...p, placed: [...(p.placed || []), { row, col }] }
    }))
    setDragging(null)
    setDragOver(null)
  }

  const removeFromCell = (row, col) => {
    setPlants(prev => prev.map(p => ({
      ...p,
      placed: p.placed.filter(pos => !(pos.row === row && pos.col === col))
    })))
  }

  const handleSave = () => {
    onSave({ id: bed?.id, name, length: parseInt(length), width: parseInt(width), plants })
  }

  const canProceed = () => {
    if (step === 0) return name.trim()
    if (step === 1) return length && width && parseInt(length) > 0 && parseInt(width) > 0
    return true
  }

  return (
    <div className="min-h-screen bg-parchment pb-24">
      {/* Header */}
      <div className="bg-garden-800 px-4 pt-4 pb-5">
        <button onClick={onCancel} className="flex items-center gap-2 text-garden-300 hover:text-white mb-3 text-sm">
          <ArrowLeft size={16} /> Garden Beds
        </button>
        <h1 className="font-display text-2xl font-semibold text-white">
          {bed ? `Edit ${bed.name}` : 'Create a new bed'}
        </h1>
        {/* Steps */}
        <div className="flex gap-2 mt-3">
          {['Name it', 'Size it', 'Plant it'].map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                i < step ? 'bg-garden-400 text-white' : i === step ? 'bg-white text-garden-800' : 'bg-garden-700 text-garden-400'
              }`}>
                {i < step ? <Check size={12} /> : i + 1}
              </div>
              <span className={`text-xs ${i === step ? 'text-white' : 'text-garden-500'}`}>{s}</span>
              {i < 2 && <div className="w-6 h-0.5 bg-garden-700" />}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-5 max-w-3xl mx-auto">

        {/* STEP 0: Name */}
        {step === 0 && (
          <div className="space-y-4 fade-in">
            <div>
              <h2 className="font-display text-2xl font-semibold text-garden-900 mb-1">What's this bed called?</h2>
              <p className="text-garden-500 text-sm">Give it a name you'll recognize</p>
            </div>
            <input className="input-field text-lg" placeholder="e.g. Tomato Bed, Front Raised Bed, Container #1"
              value={name} onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && canProceed() && setStep(1)} autoFocus />
            <div className="flex flex-wrap gap-2">
              {['Tomato Bed', 'Herb Garden', 'Flower Bed', 'Raised Bed #1', 'Front Border', 'Container'].map(s => (
                <button key={s} onClick={() => setName(s)}
                  className="text-sm px-3 py-1.5 bg-white border border-garden-200 rounded-full text-garden-600 hover:border-garden-400 transition-all">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: Size */}
        {step === 1 && (
          <div className="space-y-4 fade-in">
            <div>
              <h2 className="font-display text-2xl font-semibold text-garden-900 mb-1">How big is {name}?</h2>
              <p className="text-garden-500 text-sm">Enter the dimensions in feet</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-garden-700 mb-1.5">Length (feet)</label>
                <input type="number" min="1" max="30" className="input-field text-lg font-medium text-center"
                  placeholder="e.g. 8" value={length} onChange={e => setLength(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-garden-700 mb-1.5">Width (feet)</label>
                <input type="number" min="1" max="20" className="input-field text-lg font-medium text-center"
                  placeholder="e.g. 4" value={width} onChange={e => setWidth(e.target.value)} />
              </div>
            </div>
            {length && width && (
              <div className="card bg-garden-50 border-garden-200 text-center">
                <p className="text-garden-600 text-sm font-medium">
                  Your bed will be <span className="font-bold text-garden-900">{length} ft × {width} ft</span> = {parseInt(length) * parseInt(width)} sq ft
                </p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-garden-600 mb-2">Common sizes</p>
              <div className="flex flex-wrap gap-2">
                {[['4×8','4','8'],['4×4','4','4'],['3×6','3','6'],['2×4','2','4'],['8×12','8','12']].map(([label,w,l]) => (
                  <button key={label} onClick={() => { setLength(l); setWidth(w) }}
                    className="text-sm px-3 py-1.5 bg-white border border-garden-200 rounded-full text-garden-600 hover:border-garden-400 transition-all">
                    {label} ft
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Plant it */}
        {step === 2 && (
          <div className="space-y-4 fade-in">
            <div>
              <h2 className="font-display text-2xl font-semibold text-garden-900 mb-1">Plant your {name}</h2>
              <p className="text-garden-500 text-sm">Add plants then drag them into position on the grid</p>
            </div>

            {/* Plant Palette */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-garden-900 text-sm">Your plants</h3>
                <button onClick={() => setShowPlantPicker(true)}
                  className="btn-primary text-xs py-1.5 px-3">
                  <Plus size={12} /> Add plant
                </button>
              </div>
              {plants.length === 0 ? (
                <p className="text-garden-400 text-sm text-center py-4">No plants added yet — click Add plant to start</p>
              ) : (
                <div className="space-y-2">
                  {plants.map(plant => (
                    <div key={plant.id} className="flex items-center gap-3 p-2 bg-garden-50 rounded-xl border border-garden-100">
                      <div
                        draggable
                        onDragStart={() => setDragging({ plantId: plant.id, fromPos: null })}
                        className="text-2xl cursor-grab active:cursor-grabbing select-none"
                        title="Drag to place in bed">
                        {plant.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-garden-800">{plant.name}</p>
                        <p className="text-xs text-garden-400">{plant.placed.length} placed in bed</p>
                      </div>
                      <button onClick={() => removePlant(plant.id)}
                        className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors">
                        <Trash2 size={11} className="text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bed Grid */}
            {rows > 0 && cols > 0 && (
              <div className="card overflow-x-auto">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-garden-900 text-sm">{name} — {length}ft × {width}ft</h3>
                  <p className="text-xs text-garden-400">Drag plants onto the grid</p>
                </div>
                <div className="relative inline-block min-w-full">
                  {/* Grid */}
                  <div
                    className="grid border-2 border-soil-400 rounded-xl overflow-hidden bg-garden-50"
                    style={{
                      gridTemplateColumns: `repeat(${cols}, minmax(32px, 1fr))`,
                      minWidth: `${cols * 36}px`
                    }}>
                    {Array(rows).fill(null).map((_, ri) =>
                      Array(cols).fill(null).map((__, ci) => {
                        const cell = grid[ri]?.[ci]
                        const isOver = dragOver?.row === ri && dragOver?.col === ci
                        return (
                          <div
                            key={`${ri}-${ci}`}
                            className={`relative flex items-center justify-center border border-garden-200 transition-all
                              ${isOver ? 'bg-garden-200 scale-105 z-10' : 'bg-white hover:bg-garden-50'}
                              ${cell ? 'cursor-move' : 'cursor-crosshair'}
                            `}
                            style={{ width: 36, height: 36 }}
                            onDragOver={e => { e.preventDefault(); setDragOver({ row: ri, col: ci }) }}
                            onDragLeave={() => setDragOver(null)}
                            onDrop={() => handleCellDrop(ri, ci)}
                          >
                            {cell && (
                              <div
                                draggable
                                onDragStart={() => setDragging({ plantId: cell.id, fromPos: { row: ri, col: ci } })}
                                className="text-xl select-none leading-none"
                                title={`${cell.name} — click × to remove`}>
                                {cell.emoji}
                              </div>
                            )}
                            {cell && (
                              <button
                                onClick={() => removeFromCell(ri, ci)}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-20">
                                ×
                              </button>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                  {/* Dimension labels */}
                  <div className="flex justify-between mt-1 px-1">
                    <span className="text-[10px] text-garden-400">← {length} ft →</span>
                    <span className="text-[10px] text-garden-400">{width} ft ↕</span>
                  </div>
                </div>

                {/* Legend */}
                {plants.some(p => p.placed.length > 0) && (
                  <div className="mt-3 pt-3 border-t border-garden-100">
                    <p className="text-xs font-medium text-garden-600 mb-2">Legend</p>
                    <div className="flex flex-wrap gap-2">
                      {plants.filter(p => p.placed.length > 0).map(p => (
                        <span key={p.id} className="flex items-center gap-1 text-xs bg-garden-50 border border-garden-200 px-2 py-1 rounded-full">
                          {p.emoji} {p.name} ×{p.placed.length}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Plant Picker Modal */}
      {showPlantPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full p-5 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl font-semibold text-garden-900">Choose a plant</h3>
              <button onClick={() => setShowPlantPicker(false)}><X size={20} className="text-garden-400" /></button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {PLANT_LIBRARY.map(p => (
                <button key={p.name} onClick={() => addPlant(p)}
                  className="flex flex-col items-center gap-1 p-3 bg-garden-50 hover:bg-garden-100 rounded-2xl border border-garden-100 transition-all active:scale-95">
                  <span className="text-2xl">{p.emoji}</span>
                  <span className="text-[11px] font-medium text-garden-700 text-center leading-tight">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-garden-100 px-4 py-3 flex gap-3">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex-shrink-0 px-4">
            ← Back
          </button>
        )}
        {step < 2 ? (
          <button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}
            className="btn-primary flex-1 justify-center py-3 text-base disabled:opacity-40">
            Continue →
          </button>
        ) : (
          <button onClick={handleSave}
            className="btn-primary flex-1 justify-center py-3 text-base">
            <Check size={16} /> Save Bed
          </button>
        )}
      </div>
    </div>
  )
}
