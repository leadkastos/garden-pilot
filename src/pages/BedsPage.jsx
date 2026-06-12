import { useState } from 'react'
import { Plus, Grid3x3, Printer, Pencil, Trash2 } from 'lucide-react'
import BedBuilder from '../components/beds/BedBuilder'
import BedDiagram from '../components/beds/BedDiagram'

const MOCK_BEDS = [
  {
    id: 1,
    name: 'Tomato Bed',
    length: 10,
    width: 4,
    plants: [
      { id:'p1', name:'Roma Tomato', emoji:'🍅', color:'#ef4444', count: 3, placed: [{row:0,col:0},{row:0,col:2},{row:0,col:4}] },
      { id:'p2', name:'Basil', emoji:'🌿', color:'#22c55e', count: 4, placed: [{row:2,col:1},{row:2,col:3},{row:2,col:5},{row:2,col:7}] },
      { id:'p3', name:'Bell Pepper', emoji:'🌶️', color:'#f97316', count: 2, placed: [{row:1,col:2},{row:1,col:6}] },
    ]
  },
  {
    id: 2,
    name: 'Herb Garden',
    length: 8,
    width: 3,
    plants: [
      { id:'p4', name:'Rosemary', emoji:'🌿', color:'#16a34a', count: 2, placed: [{row:0,col:0},{row:0,col:4}] },
      { id:'p5', name:'Mint', emoji:'🍃', color:'#4ade80', count: 3, placed: [{row:1,col:1},{row:1,col:3},{row:1,col:5}] },
    ]
  }
]

export default function BedsPage() {
  const [beds, setBeds] = useState(MOCK_BEDS)
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingBed, setEditingBed] = useState(null)
  const [viewingBed, setViewingBed] = useState(null)

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
    <BedBuilder
      bed={editingBed}
      onSave={saveBed}
      onCancel={() => { setShowBuilder(false); setEditingBed(null) }}
    />
  )

  if (viewingBed) return (
    <BedDiagram
      bed={viewingBed}
      onBack={() => setViewingBed(null)}
      onEdit={() => { setEditingBed(viewingBed); setViewingBed(null) }}
    />
  )

  return (
    <div className="space-y-5 pb-20">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-garden-900">Garden Beds</h1>
          <p className="text-garden-500 text-sm mt-1">{beds.length} beds · {totalPlants} plants placed</p>
        </div>
        <button onClick={() => setShowBuilder(true)} className="btn-primary flex-shrink-0">
          <Plus size={16} /> New Bed
        </button>
      </div>

      {/* Beds */}
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
            <BedCard
              key={bed.id}
              bed={bed}
              onView={() => setViewingBed(bed)}
              onEdit={() => setEditingBed(bed)}
              onDelete={() => deleteBed(bed.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function BedCard({ bed, onView, onEdit, onDelete }) {
  const totalPlaced = bed.plants.reduce((s, p) => s + p.placed.length, 0)
  const cols = bed.length * 2
  const rows = bed.width * 2

  // Build a quick mini grid preview
  const grid = Array(Math.min(rows, 6)).fill(null).map(() => Array(Math.min(cols, 12)).fill(null))
  bed.plants.forEach(plant => {
    plant.placed.forEach(pos => {
      if (pos.row < grid.length && pos.col < grid[0].length) {
        grid[pos.row][pos.col] = plant.emoji
      }
    })
  })

  return (
    <div className="card hover:shadow-card-hover transition-all duration-200">
      {/* Header */}
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

      {/* Mini grid preview */}
      <div className="bg-garden-50 rounded-xl p-3 mb-3 border border-garden-100 overflow-hidden cursor-pointer" onClick={onView}>
        <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${Math.min(cols, 12)}, 1fr)` }}>
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

      {/* Plant legend */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {bed.plants.map(p => (
          <span key={p.id} className="flex items-center gap-1 text-xs bg-white border border-garden-200 px-2 py-1 rounded-full">
            {p.emoji} {p.name} ×{p.placed.length}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={onView} className="flex-1 btn-primary text-sm justify-center py-2">
          View & Edit Layout
        </button>
        <button onClick={() => { window._printBed = bed; window.open('/print-bed', '_blank') }}
          className="btn-secondary px-3">
          <Printer size={14} />
        </button>
      </div>
    </div>
  )
}
