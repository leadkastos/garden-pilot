import { useRef, useState, useEffect } from 'react'
import { ArrowLeft, Printer, Pencil, Plus, X, BookOpen } from 'lucide-react'

export default function BedDiagram({ bed, onBack, onEdit }) {
  const printRef = useRef()
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [showNotes, setShowNotes] = useState(false)

  const storageKey = `gardenpilot_bed_notes_${bed.id}`

  // Load notes from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) setNotes(JSON.parse(saved))
    } catch (e) { console.error('Error loading notes:', e) }
  }, [bed.id])

  // Save notes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(notes))
    } catch (e) { console.error('Error saving notes:', e) }
  }, [notes])

  const saveNote = () => {
    if (!newNote.trim()) return
    const now = new Date()
    const stamp = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' at ' + now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    const note = { id: Date.now(), text: newNote.trim(), timestamp: stamp }
    setNotes(prev => [note, ...prev])
    setNewNote('')
  }

  const deleteNote = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  const cols = Math.min(bed.length * 2, 24)
  const rows = Math.min(bed.width * 2, 16)

  const grid = Array(rows).fill(null).map(() => Array(cols).fill(null))
  bed.plants.forEach(plant => {
    plant.placed?.forEach(pos => {
      if (pos.row < rows && pos.col < cols) {
        grid[pos.row][pos.col] = plant
      }
    })
  })

  const totalPlants = bed.plants.reduce((s, p) => s + p.placed.length, 0)

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    const notesHTML = notes.length > 0 ? `
      <div class="notes-section">
        <h3>Bed notes</h3>
        ${notes.map(n => `
          <div class="note-item">
            <div class="note-date">${n.timestamp}</div>
            <div class="note-text">${n.text}</div>
          </div>
        `).join('')}
      </div>
    ` : ''

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${bed.name} — Garden Pilot</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Georgia', serif; padding: 32px; color: #1a3a17; background: white; }
            .print-header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #4a9e3f; padding-bottom: 16px; }
            .print-header h1 { font-size: 28px; color: #2d5a27; margin-bottom: 4px; }
            .print-header p { font-size: 14px; color: #6a8a65; }
            .grid-wrap { display: flex; justify-content: center; margin: 24px 0; }
            .bed-grid { border: 3px solid #8B6914; border-radius: 8px; overflow: hidden; background: #f9f5f0; display: inline-grid; }
            .grid-cell { width: 48px; height: 48px; border: 1px solid #d4c4a0; display: flex; align-items: center; justify-content: center; font-size: 24px; background: white; }
            .grid-cell.empty { background: #fdf8f0; }
            .dimension-label { text-align: center; font-size: 12px; color: #6a8a65; margin-top: 8px; }
            .legend { margin-top: 24px; padding: 16px; border: 1px solid #c8e0c3; border-radius: 8px; background: #f4f9f1; }
            .legend h3 { font-size: 14px; font-weight: bold; margin-bottom: 12px; color: #2d5a27; }
            .legend-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
            .legend-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
            .legend-emoji { font-size: 20px; }
            .notes-section { margin-top: 24px; padding: 16px; border: 1px solid #d4e8cf; border-radius: 8px; }
            .notes-section h3 { font-size: 14px; font-weight: bold; color: #2d5a27; margin-bottom: 12px; }
            .note-item { padding: 8px 0; border-bottom: 1px solid #e8f4e5; }
            .note-item:last-child { border-bottom: none; }
            .note-date { font-size: 10px; color: #6a8a65; margin-bottom: 3px; }
            .note-text { font-size: 13px; color: #1a3a17; }
            .stats { display: flex; justify-content: center; gap: 24px; margin: 12px 0; }
            .stat { text-align: center; }
            .stat-num { font-size: 20px; font-weight: bold; color: #2d5a27; }
            .stat-label { font-size: 11px; color: #6a8a65; }
            .footer { text-align: center; margin-top: 32px; font-size: 11px; color: #9ab095; border-top: 1px solid #d4e8cf; padding-top: 12px; }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>🌱 ${bed.name}</h1>
            <p>Garden Bed Layout · Printed ${new Date().toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })}</p>
          </div>
          <div class="stats">
            <div class="stat"><div class="stat-num">${bed.length} ft</div><div class="stat-label">Length</div></div>
            <div class="stat"><div class="stat-num">${bed.width} ft</div><div class="stat-label">Width</div></div>
            <div class="stat"><div class="stat-num">${bed.length * bed.width}</div><div class="stat-label">Sq Ft</div></div>
            <div class="stat"><div class="stat-num">${totalPlants}</div><div class="stat-label">Plants</div></div>
          </div>
          <div class="grid-wrap">
            <div>
              <div class="bed-grid" style="grid-template-columns: repeat(${cols}, 48px)">
                ${grid.map(row => row.map(cell =>
                  `<div class="grid-cell ${cell ? '' : 'empty'}">${cell ? cell.emoji : ''}</div>`
                ).join('')).join('')}
              </div>
              <div class="dimension-label">← ${bed.length} feet wide · ${bed.width} feet deep ↕</div>
            </div>
          </div>
          <div class="legend">
            <h3>What's planted:</h3>
            <div class="legend-grid">
              ${bed.plants.filter(p => p.placed.length > 0).map(p =>
                `<div class="legend-item"><span class="legend-emoji">${p.emoji}</span><span>${p.name} × ${p.placed.length}</span></div>`
              ).join('')}
            </div>
          </div>
          ${notesHTML}
          <div class="footer">
            Garden Pilot · TheGardenPilot.com · Your smart guide to a better garden
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => { printWindow.print(); printWindow.close() }, 500)
  }

  return (
    <div className="min-h-screen bg-parchment pb-20">
      {/* Header */}
      <div className="bg-garden-800 px-4 pt-4 pb-5">
        <button onClick={onBack} className="flex items-center gap-2 text-garden-300 hover:text-white mb-3 text-sm">
          <ArrowLeft size={16} /> Garden Beds
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-white">{bed.name}</h1>
            <p className="text-garden-400 text-sm mt-0.5">{bed.length} ft × {bed.width} ft · {totalPlants} plants</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowNotes(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-garden-700 hover:bg-garden-600 text-white rounded-xl text-sm transition-colors">
              <BookOpen size={13} /> Notes {notes.length > 0 && `(${notes.length})`}
            </button>
            <button onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-2 bg-garden-700 hover:bg-garden-600 text-white rounded-xl text-sm transition-colors">
              <Pencil size={13} /> Edit
            </button>
            <button onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-garden-700 hover:bg-garden-600 text-white rounded-xl text-sm transition-colors">
              <Printer size={13} /> Print
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 max-w-4xl mx-auto space-y-5" ref={printRef}>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Length', value: `${bed.length} ft` },
            { label: 'Width',  value: `${bed.width} ft` },
            { label: 'Sq Ft',  value: bed.length * bed.width },
            { label: 'Plants', value: totalPlants },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="font-display text-2xl font-semibold text-garden-900">{s.value}</div>
              <div className="text-xs text-garden-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Full Bed Diagram */}
        <div className="card overflow-x-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold text-garden-900">{bed.name} layout</h2>
            <span className="text-xs text-garden-400">Top-down view</span>
          </div>
          <div className="overflow-x-auto">
            <div className="inline-block">
              <div className="grid border-2 border-soil-400 rounded-xl overflow-hidden"
                style={{ gridTemplateColumns: `repeat(${cols}, minmax(40px, 1fr))`, minWidth: `${cols * 44}px`, background: '#f9f5f0' }}>
                {grid.map((row, ri) =>
                  row.map((cell, ci) => (
                    <div key={`${ri}-${ci}`}
                      className={`flex items-center justify-center border border-garden-200 ${cell ? 'bg-white' : 'bg-garden-50/50'}`}
                      style={{ width: 44, height: 44 }}>
                      {cell && <span className="text-2xl select-none">{cell.emoji}</span>}
                    </div>
                  ))
                )}
              </div>
              <div className="flex justify-between mt-1.5 px-1">
                <span className="text-xs text-garden-400">← {bed.length} feet →</span>
                <span className="text-xs text-garden-400">↕ {bed.width} ft</span>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        {bed.plants.some(p => p.placed.length > 0) && (
          <div className="card">
            <h3 className="font-medium text-garden-900 mb-3">What's planted in this bed</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {bed.plants.filter(p => p.placed.length > 0).map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-garden-50 rounded-xl border border-garden-100">
                  <span className="text-3xl">{p.emoji}</span>
                  <div>
                    <p className="text-sm font-medium text-garden-800">{p.name}</p>
                    <p className="text-xs text-garden-400">{p.placed.length} plants</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent notes preview */}
        {notes.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-garden-900">Bed notes</h3>
              <button onClick={() => setShowNotes(true)}
                className="text-xs text-garden-600 hover:text-garden-800 font-medium">
                View all ({notes.length})
              </button>
            </div>
            <div className="space-y-2">
              {notes.slice(0, 2).map(note => (
                <div key={note.id} className="p-3 bg-garden-50 rounded-xl border border-garden-100">
                  <p className="text-[11px] text-garden-500 mb-1">📅 {note.timestamp}</p>
                  <p className="text-sm text-garden-800">{note.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Print button */}
        <button onClick={handlePrint} className="w-full btn-secondary justify-center py-3">
          <Printer size={16} /> Print this bed layout
        </button>
      </div>

      {/* NOTES MODAL */}
      {showNotes && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full max-h-[85vh] flex flex-col">
            <div className="px-5 pt-5 pb-3 border-b border-garden-100 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display text-xl font-semibold text-garden-900">Bed notes</h3>
                  <p className="text-xs text-garden-400 mt-0.5">{bed.name} · {notes.length} notes</p>
                </div>
                <button onClick={() => setShowNotes(false)}>
                  <X size={20} className="text-garden-400" />
                </button>
              </div>

              {/* Add note input */}
              <div className="space-y-2">
                <textarea
                  className="input-field resize-none text-sm"
                  rows={3}
                  placeholder="Add a note... e.g. Added compost today, amended soil with blood meal, this bed gets afternoon shade..."
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && e.metaKey) saveNote()
                  }}
                />
                <button onClick={saveNote} disabled={!newNote.trim()}
                  className="w-full btn-primary justify-center py-2.5 disabled:opacity-40">
                  <Plus size={14} /> Save Note
                </button>
              </div>
            </div>

            {/* Notes log */}
            <div className="overflow-y-auto flex-1 px-5 py-4">
              {notes.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-garden-400 text-sm">No notes yet</p>
                  <p className="text-garden-300 text-xs mt-1">Add your first note above</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notes.map(note => (
                    <div key={note.id}
                      className="p-4 bg-garden-50 rounded-2xl border border-garden-100 group relative">
                      <p className="text-[11px] font-medium text-garden-500 mb-1.5">
                        📅 {note.timestamp}
                      </p>
                      <p className="text-sm text-garden-800 leading-relaxed">{note.text}</p>
                      <button onClick={() => deleteNote(note.id)}
                        className="absolute top-3 right-3 w-6 h-6 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={10} className="text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
