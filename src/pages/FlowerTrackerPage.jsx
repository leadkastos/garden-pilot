import { useState } from 'react'
import { Plus, Download, Trash2, PlusCircle, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const defaultFlowers = [
  { id:1,  name:'Zinnia', variety:'Benary mix' },
  { id:2,  name:'Zinnia', variety:'Oklahoma mix' },
  { id:3,  name:'Zinnia', variety:'Aurora' },
  { id:4,  name:'Zinnia', variety:'Agave' },
  { id:5,  name:'Zinnia', variety:'Uproar' },
  { id:6,  name:'Zinnia', variety:'Oklahoma salmon' },
  { id:7,  name:'Zinnia', variety:'' },
  { id:8,  name:'Peony',  variety:'' },
  { id:9,  name:'Peony',  variety:'EXP' },
  { id:10, name:'Anemone',variety:'' },
  { id:11, name:'Sunflower', variety:'' },
  { id:12, name:'Sunflower', variety:'' },
  { id:13, name:'Sunflower', variety:'' },
]

const makeEmptyCycle = () => ({ planted:'', harvest:'', stems:'' })
const makeRow = (flower) => ({
  ...flower,
  seedDate:'', numSeeds:'', numGerm:'', dateGerm:'',
  cycles: [makeEmptyCycle(), makeEmptyCycle()]
})

let nextId = 100

export default function FlowerTrackerPage() {
  const [rows, setRows] = useState(defaultFlowers.map(makeRow))

  const update = (id, field, val) => setRows(r => r.map(x => x.id===id ? {...x, [field]:val} : x))
  const updateCycle = (id, ci, field, val) => setRows(r => r.map(x => {
    if (x.id !== id) return x
    const cycles = x.cycles.map((c, i) => i===ci ? {...c,[field]:val} : c)
    return {...x, cycles}
  }))
  const addCycle = (id) => setRows(r => r.map(x => x.id===id ? {...x, cycles:[...x.cycles, makeEmptyCycle()]} : x))
  const removeCycle = (id, ci) => setRows(r => r.map(x => {
    if (x.id !== id) return x
    const cycles = x.cycles.filter((_,i) => i !== ci)
    return {...x, cycles: cycles.length ? cycles : [makeEmptyCycle()]}
  }))
  const addRow = () => {
    nextId++
    setRows(r => [...r, makeRow({id:nextId, name:'', variety:''})])
  }
  const removeRow = (id) => setRows(r => r.filter(x => x.id !== id))

  const totalSeeds = rows.reduce((s,r) => s+(parseInt(r.numSeeds)||0), 0)
  const totalGerm  = rows.reduce((s,r) => s+(parseInt(r.numGerm)||0), 0)
  const totalStems = rows.reduce((s,r) => r.cycles.reduce((cs,c) => cs+(parseInt(c.stems)||0), s), 0)

  const exportCSV = () => {
    const headers = ['Flower','Variety','Seed Date','# Seeds','# Germ','Date Germ']
    const maxCycles = Math.max(...rows.map(r => r.cycles.length))
    for(let i=1;i<=maxCycles;i++) headers.push(`C${i} Planted`,`C${i} Harvest`,`C${i} Stems`)
    const csvRows = [headers.join(',')]
    rows.forEach(r => {
      const base = [r.name,r.variety,r.seedDate,r.numSeeds||'',r.numGerm||'',r.dateGerm]
      for(let i=0;i<maxCycles;i++) {
        const c = r.cycles[i]
        base.push(c?.planted||'', c?.harvest||'', c?.stems||'')
      }
      csvRows.push(base.join(','))
    })
    const blob = new Blob([csvRows.join('\n')],{type:'text/csv'})
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob)
    a.download='flower-tracker.csv'; a.click()
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/profile" className="text-garden-400 hover:text-garden-600 flex items-center gap-1 text-sm">
              <ArrowLeft size={14} /> Profile
            </Link>
          </div>
          <h1 className="font-display text-3xl font-semibold text-garden-900">Flower tracker</h1>
          <p className="text-garden-500 text-sm mt-1">Track seeding, germination, and multiple harvest cycles per flower</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="btn-secondary text-sm">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={addRow} className="btn-primary text-sm">
            <Plus size={14} /> Add flower
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Flowers tracked', value: rows.filter(r=>r.name).length },
          { label:'Total seeds',     value: totalSeeds },
          { label:'Germinated',      value: totalGerm },
          { label:'Total stems',     value: totalStems },
        ].map(({label,value}) => (
          <div key={label} className="stat-card">
            <div className="font-display text-3xl font-semibold text-garden-700">{value}</div>
            <div className="text-xs text-garden-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{minWidth:'900px'}}>
            <thead>
              <tr className="bg-garden-800 text-white">
                <th className="text-left px-4 py-3 font-medium text-garden-100 w-40">Flower</th>
                <th className="px-3 py-3 font-medium text-garden-100 text-center border-l border-garden-700">Seed date</th>
                <th className="px-3 py-3 font-medium text-garden-100 text-center border-l border-garden-700"># Seeds</th>
                <th className="px-3 py-3 font-medium text-garden-100 text-center border-l border-garden-700"># Germ</th>
                <th className="px-3 py-3 font-medium text-garden-100 text-center border-l border-garden-700">Date germ</th>
                <th className="px-3 py-3 font-medium text-garden-100 text-center border-l-2 border-garden-500" colSpan={99}>
                  Harvest cycles (expandable per row)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-garden-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-garden-50 transition-colors align-top">
                  {/* Flower name */}
                  <td className="px-4 py-2 w-40">
                    <input className="w-full text-xs font-medium text-garden-900 bg-transparent outline-none placeholder-garden-300 focus:bg-garden-50 rounded px-1 py-0.5"
                      value={row.name} placeholder="Flower name"
                      onChange={e => update(row.id,'name',e.target.value)} />
                    <input className="w-full text-[11px] text-garden-400 bg-transparent outline-none placeholder-garden-200 focus:bg-garden-50 rounded px-1 py-0.5 mt-0.5"
                      value={row.variety} placeholder="variety"
                      onChange={e => update(row.id,'variety',e.target.value)} />
                  </td>
                  {/* Seed info */}
                  <td className="px-1 py-2 border-l border-garden-100">
                    <input type="date" value={row.seedDate} onChange={e=>update(row.id,'seedDate',e.target.value)}
                      className="w-full text-[11px] text-garden-700 bg-transparent border-none outline-none focus:bg-garden-100 rounded px-1 py-1 text-center" />
                  </td>
                  <td className="px-1 py-2 border-l border-garden-100">
                    <input type="number" min="0" value={row.numSeeds} placeholder="0"
                      onChange={e=>update(row.id,'numSeeds',e.target.value)}
                      className="w-16 text-[11px] text-garden-700 bg-transparent border-none outline-none focus:bg-garden-100 rounded px-1 py-1 text-center mx-auto block" />
                  </td>
                  <td className="px-1 py-2 border-l border-garden-100">
                    <input type="number" min="0" value={row.numGerm} placeholder="0"
                      onChange={e=>update(row.id,'numGerm',e.target.value)}
                      className="w-16 text-[11px] text-garden-700 bg-transparent border-none outline-none focus:bg-garden-100 rounded px-1 py-1 text-center mx-auto block" />
                  </td>
                  <td className="px-1 py-2 border-l border-garden-100">
                    <input type="date" value={row.dateGerm} onChange={e=>update(row.id,'dateGerm',e.target.value)}
                      className="w-full text-[11px] text-garden-700 bg-transparent border-none outline-none focus:bg-garden-100 rounded px-1 py-1 text-center" />
                  </td>
                  {/* Harvest cycles */}
                  {row.cycles.map((cycle, ci) => (
                    <td key={ci} className="border-l-2 border-garden-200 px-1 py-2">
                      <div className="flex items-center justify-between mb-1 px-1">
                        <span className="text-[10px] font-medium text-garden-500">Cycle {ci+1}</span>
                        {row.cycles.length > 1 && (
                          <button onClick={()=>removeCycle(row.id,ci)} className="text-garden-300 hover:text-red-400 transition-colors">
                            <Trash2 size={10} />
                          </button>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div>
                          <div className="text-[10px] text-garden-400 text-center mb-0.5">Planted</div>
                          <input type="date" value={cycle.planted} onChange={e=>updateCycle(row.id,ci,'planted',e.target.value)}
                            className="w-full text-[10px] text-garden-700 bg-transparent border-none outline-none focus:bg-garden-100 rounded px-1 py-0.5 text-center" />
                        </div>
                        <div>
                          <div className="text-[10px] text-garden-400 text-center mb-0.5">Harvest</div>
                          <input type="date" value={cycle.harvest} onChange={e=>updateCycle(row.id,ci,'harvest',e.target.value)}
                            className="w-full text-[10px] text-garden-700 bg-transparent border-none outline-none focus:bg-garden-100 rounded px-1 py-0.5 text-center" />
                        </div>
                        <div>
                          <div className="text-[10px] text-garden-400 text-center mb-0.5"># Stems</div>
                          <input type="number" min="0" value={cycle.stems} placeholder="0"
                            onChange={e=>updateCycle(row.id,ci,'stems',e.target.value)}
                            className="w-full text-[10px] text-garden-700 bg-transparent border-none outline-none focus:bg-garden-100 rounded px-1 py-0.5 text-center" />
                        </div>
                      </div>
                    </td>
                  ))}
                  {/* Add cycle + delete row */}
                  <td className="px-2 py-2 border-l border-garden-100">
                    <div className="flex flex-col gap-2 items-center">
                      <button onClick={()=>addCycle(row.id)}
                        className="flex items-center gap-1 text-[10px] text-garden-500 hover:text-garden-700 bg-garden-50 hover:bg-garden-100 px-2 py-1 rounded-lg transition-colors whitespace-nowrap">
                        <PlusCircle size={10} /> Add cycle
                      </button>
                      <button onClick={()=>removeRow(row.id)}
                        className="text-garden-300 hover:text-red-400 transition-colors">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={addRow}
          className="w-full py-3 text-xs text-garden-500 hover:text-garden-700 hover:bg-garden-50 transition-colors border-t border-garden-100 flex items-center justify-center gap-1.5 font-medium">
          <Plus size={12} /> Add new flower row
        </button>
      </div>
    </div>
  )
}
