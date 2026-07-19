import { useState } from 'react'
import { ArrowLeft, Plus, Trash2, Check, X, Search, Sprout } from 'lucide-react'

// Shared dirt-cell look used across all bed views
const SOIL_BG = 'radial-gradient(circle at 15% 25%, rgba(0,0,0,0.28) 0.5px, transparent 1.5px), radial-gradient(circle at 45% 65%, rgba(0,0,0,0.22) 0.5px, transparent 1.5px), radial-gradient(circle at 75% 35%, rgba(255,255,255,0.06) 0.5px, transparent 1.5px), radial-gradient(circle at 30% 80%, rgba(0,0,0,0.25) 0.5px, transparent 1.5px), radial-gradient(circle at 85% 75%, rgba(120,72,40,0.3) 1px, transparent 2px), radial-gradient(circle at 55% 15%, rgba(90,55,30,0.35) 1px, transparent 2px), linear-gradient(145deg, #6b4a2a 0%, #5a3d22 45%, #4d3319 100%)'

// ─── COMPREHENSIVE PLANT LIBRARY ───────────────────────────────────────────
const PLANT_CATEGORIES = {
  'Vegetables': [
    { name:'Tomato',        emoji:'🍅', color:'#ef4444' },
    { name:'Cherry Tomato', emoji:'🍅', color:'#dc2626' },
    { name:'Roma Tomato',   emoji:'🍅', color:'#b91c1c' },
    { name:'Bell Pepper',   emoji:'🫑', color:'#16a34a' },
    { name:'Hot Pepper',    emoji:'🌶️', color:'#dc2626' },
    { name:'Jalapeño',      emoji:'🌶️', color:'#15803d' },
    { name:'Cucumber',      emoji:'🥒', color:'#84cc16' },
    { name:'Zucchini',      emoji:'🥒', color:'#65a30d' },
    { name:'Yellow Squash', emoji:'🎃', color:'#f59e0b' },
    { name:'Pumpkin',       emoji:'🎃', color:'#ea580c' },
    { name:'Butternut Squash', emoji:'🎃', color:'#d97706' },
    { name:'Lettuce',       emoji:'🥬', color:'#22c55e' },
    { name:'Spinach',       emoji:'🍃', color:'#16a34a' },
    { name:'Kale',          emoji:'🥦', color:'#15803d' },
    { name:'Arugula',       emoji:'🥬', color:'#4ade80' },
    { name:'Swiss Chard',   emoji:'🥬', color:'#86efac' },
    { name:'Carrot',        emoji:'🥕', color:'#f97316' },
    { name:'Radish',        emoji:'🌱', color:'#e11d48' },
    { name:'Beet',          emoji:'🌱', color:'#9f1239' },
    { name:'Turnip',        emoji:'🌱', color:'#a3a3a3' },
    { name:'Parsnip',       emoji:'🌱', color:'#d4d4d4' },
    { name:'Broccoli',      emoji:'🥦', color:'#16a34a' },
    { name:'Cauliflower',   emoji:'🥦', color:'#f5f5f4' },
    { name:'Cabbage',       emoji:'🥬', color:'#4ade80' },
    { name:'Brussels Sprouts', emoji:'🥦', color:'#15803d' },
    { name:'Green Bean',    emoji:'🫘', color:'#84cc16' },
    { name:'Pole Bean',     emoji:'🫘', color:'#65a30d' },
    { name:'Lima Bean',     emoji:'🫘', color:'#a3e635' },
    { name:'Pea',           emoji:'🫛', color:'#4ade80' },
    { name:'Snow Pea',      emoji:'🫛', color:'#86efac' },
    { name:'Corn',          emoji:'🌽', color:'#eab308' },
    { name:'Onion',         emoji:'🧅', color:'#a3a3a3' },
    { name:'Green Onion',   emoji:'🌱', color:'#4ade80' },
    { name:'Leek',          emoji:'🌱', color:'#84cc16' },
    { name:'Garlic',        emoji:'🧄', color:'#d4d4d4' },
    { name:'Shallot',       emoji:'🧅', color:'#c4b5fd' },
    { name:'Potato',        emoji:'🥔', color:'#a16207' },
    { name:'Sweet Potato',  emoji:'🥔', color:'#c2410c' },
    { name:'Eggplant',      emoji:'🍆', color:'#7e22ce' },
    { name:'Okra',          emoji:'🌱', color:'#16a34a' },
    { name:'Asparagus',     emoji:'🌱', color:'#4ade80' },
    { name:'Artichoke',     emoji:'🌱', color:'#65a30d' },
    { name:'Celery',        emoji:'🌱', color:'#84cc16' },
    { name:'Fennel',        emoji:'🌱', color:'#a3e635' },
    { name:'Bok Choy',      emoji:'🥬', color:'#22c55e' },
    { name:'Kohlrabi',      emoji:'🌱', color:'#86efac' },
    { name:'Rutabaga',      emoji:'🌱', color:'#d4d4aa' },
    { name:'Collard Greens',emoji:'🥬', color:'#15803d' },
    { name:'Mustard Greens',emoji:'🥬', color:'#65a30d' },
    { name:'Watercress',    emoji:'🌿', color:'#4ade80' },
  ],
  'Herbs': [
    { name:'Basil',         emoji:'🌿', color:'#16a34a' },
    { name:'Thai Basil',    emoji:'🌿', color:'#15803d' },
    { name:'Rosemary',      emoji:'🌿', color:'#166534' },
    { name:'Thyme',         emoji:'🌿', color:'#4ade80' },
    { name:'Oregano',       emoji:'🌿', color:'#86efac' },
    { name:'Mint',          emoji:'🍃', color:'#4ade80' },
    { name:'Spearmint',     emoji:'🍃', color:'#6ee7b7' },
    { name:'Peppermint',    emoji:'🍃', color:'#34d399' },
    { name:'Lavender',      emoji:'💜', color:'#a855f7' },
    { name:'Sage',          emoji:'🌿', color:'#84cc16' },
    { name:'Parsley',       emoji:'🌿', color:'#22c55e' },
    { name:'Cilantro',      emoji:'🌿', color:'#4ade80' },
    { name:'Dill',          emoji:'🌿', color:'#a3e635' },
    { name:'Chives',        emoji:'🌱', color:'#84cc16' },
    { name:'Tarragon',      emoji:'🌿', color:'#65a30d' },
    { name:'Lemon Balm',    emoji:'🍋', color:'#eab308' },
    { name:'Chamomile',     emoji:'🌼', color:'#fde68a' },
    { name:'Lemongrass',    emoji:'🌾', color:'#d9f99d' },
    { name:'Bay Leaf',      emoji:'🌿', color:'#166534' },
    { name:'Marjoram',      emoji:'🌿', color:'#4ade80' },
    { name:'Catnip',        emoji:'🌿', color:'#86efac' },
    { name:'Stevia',        emoji:'🌿', color:'#bbf7d0' },
    { name:'Borage',        emoji:'🌸', color:'#60a5fa' },
    { name:'Lemon Verbena', emoji:'🍋', color:'#fef08a' },
    { name:'Chervil',       emoji:'🌿', color:'#a3e635' },
  ],
  'Flowers': [
    { name:'Sunflower',     emoji:'🌻', color:'#eab308' },
    { name:'Rose',          emoji:'🌹', color:'#e11d48' },
    { name:'Zinnia',        emoji:'🌸', color:'#ec4899' },
    { name:'Marigold',      emoji:'🌼', color:'#f59e0b' },
    { name:'Peony',         emoji:'🌸', color:'#fb7185' },
    { name:'Dahlia',        emoji:'🌸', color:'#f43f5e' },
    { name:'Tulip',         emoji:'🌷', color:'#e11d48' },
    { name:'Daisy',         emoji:'🌼', color:'#fbbf24' },
    { name:'Lily',          emoji:'🌸', color:'#fb923c' },
    { name:'Hydrangea',     emoji:'💐', color:'#818cf8' },
    { name:'Anemone',       emoji:'🌸', color:'#c026d3' },
    { name:'Ranunculus',    emoji:'🌸', color:'#f97316' },
    { name:'Cosmos',        emoji:'🌸', color:'#e879f9' },
    { name:'Salvia',        emoji:'💜', color:'#7c3aed' },
    { name:'Black-Eyed Susan', emoji:'🌻', color:'#d97706' },
    { name:'Coneflower',    emoji:'🌸', color:'#db2777' },
    { name:'Snapdragon',    emoji:'🌸', color:'#f472b6' },
    { name:'Pansy',         emoji:'🌸', color:'#7c3aed' },
    { name:'Impatiens',     emoji:'🌸', color:'#f43f5e' },
    { name:'Begonia',       emoji:'🌸', color:'#fb7185' },
    { name:'Petunia',       emoji:'🌸', color:'#a855f7' },
    { name:'Nasturtium',    emoji:'🌼', color:'#ea580c' },
    { name:'Lavender',      emoji:'💜', color:'#a855f7' },
    { name:'Foxglove',      emoji:'🌸', color:'#db2777' },
    { name:'Hollyhock',     emoji:'🌸', color:'#e879f9' },
    { name:'Larkspur',      emoji:'💜', color:'#6366f1' },
    { name:'Sweet Pea',     emoji:'🌸', color:'#f9a8d4' },
    { name:'Morning Glory', emoji:'🌸', color:'#818cf8' },
    { name:'Verbena',       emoji:'🌸', color:'#c084fc' },
    { name:'Columbine',     emoji:'🌸', color:'#818cf8' },
    { name:'Echinacea',     emoji:'🌸', color:'#f472b6' },
    { name:'Yarrow',        emoji:'🌼', color:'#fde68a' },
    { name:'Baptisia',      emoji:'💜', color:'#4f46e5' },
    { name:'Aster',         emoji:'🌸', color:'#818cf8' },
    { name:'Chrysanthemum', emoji:'🌸', color:'#fbbf24' },
  ],
  'Fruits': [
    { name:'Strawberry',    emoji:'🍓', color:'#ef4444' },
    { name:'Blueberry',     emoji:'🫐', color:'#4f46e5' },
    { name:'Raspberry',     emoji:'🍇', color:'#be185d' },
    { name:'Blackberry',    emoji:'🍇', color:'#581c87' },
    { name:'Watermelon',    emoji:'🍉', color:'#16a34a' },
    { name:'Cantaloupe',    emoji:'🍈', color:'#f59e0b' },
    { name:'Honeydew',      emoji:'🍈', color:'#84cc16' },
    { name:'Grape',         emoji:'🍇', color:'#7c3aed' },
    { name:'Fig',           emoji:'🍑', color:'#7c2d12' },
    { name:'Lemon',         emoji:'🍋', color:'#eab308' },
    { name:'Lime',          emoji:'🍋', color:'#16a34a' },
    { name:'Apple',         emoji:'🍎', color:'#dc2626' },
    { name:'Pear',          emoji:'🍐', color:'#84cc16' },
    { name:'Peach',         emoji:'🍑', color:'#fb923c' },
    { name:'Plum',          emoji:'🍑', color:'#7e22ce' },
    { name:'Cherry',        emoji:'🍒', color:'#dc2626' },
    { name:'Gooseberry',    emoji:'🍇', color:'#65a30d' },
    { name:'Currant',       emoji:'🍇', color:'#dc2626' },
    { name:'Elderberry',    emoji:'🍇', color:'#4338ca' },
    { name:'Kiwi',          emoji:'🥝', color:'#65a30d' },
    { name:'Passion Fruit', emoji:'🍑', color:'#7c3aed' },
  ],
  'Shrubs & Trees': [
    { name:'Boxwood',       emoji:'🌲', color:'#15803d' },
    { name:'Holly',         emoji:'🌲', color:'#166534' },
    { name:'Azalea',        emoji:'🌸', color:'#e11d48' },
    { name:'Rhododendron',  emoji:'🌸', color:'#be185d' },
    { name:'Forsythia',     emoji:'🌼', color:'#eab308' },
    { name:'Lilac',         emoji:'💜', color:'#a855f7' },
    { name:'Butterfly Bush', emoji:'🦋', color:'#7c3aed' },
    { name:'Spirea',        emoji:'🌸', color:'#fb7185' },
    { name:'Weigela',       emoji:'🌸', color:'#f43f5e' },
    { name:'Viburnum',      emoji:'🌿', color:'#4ade80' },
    { name:'Knockout Rose', emoji:'🌹', color:'#dc2626' },
    { name:'Crepe Myrtle',  emoji:'🌸', color:'#f472b6' },
    { name:'Bluebeard',     emoji:'💜', color:'#4f46e5' },
    { name:'Witch Hazel',   emoji:'🌼', color:'#d97706' },
    { name:'Euonymus',      emoji:'🌿', color:'#16a34a' },
    { name:'Nandina',       emoji:'🌿', color:'#dc2626' },
    { name:'Ornamental Grass', emoji:'🌾', color:'#84cc16' },
    { name:'Japanese Maple', emoji:'🍁', color:'#dc2626' },
    { name:'Dogwood',       emoji:'🌸', color:'#fda4af' },
    { name:'Redbud',        emoji:'🌸', color:'#db2777' },
  ],
}
// Keyword → emoji map for custom plant search
const EMOJI_MAP = {
  tomato:'🍅', pepper:'🌶️', cucumber:'🥒', squash:'🎃', zucchini:'🥒',
  lettuce:'🥬', spinach:'🍃', kale:'🥦', carrot:'🥕', radish:'🌱',
  bean:'🫘', pea:'🫛', corn:'🌽', onion:'🧅', garlic:'🧄', potato:'🥔',
  eggplant:'🍆', broccoli:'🥦', cauliflower:'🥦', cabbage:'🥬',
  basil:'🌿', rosemary:'🌿', mint:'🍃', lavender:'💜', sage:'🌿',
  parsley:'🌿', cilantro:'🌿', dill:'🌿', chive:'🌱', thyme:'🌿',
  sunflower:'🌻', rose:'🌹', zinnia:'🌸', marigold:'🌼', peony:'🌸',
  dahlia:'🌸', tulip:'🌷', daisy:'🌼', lily:'🌸', hydrangea:'💐',
  strawberry:'🍓', blueberry:'🫐', raspberry:'🍇', watermelon:'🍉',
  grape:'🍇', lemon:'🍋', apple:'🍎', peach:'🍑', cherry:'🍒',
  tree:'🌲', shrub:'🌿', grass:'🌾', fern:'🌿', cactus:'🌵',
  herb:'🌿', flower:'🌸', fruit:'🍑', vegetable:'🥬',
}
function guessEmoji(name) {
  const lower = name.toLowerCase()
  for (const [keyword, emoji] of Object.entries(EMOJI_MAP)) {
    if (lower.includes(keyword)) return emoji
  }
  return '🌱'
}
let plantIdCounter = 100
export default function BedBuilder({ bed, unplacedPlants = [], onSave, onCancel }) {
  const [step, setStep] = useState(bed ? 2 : 0)
  const [name, setName] = useState(bed?.name || '')
  const [length, setLength] = useState(bed?.length || '')
  const [width, setWidth] = useState(bed?.width || '')
  const [plants, setPlants] = useState(bed?.plants || [])
  const [showPlantPicker, setShowPlantPicker] = useState(false)
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [selectedPlant, setSelectedPlant] = useState(null) // for mobile tap mode
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024
  const cols = Math.min(parseInt(length) * 2 || 0, 24)
  const rows = Math.min(parseInt(width) * 2 || 0, 16)
  const grid = Array(rows).fill(null).map(() => Array(cols).fill(null))
  plants.forEach(plant => {
    plant.placed?.forEach(pos => {
      if (pos.row < rows && pos.col < cols) {
        grid[pos.row][pos.col] = plant
      }
    })
  })
  // IDs of tracked plants already added to this bed's palette
  const addedSourceIds = plants.filter(p => p.sourcePlantId).map(p => p.sourcePlantId)
  const availableTracked = unplacedPlants.filter(p => !addedSourceIds.includes(p.id))
  const addPlant = (template) => {
    const newPlant = {
      id: `plant-${++plantIdCounter}`,
      name: template.name,
      emoji: template.emoji,
      color: template.color,
      sourcePlantId: template.sourcePlantId || null,
      placed: []
    }
    setPlants(prev => [...prev, newPlant])
    setShowPlantPicker(false)
  }
  const removePlant = (plantId) => {
    setPlants(prev => prev.filter(p => p.id !== plantId))
  }
  const handleCellDrop = (row, col) => {
    if (!dragging) return
    const occupied = plants.some(p => p.placed?.some(pos => pos.row === row && pos.col === col))
    if (occupied) return
    setPlants(prev => prev.map(p => {
      if (p.id !== dragging.plantId) return p
      if (dragging.fromPos) {
        const newPlaced = p.placed.filter(pos => !(pos.row === dragging.fromPos.row && pos.col === dragging.fromPos.col))
        return { ...p, placed: [...newPlaced, { row, col }] }
      }
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
              <p className="text-garden-500 text-sm">{isMobile ? 'Tap a plant to select it, then tap cells in the grid to place it' : 'Add plants then drag them into position on the grid'}</p>
            </div>
            {/* Plant Palette */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-garden-900 text-sm">Your plants</h3>
                <button onClick={() => setShowPlantPicker(true)} className="btn-primary text-xs py-1.5 px-3">
                  <Plus size={12} /> Add plant
                </button>
              </div>
              {plants.length === 0 ? (
                <p className="text-garden-400 text-sm text-center py-4">No plants added yet — click Add plant to start</p>
              ) : (
                <div className="space-y-2">
                  {plants.map(plant => (
                    <div key={plant.id}
                      onClick={() => isMobile && setSelectedPlant(selectedPlant?.id === plant.id ? null : plant)}
                      className={`flex items-center gap-3 p-2 rounded-xl border transition-all ${
                        isMobile && selectedPlant?.id === plant.id
                          ? 'bg-garden-100 border-garden-500 ring-2 ring-garden-400'
                          : 'bg-garden-50 border-garden-100'
                      } ${isMobile ? 'cursor-pointer active:scale-95' : ''}`}>
                      <div draggable={!isMobile}
                        onDragStart={!isMobile ? () => setDragging({ plantId: plant.id, fromPos: null }) : undefined}
                        className={`text-2xl select-none ${!isMobile ? 'cursor-grab active:cursor-grabbing' : ''}`}>
                        {plant.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-garden-800 flex items-center gap-1.5">
                          {plant.name}
                          {plant.sourcePlantId && (
                            <span className="text-[9px] font-semibold text-garden-600 bg-garden-100 border border-garden-200 px-1.5 py-0.5 rounded-full">tracked</span>
                          )}
                        </p>
                        <p className="text-xs text-garden-400">
                          {isMobile && selectedPlant?.id === plant.id
                            ? '✅ Selected — tap grid to place'
                            : `${plant.placed.length} placed in bed`}
                        </p>
                      </div>
                      <button onClick={e => { e.stopPropagation(); removePlant(plant.id) }}
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
                  <p className="text-xs text-garden-400">{isMobile ? (selectedPlant ? `Tap to place ${selectedPlant.emoji} ${selectedPlant.name}` : 'Tap a plant above first') : 'Drag plants onto the grid'}</p>
                </div>
                <div className="overflow-x-auto">
                  <div className="inline-block">
                    <div className="grid border-2 rounded-xl overflow-hidden"
                      style={{ gridTemplateColumns: `repeat(${cols}, minmax(32px, 1fr))`, minWidth: `${cols * 36}px`, borderColor: '#4a3319' }}>
                      {Array(rows).fill(null).map((_, ri) =>
                        Array(cols).fill(null).map((__, ci) => {
                          const cell = grid[ri]?.[ci]
                          const isOver = dragOver?.row === ri && dragOver?.col === ci
                          const handleCellTap = () => {
                            if (!isMobile) return
                            if (cell) {
                              // Tap occupied cell = remove it
                              removeFromCell(ri, ci)
                            } else if (selectedPlant) {
                              // Tap empty cell = place selected plant
                              setPlants(prev => prev.map(p =>
                                p.id === selectedPlant.id
                                  ? { ...p, placed: [...(p.placed || []), { row: ri, col: ci }] }
                                  : p
                              ))
                            }
                          }
                          return (
                            <div key={`${ri}-${ci}`}
                              className={`relative flex items-center justify-center transition-all
                                ${isMobile && selectedPlant && !cell ? 'cursor-pointer' : ''}
                                ${isMobile && cell ? 'cursor-pointer' : ''}
                                ${!isMobile && !cell ? 'cursor-crosshair' : ''}
                                ${!isMobile && cell ? 'cursor-move' : ''}`}
                              style={{
                                width: isMobile ? 40 : 36,
                                height: isMobile ? 40 : 36,
                                background: isOver ? '#3d6b34' : SOIL_BG,
                                borderRight: '1px solid rgba(0,0,0,0.18)',
                                borderBottom: '1px solid rgba(0,0,0,0.18)',
                              }}
                              onClick={handleCellTap}
                              onDragOver={!isMobile ? e => { e.preventDefault(); setDragOver({ row: ri, col: ci }) } : undefined}
                              onDragLeave={!isMobile ? () => setDragOver(null) : undefined}
                              onDrop={!isMobile ? () => handleCellDrop(ri, ci) : undefined}>
                              {cell && (
                                <div draggable={!isMobile}
                                  onDragStart={!isMobile ? () => setDragging({ plantId: cell.id, fromPos: { row: ri, col: ci } }) : undefined}
                                  className="text-2xl select-none leading-none">{cell.emoji}</div>
                              )}
                              {cell && !isMobile && (
                                <button onClick={() => removeFromCell(ri, ci)}
                                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-20">
                                  ×
                                </button>
                              )}
                              {cell && isMobile && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center z-20">
                                  ×
                                </div>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                    <div className="flex justify-between mt-1 px-1">
                      <span className="text-[10px] text-garden-400">← {length} ft →</span>
                      <span className="text-[10px] text-garden-400">{width} ft ↕</span>
                    </div>
                  </div>
                </div>
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
      {/* ── PLANT PICKER MODAL ── */}
      {showPlantPicker && (
        <PlantPickerModal
          onAdd={addPlant}
          onClose={() => setShowPlantPicker(false)}
          availableTracked={availableTracked}
        />
      )}
      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-garden-100 px-4 py-3 flex gap-3">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex-shrink-0 px-4">← Back</button>
        )}
        {step < 2 ? (
          <button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}
            className="btn-primary flex-1 justify-center py-3 text-base disabled:opacity-40">
            Continue →
          </button>
        ) : (
          <button onClick={handleSave} className="btn-primary flex-1 justify-center py-3 text-base">
            <Check size={16} /> Save Bed
          </button>
        )}
      </div>
    </div>
  )
}
// ── PLANT PICKER MODAL ────────────────────────────────────────────────────
function PlantPickerModal({ onAdd, onClose, availableTracked = [] }) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Vegetables')
  const [customName, setCustomName] = useState('')
  const categories = Object.keys(PLANT_CATEGORIES)
  const filtered = search.trim()
    ? Object.values(PLANT_CATEGORIES).flat().filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()))
    : PLANT_CATEGORIES[activeCategory] || []
  const handleCustomAdd = () => {
    if (!customName.trim()) return
    onAdd({
      name: customName.trim(),
      emoji: guessEmoji(customName),
      color: '#4a9e3f'
    })
    setCustomName('')
  }
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[88vh] flex flex-col shadow-xl">
        {/* Modal header */}
        <div className="px-5 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-xl font-semibold text-garden-900">Add a plant</h3>
            <button onClick={onClose}><X size={20} className="text-garden-400" /></button>
          </div>
          {/* Search */}
          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-garden-400" />
            <input
              type="text"
              placeholder="Search any plant..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9"
              autoFocus
            />
          </div>
          {/* Custom plant entry */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Can't find it? Type any plant name..."
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCustomAdd()}
              className="input-field flex-1 text-sm"
            />
            <button onClick={handleCustomAdd} disabled={!customName.trim()}
              className="btn-primary px-4 text-sm disabled:opacity-40 flex-shrink-0">
              Add
            </button>
          </div>
          {/* Category tabs */}
          {!search && (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 transition-all ${
                    activeCategory === cat
                      ? 'bg-garden-600 text-white'
                      : 'bg-garden-50 text-garden-600 border border-garden-200 hover:border-garden-400'
                  }`}>
                  {cat === 'Vegetables' ? '🥦' : cat === 'Herbs' ? '🌿' : cat === 'Flowers' ? '🌸' : cat === 'Fruits' ? '🍓' : '🌲'} {cat}
                </button>
              ))}
            </div>
          )}
          {search && (
            <p className="text-xs text-garden-500">{filtered.length} results for "{search}"</p>
          )}
        </div>
        {/* Plant grid */}
        <div className="overflow-y-auto flex-1 px-5 pb-5">
          {/* From My Plants — tracked, unplaced plants */}
          {!search && availableTracked.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Sprout size={14} className="text-garden-600" />
                <h4 className="text-xs font-semibold text-garden-700">From My Plants</h4>
              </div>
              <div className="space-y-1.5">
                {availableTracked.map(tp => (
                  <button key={tp.id}
                    onClick={() => onAdd({
                      name: tp.name,
                      emoji: guessEmoji(tp.name),
                      color: '#4a9e3f',
                      sourcePlantId: tp.id,
                    })}
                    className="w-full flex items-center gap-3 p-2.5 bg-garden-50 hover:bg-garden-100 border border-garden-200 rounded-xl transition-all active:scale-[0.98] text-left">
                    <span className="text-xl">{guessEmoji(tp.name)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-garden-800 truncate">{tp.name}</p>
                      <p className="text-[11px] text-garden-400">{tp.category || 'Needs a bed'}</p>
                    </div>
                    <Plus size={15} className="text-garden-500 flex-shrink-0" />
                  </button>
                ))}
              </div>
              <div className="border-t border-garden-100 mt-4" />
            </div>
          )}
          {filtered.length === 0 && search ? (
            <div className="text-center py-8">
              <p className="text-garden-400 text-sm mb-3">No plants found for "{search}"</p>
              <p className="text-garden-400 text-xs">Type it in the box above and click Add to create a custom plant</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {filtered.map(p => (
                <button key={p.name} onClick={() => onAdd(p)}
                  className="flex flex-col items-center gap-1 p-2.5 bg-garden-50 hover:bg-garden-100 rounded-2xl border border-garden-100 transition-all active:scale-95">
                  <span className="text-2xl">{p.emoji}</span>
                  <span className="text-[10px] font-medium text-garden-700 text-center leading-tight">{p.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
