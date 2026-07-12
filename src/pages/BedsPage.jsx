import { useState, useEffect } from 'react'
import { Plus, Grid3x3, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useWriteGuard } from '../lib/useWriteGuard'
import BedBuilder from '../components/beds/BedBuilder'
import BedDiagram from '../components/beds/BedDiagram'
export default function BedsPage() {
  const { user } = useAuth()
  const guard = useWriteGuard()
  const [beds, setBeds] = useState([])
  const [unplacedPlants, setUnplacedPlants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingBed, setEditingBed] = useState(null)
  const [viewingBed, setViewingBed] = useState(null)
  useEffect(() => {
    if (!user) return
    fetchBeds()
    fetchUnplacedPlants()
  }, [user])
  const fetchBeds = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('beds')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (!error) setBeds(data || [])
    setLoading(false)
  }
  const fetchUnplacedPlants = async () => {
    const { data, error } = await supabase
      .from('plants')
      .select('id, name, category, bed_id')
      .eq('user_id', user.id)
      .is('bed_id', null)
    if (!error) setUnplacedPlants(data || [])
  }
  // Write bed_id + bed name back to any tracked plants that were placed in this bed
  const linkPlantsToBed = async (bedId, bedName, plants) => {
    const trackedIds = (plants || [])
      .filter(p => p.sourcePlantId && (p.placed?.length || 0) > 0)
      .map(p => p.sourcePlantId)
    if (trackedIds.length === 0) return
    await supabase
      .from('plants')
      .update({ bed_id: bedId, bed: bedName, updated_at: new Date().toISOString() })
      .in('id', trackedIds)
      .eq('user_id', user.id)
    fetchUnplacedPlants()
  }
  const saveBed = async (bed) => {
    if (!guard()) return
    if (bed.id && beds.find(b => b.id === bed.id)) {
      // Update existing
      const { data, error } = await supabase
        .from('beds')
        .update({
          name: bed.name,
          length: bed.length,
          width: bed.width,
          plants: bed.plants || [],
          updated_at: new Date().toISOString(),
        })
        .eq('id', bed.id)
        .eq('user_id', user.id)
        .select()
        .single()
      if (!error && data) {
        setBeds(prev => prev.map(b => b.id === data.id ? data : b))
        await linkPlantsToBed(data.id, data.name, bed.plants)
      }
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('beds')
        .insert({
          user_id: user.id,
          name: bed.name,
          length: bed.length,
          width: bed.width,
          plants: bed.plants || [],
          notes: [],
        })
        .select()
        .single()
      if (!error && data) {
        setBeds(prev => [data, ...prev])
        await linkPlantsToBed(data.id, data.name, bed.plants)
      }
    }
    setShowBuilder(false)
    setEditingBed(null)
  }
  const deleteBed = async (id) => {
    if (!guard()) return
    if (!confirm('Delete this bed?')) return
    const { error } = await supabase
      .from('beds')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (!error) setBeds(prev => prev.filter(b => b.id !== id))
  }
  const saveNotes = async (bedId, notes) => {
    if (!guard()) return
    const { data } = await supabase
      .from('beds')
      .update({ notes, updated_at: new Date().toISOString() })
      .eq('id', bedId)
      .eq('user_id', user.id)
      .select()
      .single()
    if (data) {
      setBeds(prev => prev.map(b => b.id === bedId ? data : b))
      if (viewingBed?.id === bedId) setViewingBed(data)
    }
  }
  const totalPlants = beds.reduce((s, b) =>
    s + (b.plants || []).reduce((ps, p) => ps + (p.placed?.length || 0), 0), 0)
  if (showBuilder || editingBed) return (
    <BedBuilder
      bed={editingBed}
      unplacedPlants={unplacedPlants}
      onSave={saveBed}
      onCancel={() => { setShowBuilder(false); setEditingBed(null) }}
    />
  )
  if (viewingBed) return (
    <BedDiagram
      bed={viewingBed}
      onBack={() => setViewingBed(null)}
      onEdit={() => { setEditingBed(viewingBed); setViewingBed(null) }}
      onSaveNotes={(notes) => saveNotes(viewingBed.id, notes)}
    />
  )
  return (
    <div className="space-y-5 pb-20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-garden-900">My Beds</h1>
          <p className="text-garden-500 text-sm mt-1">{beds.length} beds · {totalPlants} plants placed</p>
        </div>
        <button onClick={() => setShowBuilder(true)} className="btn-primary flex-shrink-0">
          <Plus size={16} /> New Bed
        </button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-garden-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : beds.length === 0 ? (
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
  const plants = bed.plants || []
  const totalPlaced = plants.reduce((s, p) => s + (p.placed?.length || 0), 0)
  const cols = Math.min((bed.length || 4) * 2, 12)
  const rows = Math.min((bed.width || 4) * 2, 6)
  const grid = Array(rows).fill(null).map(() => Array(cols).fill(null))
  plants.forEach(plant => {
    (plant.placed || []).forEach(pos => {
      if (pos.row < grid.length && pos.col < (grid[0]?.length || 0)) {
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
        {plants.filter(p => (p.placed?.length || 0) > 0).map(p => (
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
