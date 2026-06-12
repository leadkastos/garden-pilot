import { useState, useEffect } from 'react'
import { Plus, Search, SlidersHorizontal, Leaf, Download, Grid3x3 } from 'lucide-react'
import PlantCard from '../components/plants/PlantCard'
import AddPlantWizard from '../components/plants/AddPlantWizard'
import PlantDetail from '../components/plants/PlantDetail'

const STATUS_COLORS = {
  Seeded:     { bg: 'bg-amber-100',   text: 'text-amber-800',   dot: 'bg-amber-400' },
  Sprouting:  { bg: 'bg-yellow-100',  text: 'text-yellow-800',  dot: 'bg-yellow-400' },
  Seedling:   { bg: 'bg-lime-100',    text: 'text-lime-800',    dot: 'bg-lime-400' },
  Growing:    { bg: 'bg-garden-100',  text: 'text-garden-800',  dot: 'bg-garden-500' },
  Flowering:  { bg: 'bg-pink-100',    text: 'text-pink-800',    dot: 'bg-pink-400' },
  Fruiting:   { bg: 'bg-orange-100',  text: 'text-orange-800',  dot: 'bg-orange-400' },
  Harvesting: { bg: 'bg-red-100',     text: 'text-red-800',     dot: 'bg-red-400' },
  Finished:   { bg: 'bg-gray-100',    text: 'text-gray-600',    dot: 'bg-gray-400' },
}

const SORT_OPTIONS = ['Recently Updated', 'Harvest Ready', 'Plant Type', 'Bed', 'Status']
const STATUS_FILTERS = ['All', ...Object.keys(STATUS_COLORS)]

// Guess category from plant name
function guessCategory(name) {
  const lower = name.toLowerCase()
  if (['tomato','pepper','cucumber','zucchini','squash','lettuce','carrot','bean','corn','onion','garlic','potato','eggplant','broccoli','cauliflower','spinach','kale','beet','radish','pea','cabbage'].some(v => lower.includes(v))) return 'Vegetable'
  if (['basil','rosemary','mint','lavender','sage','parsley','cilantro','dill','thyme','oregano','chive'].some(v => lower.includes(v))) return 'Herb'
  if (['rose','zinnia','marigold','sunflower','dahlia','peony','tulip','daisy','lily','flower'].some(v => lower.includes(v))) return 'Flower'
  if (['strawberry','blueberry','raspberry','watermelon','melon','grape','apple','peach','cherry'].some(v => lower.includes(v))) return 'Fruit'
  return 'Vegetable'
}

export default function PlantsPage() {
  const [plants, setPlants] = useState([])
  const [beds, setBeds] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortBy, setSortBy] = useState('Recently Updated')
  const [showFilters, setShowFilters] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const [selectedPlant, setSelectedPlant] = useState(null)
  const [showImportConfirm, setShowImportConfirm] = useState(false)
  const [importPreview, setImportPreview] = useState([])

  // Load plants from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gardenpilot_plants')
      if (saved) setPlants(JSON.parse(saved))
    } catch (e) { console.error('Error loading plants:', e) }
  }, [])

  // Load beds from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gardenpilot_beds')
      if (saved) setBeds(JSON.parse(saved))
    } catch (e) { console.error('Error loading beds:', e) }
  }, [])

  // Save plants to localStorage
  useEffect(() => {
    try {
      if (plants.length > 0) {
        localStorage.setItem('gardenpilot_plants', JSON.stringify(plants))
      }
    } catch (e) { console.error('Error saving plants:', e) }
  }, [plants])

  // Calculate bed plants not yet in My Plants
  const bedsWithPlants = beds.filter(b => b.plants.some(p => p.placed.length > 0))
  const totalBedPlants = bedsWithPlants.reduce((s, b) =>
    s + b.plants.reduce((ps, p) => ps + p.placed.length, 0), 0)

  const buildImportPreview = () => {
    const preview = []
    beds.forEach(bed => {
      bed.plants.forEach(plant => {
        if (plant.placed.length === 0) return
        // Check if already imported (match by name + bed)
        const alreadyExists = plants.some(p =>
          p.name.toLowerCase() === plant.name.toLowerCase() && p.bed === bed.name)
        if (!alreadyExists) {
          preview.push({
            id: Date.now() + Math.random(),
            name: plant.name,
            variety: '',
            category: guessCategory(plant.name),
            status: 'Growing',
            health: 'Good',
            bed: bed.name,
            seedsPlanted: plant.placed.length,
            seedsSprouted: plant.placed.length,
            nextAction: 'Check on plant',
            daysToHarvest: 30,
            photo: null,
            germRate: 100,
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

  const confirmImport = () => {
    setPlants(prev => [...prev, ...importPreview])
    setShowImportConfirm(false)
    setImportPreview([])
  }

  const addPlant = (plant) => {
    setPlants(prev => [...prev, { ...plant, id: Date.now() }])
    setShowWizard(false)
  }

  const updatePlant = (updated) => {
    setPlants(prev => prev.map(p => p.id === updated.id ? updated : p))
    setSelectedPlant(updated)
  }

  const filtered = plants.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.variety?.toLowerCase().includes(search.toLowerCase()) ||
                        p.bed?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  if (selectedPlant) return (
    <PlantDetail plant={selectedPlant} onBack={() => setSelectedPlant(null)}
      onUpdate={updatePlant} statusColors={STATUS_COLORS} />
  )

  if (showWizard) return (
    <AddPlantWizard onSave={addPlant} onCancel={() => setShowWizard(false)} />
  )

  return (
    <div className="space-y-5 pb-20">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-garden-900">My Plants</h1>
          <p className="text-garden-500 text-sm mt-1">{plants.length} plants this season</p>
        </div>
        <button onClick={() => setShowWizard(true)} className="btn-primary flex-shrink-0">
          <Plus size={16} /> Add Plant
        </button>
      </div>

      {/* Smart import banner — shows when beds have plants but My Plants is empty or has unimported plants */}
      {bedsWithPlants.length > 0 && buildImportPreview().length > 0 && (
        <div className="card bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Grid3x3 size={18} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">
                You have {buildImportPreview().length} plants in your garden beds not yet tracked in My Plants
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Import them so you can track germination, health, harvests, and more
              </p>
            </div>
          </div>
          <button onClick={handleImportClick}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors">
            <Download size={14} /> Import {buildImportPreview().length} plants from my beds
          </button>
        </div>
      )}

      {/* Search + Filter */}
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
          <div>
            <p className="text-xs font-medium text-garden-600 mb-2">Sort by</p>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map(s => (
                <button key={s} onClick={() => setSortBy(s)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-all ${
                    sortBy === s ? 'bg-garden-600 text-white border-garden-600' : 'bg-white text-garden-600 border-garden-200 hover:border-garden-400'
                  }`}>{s}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Status pills */}
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

      {/* Plant list or empty state */}
      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 bg-garden-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Leaf size={28} className="text-garden-400" />
          </div>
          <h3 className="font-display text-lg font-semibold text-garden-800 mb-2">
            {plants.length === 0 ? 'No plants yet' : 'No plants found'}
          </h3>
          <p className="text-garden-400 text-sm mb-5">
            {plants.length === 0
              ? 'Add your first plant to get started'
              : `No plants matching "${search}"`}
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
            <PlantCard key={plant.id} plant={plant} statusColors={STATUS_COLORS}
              onClick={() => setSelectedPlant(plant)} />
          ))}
        </div>
      )}

      {/* IMPORT CONFIRM MODAL */}
      {showImportConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className="px-5 pt-5 pb-3 border-b border-garden-100">
              <h3 className="font-display text-lg font-semibold text-garden-900 mb-1">
                Import {importPreview.length} {importPreview.length === 1 ? 'plant' : 'plants'}
              </h3>
              <p className="text-xs text-garden-500">
                These will be added to My Plants so you can track them individually
              </p>
            </div>
            <div className="px-5 py-4 max-h-64 overflow-y-auto">
              <div className="space-y-2">
                {importPreview.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-garden-50 rounded-xl border border-garden-100">
                    <span className="text-xl">🌱</span>
                    <div>
                      <p className="text-sm font-medium text-garden-800">{p.name}</p>
                      <p className="text-xs text-garden-400">{p.bed} · {p.seedsPlanted} {p.seedsPlanted === 1 ? 'plant' : 'plants'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-5 py-4 border-t border-garden-100 flex gap-3">
              <button onClick={() => setShowImportConfirm(false)}
                className="btn-secondary flex-1 justify-center py-2">
                Cancel
              </button>
              <button onClick={confirmImport}
                className="btn-primary flex-1 justify-center py-2">
                <Download size={14} /> Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
