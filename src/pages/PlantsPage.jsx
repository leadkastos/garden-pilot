import { useState, useEffect } from 'react'
import { Plus, Search, SlidersHorizontal, Leaf } from 'lucide-react'
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

export default function PlantsPage() {
  const [plants, setPlants] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortBy, setSortBy] = useState('Recently Updated')
  const [showFilters, setShowFilters] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const [selectedPlant, setSelectedPlant] = useState(null)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gardenpilot_plants')
      if (saved) {
        setPlants(JSON.parse(saved))
      }
    } catch (e) { console.error('Error loading plants:', e) }
  }, [])

  // Save to localStorage whenever plants change
  useEffect(() => {
    try {
      if (plants.length > 0) {
        localStorage.setItem('gardenpilot_plants', JSON.stringify(plants))
      }
    } catch (e) { console.error('Error saving plants:', e) }
  }, [plants])

  const filtered = plants.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.variety?.toLowerCase().includes(search.toLowerCase()) ||
                        p.bed?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  const addPlant = (plant) => {
    setPlants(prev => [...prev, { ...plant, id: Date.now() }])
    setShowWizard(false)
  }

  const updatePlant = (updated) => {
    setPlants(prev => prev.map(p => p.id === updated.id ? updated : p))
    setSelectedPlant(updated)
  }

  if (selectedPlant) return (
    <PlantDetail plant={selectedPlant} onBack={() => setSelectedPlant(null)}
      onUpdate={updatePlant} statusColors={STATUS_COLORS} />
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

      {filtered.length === 0 ? (
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
            <PlantCard key={plant.id} plant={plant} statusColors={STATUS_COLORS}
              onClick={() => setSelectedPlant(plant)} />
          ))}
        </div>
      )}
    </div>
  )
}
