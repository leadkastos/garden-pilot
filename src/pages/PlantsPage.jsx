import { useState, useEffect } from 'react'
import { Plus, Search, SlidersHorizontal, Leaf } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import PlantCard from '../components/plants/PlantCard'
import AddPlantWizard from '../components/plants/AddPlantWizard'
import PlantDetail from '../components/plants/PlantDetail'
const STATUS_COLORS = {
  Unplanted:  { bg: 'bg-slate-100',   text: 'text-slate-600',   dot: 'bg-slate-400' },
  Seeded:     { bg: 'bg-amber-100',   text: 'text-amber-800',   dot: 'bg-amber-400' },
  Sprouting:  { bg: 'bg-yellow-100',  text: 'text-yellow-800',  dot: 'bg-yellow-400' },
  Seedling:   { bg: 'bg-lime-100',    text: 'text-lime-800',    dot: 'bg-lime-400' },
  Growing:    { bg: 'bg-garden-100',  text: 'text-garden-800',  dot: 'bg-garden-500' },
  Flowering:  { bg: 'bg-pink-100',    text: 'text-pink-800',    dot: 'bg-pink-400' },
  Fruiting:   { bg: 'bg-orange-100',  text: 'text-orange-800',  dot: 'bg-orange-400' },
  Harvesting: { bg: 'bg-red-100',     text: 'text-red-800',     dot: 'bg-red-400' },
  Finished:   { bg: 'bg-gray-100',    text: 'text-gray-600',    dot: 'bg-gray-400' },
}
const SORT_OPTIONS = ['Recently Updated', 'Plant Type', 'Bed', 'Status']
const STATUS_FILTERS = ['All', ...Object.keys(STATUS_COLORS)]
function guessCategory(name) {
  const lower = name.toLowerCase()
  if (['tomato','pepper','cucumber','zucchini','squash','lettuce','carrot','bean','corn','onion','garlic','potato','eggplant','broccoli','cauliflower','spinach','kale','beet','radish','pea','cabbage'].some(v => lower.includes(v))) return 'Vegetable'
  if (['basil','rosemary','mint','lavender','sage','parsley','cilantro','dill','thyme','oregano','chive'].some(v => lower.includes(v))) return 'Herb'
  if (['rose','zinnia','marigold','sunflower','dahlia','peony','tulip','daisy','lily','flower'].some(v => lower.includes(v))) return 'Flower'
  if (['strawberry','blueberry','raspberry','watermelon','melon','grape','apple','peach','cherry'].some(v => lower.includes(v))) return 'Fruit'
  return 'Vegetable'
}
function toISODate(input) {
  if (!input) return null
  if (/^\d{4}-\d{2}-\d{2}/.test(input)) return input.slice(0,10)
  const d = new Date(input)
  if (isNaN(d)) return null
  return d.toISOString().slice(0,10)
}
export default function PlantsPage() {
  const { user, profile } = useAuth()
  const [plants, setPlants] = useState([])
  const [beds, setBeds] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showFilters, setShowFilters] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const [selectedPlant, setSelectedPlant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showImportConfirm, setShowImportConfirm] = useState(false)
  const [importPreview, setImportPreview] = useState([])
  useEffect(() => {
    if (!user) return
    fetchPlants()
    fetchBeds()
  }, [user])
  const fetchPlants = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('plants')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (!error) setPlants(data || [])
    setLoading(false)
  }
  const fetchBeds = async () => {
    const { data } = await supabase
      .from('beds')
      .select('*')
      .eq('user_id', user.id)
    setBeds(data || [])
  }
  // Auto-sync a plant's planting + harvest dates to the calendar (no duplicates, no orphans)
  const syncPlantToCalendar = async (plant) => {
    if (!plant?.id) return
    const desired = []
    if (plant.planted_date) {
      desired.push({ type: 'plant', date: toISODate(plant.planted_date), title: `Planted ${plant.name}` })
    }
    const log = Array.isArray(plant.harvest_log) ? plant.harvest_log : []
    log.forEach(h => {
      const d = toISODate(h.date)
      if (d) desired.push({ type: 'harvest', date: d, title: `Harvested ${plant.name}` })
    })
    const { data: existing } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', user.id)
      .eq('plant_id', plant.id)
      .eq('auto', true)
    const existingRows = existing || []
    const key = e => `${e.type}|${e.date}`
    const desiredKeys = new Set(desired.map(key))
    const existingKeys = new Set(existingRows.map(key))
    const toInsert = desired
      .filter(d => d.date && !existingKeys.has(key(d)))
      .map(d => ({
        user_id: user.id,
        title: d.title,
        date: d.date,
        type: d.type,
        auto: true,
        plant_id: plant.id,
      }))
    if (toInsert.length) {
      await supabase.from('calendar_events').insert(toInsert)
    }
    const toDelete = existingRows.filter(e => !desiredKeys.has(key(e))).map(e => e.id)
    if (toDelete.length) {
      await supabase.from('calendar_events').delete().in('id', toDelete).eq('user_id', user.id)
    }
  }
  const addPlant = async (plant) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      alert('You must be logged in to save plants')
      return
    }
    const userId = session.user.id
    const { data, error } = await supabase
      .from('plants')
      .insert({
        user_id: userId,
        name: plant.name || 'New Plant',
        variety: plant.variety || null,
        category: plant.category || 'Vegetable',
        status: plant.status || 'Unplanted',
        health: plant.health || 'Good',
        bed: plant.bed || null,
        seeds_planted: parseInt(plant.seedsPlanted) || 0,
        seeds_sprouted: parseInt(plant.seedsSprouted) || 0,
        seeds_in_pack: parseInt(plant.seedsInPack) || 0,
        planted_date: plant.plantedDate || null,
        germ_days: parseInt(plant.germDays) || null,
        days_to_maturity: parseInt(plant.daysToMaturity) || null,
        production_weeks: parseInt(plant.productionWeeks) || null,
        start_location: plant.startLocation || null,
        sun_exposure: plant.sunExposure || null,
        seed_source: plant.seedSource || null,
        seed_packet_name: plant.seedPacketName || null,
        next_action: plant.nextAction || 'Watch for Sprouts',
        days_to_harvest: parseInt(plant.daysToHarvest) || 0,
        germ_rate: 0,
        harvest_log: [],
        milestones: [],
        notes: [],
        photos: [],
        imported_from_ledger: plant.importedFromLedger || false,
      })
      .select()
      .single()
    if (error) {
      console.error('Error saving plant:', JSON.stringify(error))
      alert('Error saving plant: ' + error.message)
    } else if (data) {
      setPlants(prev => [data, ...prev])
      await syncPlantToCalendar(data)
    }
    setShowWizard(false)
  }
  const updatePlant = async (updated) => {
    const { data, error } = await supabase
      .from('plants')
      .update({
        name: updated.name,
        variety: updated.variety,
        category: updated.category,
        status: updated.status,
        health: updated.health,
        bed: updated.bed,
        seeds_planted: updated.seedsPlanted || updated.seeds_planted || 0,
        seeds_sprouted: updated.seedsSprouted || updated.seeds_sprouted || 0,
        planted_date: updated.plantedDate || updated.planted_date,
        seed_source: updated.seedSource ?? updated.seed_source,
        days_to_maturity: updated.daysToMaturity ?? updated.days_to_maturity ?? null,
        production_weeks: updated.productionWeeks ?? updated.production_weeks ?? null,
        next_action: updated.nextAction || updated.next_action,
        days_to_harvest: updated.daysToHarvest || updated.days_to_harvest || 0,
        germ_rate: updated.germRate || updated.germ_rate || 0,
        grow_again: updated.growAgain ?? updated.grow_again,
        harvest_log: updated.harvestLog || updated.harvest_log || [],
        milestones: updated.milestones || [],
        notes: updated.notes || [],
        photos: updated.photos || [],
        photo_url: updated.photoUrl || updated.photo_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', updated.id)
      .eq('user_id', user.id)
      .select()
      .single()
    if (!error && data) {
      setPlants(prev => prev.map(p => p.id === data.id ? data : p))
      setSelectedPlant(data)
      await syncPlantToCalendar(data)
    }
  }
  const deletePlant = async (plant) => {
    if (!confirm(`Delete "${plant.name}"? This cannot be undone.`)) return
    const { error } = await supabase
      .from('plants')
      .delete()
      .eq('id', plant.id)
      .eq('user_id', user.id)
    if (error) {
      alert('Error deleting plant: ' + error.message)
      return
    }
    await supabase
      .from('calendar_events')
      .delete()
      .eq('user_id', user.id)
      .eq('plant_id', plant.id)
      .eq('auto', true)
    if (plant.bed_id) {
      const bed = beds.find(b => b.id === plant.bed_id)
      if (bed) {
        const newPlants = (bed.plants || []).filter(bp => bp.sourcePlantId !== plant.id)
        await supabase
          .from('beds')
          .update({ plants: newPlants, updated_at: new Date().toISOString() })
          .eq('id', bed.id)
          .eq('user_id', user.id)
        fetchBeds()
      }
    }
    setPlants(prev => prev.filter(p => p.id !== plant.id))
    if (selectedPlant?.id === plant.id) setSelectedPlant(null)
  }
  const buildImportPreview = () => {
    const preview = []
    beds.forEach(bed => {
      const bedPlants = bed.plants || []
      bedPlants.forEach(plant => {
        if (!plant.placed?.length) return
        const alreadyExists = plants.some(p =>
          p.name.toLowerCase() === plant.name.toLowerCase() && p.bed === bed.name)
        if (!alreadyExists) {
          preview.push({
            name: plant.name,
            category: guessCategory(plant.name),
            bed: bed.name,
            seedsPlanted: plant.placed.length,
          })
        }
      })
    })
    return preview
  }
  const handleImportClick = () => {
    const preview = buildImportPreview()
    setImportPreview(preview)
    setShowImportConfirm(true)
  }
  const confirmImport = async () => {
    for (const p of importPreview) {
      await supabase.from('plants').insert({
        user_id: user.id,
        name: p.name,
        category: p.category,
        status: 'Growing',
        health: 'Good',
        bed: p.bed,
        seeds_planted: p.seedsPlanted,
        seeds_sprouted: p.seedsPlanted,
        germ_rate: 100,
        next_action: 'Check on plant',
        harvest_log: [],
        milestones: [],
        notes: [],
        photos: [],
      })
    }
    setShowImportConfirm(false)
    fetchPlants()
  }
  const filtered = plants.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
                        p.variety?.toLowerCase().includes(search.toLowerCase()) ||
                        p.bed?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || p.status === statusFilter
    return matchSearch && matchStatus
  })
  const bedsWithUnimported = buildImportPreview().length > 0
  if (selectedPlant) return (
    <PlantDetail
      plant={{
        ...selectedPlant,
        seedsPlanted: selectedPlant.seeds_planted,
        seedsSprouted: selectedPlant.seeds_sprouted,
        seedsInPack: selectedPlant.seeds_in_pack,
        plantedDate: selectedPlant.planted_date,
        nextAction: selectedPlant.next_action,
        daysToHarvest: selectedPlant.days_to_harvest,
        germRate: selectedPlant.germ_rate,
        growAgain: selectedPlant.grow_again,
        harvestLog: selectedPlant.harvest_log,
        seedSource: selectedPlant.seed_source,
        photos: selectedPlant.photos,
        daysToMaturity: selectedPlant.days_to_maturity,
        productionWeeks: selectedPlant.production_weeks,
        _springFrost: profile?.last_spring_frost,
        _fallFrost: profile?.first_fall_frost,
      }}
      onBack={() => setSelectedPlant(null)}
      onUpdate={updatePlant}
      onDelete={() => deletePlant(selectedPlant)}
      statusColors={STATUS_COLORS}
    />
  )
  if (showWizard) return (
    <AddPlantWizard onSave={addPlant} onCancel={() => setShowWizard(false)} />
  )
  return (
    <div className="space-y-5 pb-20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-garden-900">My Plants</h1>
          <p className="text-garden-500 text-sm mt-1">{plants.length} plants this season</p>
        </div>
        <button onClick={() => setShowWizard(true)} className="btn-primary flex-shrink-0">
          <Plus size={16} /> Add Plant
        </button>
      </div>
      {bedsWithUnimported && (
        <div className="card bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">🛏️</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">
                You have plants in your beds not yet tracked in My Plants
              </p>
              <p className="text-xs text-amber-700 mt-0.5">Import them to track germination, health, and harvests</p>
            </div>
          </div>
          <button onClick={handleImportClick}
            className="mt-3 w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors">
            Import from my beds
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-garden-400" />
          <input type="text" placeholder="Search plants, beds..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="input-field pl-9" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary px-3 flex-shrink-0 ${showFilters ? 'bg-garden-100 border-garden-300' : ''}`}>
          <SlidersHorizontal size={15} />
        </button>
      </div>
      {showFilters && (
        <div className="card space-y-3 fade-in">
          <div>
            <p className="text-xs font-medium text-garden-600 mb-2">Filter by status</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${
                    statusFilter === s ? 'bg-garden-600 text-white border-garden-600' : 'bg-white text-garden-600 border-garden-200 hover:border-garden-400'
                  }`}>{s}</button>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Object.entries(STATUS_COLORS).map(([status, colors]) => {
          const count = plants.filter(p => p.status === status).length
          if (!count) return null
          return (
            <button key={status} onClick={() => setStatusFilter(status === statusFilter ? 'All' : status)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 border transition-all ${
                statusFilter === status ? `${colors.bg} ${colors.text} border-transparent` : 'bg-white text-garden-600 border-garden-200'
              }`}>
              <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
              {status} · {count}
            </button>
          )
        })}
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-garden-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-garden-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Leaf size={28} className="text-garden-400" />
          </div>
          <h3 className="font-display text-lg font-semibold text-garden-800 mb-2">
            {plants.length === 0 ? 'No plants yet' : 'No plants found'}
          </h3>
          <p className="text-garden-400 text-sm mb-5">
            {plants.length === 0 ? 'Add your first plant to get started' : `No plants matching "${search}"`}
          </p>
          {plants.length === 0 && (
            <button onClick={() => setShowWizard(true)} className="btn-primary mx-auto">
              <Plus size={15} /> Add your first plant
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(plant => (
            <PlantCard
              key={plant.id}
              plant={{
                ...plant,
                seedsPlanted: plant.seeds_planted,
                seedsSprouted: plant.seeds_sprouted,
                seedsInPack: plant.seeds_in_pack,
                plantedDate: plant.planted_date,
                nextAction: plant.next_action,
                daysToHarvest: plant.days_to_harvest,
                germRate: plant.germ_rate,
                growAgain: plant.grow_again,
                harvestLog: plant.harvest_log,
                seedSource: plant.seed_source,
              }}
              statusColors={STATUS_COLORS}
              onClick={() => setSelectedPlant(plant)}
              onUpdate={updatePlant}
              onDelete={() => deletePlant(plant)}
            />
          ))}
        </div>
      )}
      {showImportConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className="px-5 pt-5 pb-3 border-b border-garden-100">
              <h3 className="font-display text-lg font-semibold text-garden-900 mb-1">
                Import {importPreview.length} {importPreview.length === 1 ? 'plant' : 'plants'}
              </h3>
              <p className="text-xs text-garden-500">These will be added to My Plants from your beds</p>
            </div>
            <div className="px-5 py-4 max-h-64 overflow-y-auto space-y-2">
              {importPreview.map((p, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-garden-50 rounded-xl border border-garden-100">
                  <span className="text-xl">🌱</span>
                  <div>
                    <p className="text-sm font-medium text-garden-800">{p.name}</p>
                    <p className="text-xs text-garden-400">{p.bed} · {p.seedsPlanted} plants</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-garden-100 flex gap-3">
              <button onClick={() => setShowImportConfirm(false)} className="btn-secondary flex-1 justify-center py-2">Cancel</button>
              <button onClick={confirmImport} className="btn-primary flex-1 justify-center py-2">Import all</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
