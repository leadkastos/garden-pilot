import { useState, useEffect } from 'react'
import { Plus, Grid3x3, Pencil, Trash2 } from 'lucide-react'
import BedBuilder from '../components/beds/BedBuilder'
import BedDiagram from '../components/beds/BedDiagram'

export default function BedsPage() {
  const [beds, setBeds] = useState([])
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingBed, setEditingBed] = useState(null)
  const [viewingBed, setViewingBed] = useState(null)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gardenpilot_beds')
      if (saved) setBeds(JSON.parse(saved))
    } catch (e) { console.error('Error loading beds:', e) }
  }, [])

  // Save to localStorage whenever beds change
  useEffect(() => {
    try {
      localStorage.setItem('gardenpilot_beds', JSON.stringify(beds))
    } catch (e) { console.error('Error saving beds:', e) }
  }, [beds])

  const saveBed = (bed) => {
    if (bed.id && beds.find(b => b.id === bed.id)) {
      setBeds(prev => prev.map(b => b.id === bed.id ? bed : b))
    } else {
      setBeds(prev => [...prev, { ...bed, id: Date.now() }])
    }
    setShowBuilder(false)
    setEditingBed(null)
  }

  const deleteBed = (id) => {
    if (confirm('Delete this bed?')) setBeds(prev => prev.filter(b => b.id !== id))
  }

  const totalPlants = beds.reduce((s, b) => s + b.plants.reduce((ps, p) => ps + p.placed.length, 0), 0)

  if (showBuilder || editingBed) return (
    <BedBuilder bed={editingBed} onSave={saveBed}
      onCancel={() => { setShowBuilder(false); setEditingBed(null) }} />
  )

  if (viewingBed) return (
    <BedDiagram bed={viewingBed} onBack={() => setViewingBed(null)}
      onEdit={() => { setEditingBed(viewingBed); setViewingBed(null) }} />
  )

  return (
    <div className="space-y-5 pb-20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-garden-900">Garden Beds</h1>
          <p className="text-garden-500 text-sm mt-1">{beds.length} beds · {totalPlants} plants placed</p>
        </div>
        <button onClick={() => setShowBuilder(true)} className="btn-primary flex-shrink-0">
          <Plus size={16} /> New Bed
        </button>
      </div>

      {beds.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-garden-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Grid3x3 size={28} className="text-garden-400" />
          </div>
          <h3 className="font-display text-lg font-semibold text-garden-800 mb-2">No beds yet</h3>
          <p className="text-garden-400 text-sm mb-5">Create your first garden bed to get started</p>
          <button onClick={() => setShowBuilder(true)} className="btn-primary mx-auto">
            <Plus size={15} /> Create your first bed
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {beds.map(bed => (
            <BedCard key={bed.id} bed={bed}
              onView={() => setViewingBed(bed)}
              onEdit={() => setEditingBed(bed)}
              onDelete={() => deleteBed(bed.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

function BedCard({ bed, onView, onEdit, onDelete }) {
  const totalPlaced = bed.plants.reduce((s, p) => s + p.placed.length, 0)
  const cols = Math.min(bed.length * 2, 12)
  const rows = Math.min(bed.width * 2, 6)

  const grid = Array(rows).fill(null).map(() => Array(cols).fill(null))
  bed.plants.forEach(plant => {
    plant.placed.forEach(pos => {
      if (pos.row < grid.length && pos.col < grid[0].length) {
        grid[pos.row][pos.col] = plant.emoji
      }
    })
  })

  return (
    <div className="card hover:shadow-card-hover transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-garden-900">{bed.name}</h3>
          <p className="text-garden-400 text-sm">{bed.length} ft × {bed.width} ft · {totalPlaced} plants</p>
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit} className="w-8 h-8 rounded-lg bg-garden-50 hover:bg-garden-100 flex items-center justify-center transition-colors">
            <Pencil size={13} className="text-garden-500" />
          </button>
          <button onClick={onDelete} className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors">
            <Trash2 size={13} className="text-red-400" />
          </button>
        </div>
      </div>

      <div className="bg-garden-50 rounded-xl p-3 mb-3 border border-garden-100 cursor-pointer" onClick={onView}>
        <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {grid.map((row, ri) =>
            row.map((cell, ci) => (
              <div key={`${ri}-${ci}`}
                className="aspect-square rounded flex items-center justify-center text-xs bg-white border border-garden-100">
                {cell || ''}
              </div>
            ))
          )}
        </div>
        <p className="text-center text-xs text-garden-400 mt-2">Click to view full diagram</p>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {bed.plants.filter(p => p.placed.length > 0).map(p => (
          <span key={p.id} className="flex items-center gap-1 text-xs bg-white border border-garden-200 px-2 py-1 rounded-full">
            {p.emoji} {p.name} ×{p.placed.length}
          </span>
        ))}
      </div>

      <button onClick={onView} className="w-full btn-primary text-sm justify-center py-2">
        View & Edit Layout
      </button>
    </div>
  )
}
