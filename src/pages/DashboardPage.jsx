import { useAuth } from '../lib/AuthContext'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2, Circle, AlertTriangle, CloudSnow,
  Sun, Cloud, Droplets, CalendarDays, ArrowRight,
  Sprout, Flower2, Leaf, DollarSign, Camera,
  TrendingUp, ChevronRight
} from 'lucide-react'

const mockTasks = [
  { id:1, text:'Start cucumber seeds indoors', done:true,  badge:'Seeds',  badgeClass:'badge-soil' },
  { id:2, text:'Water Tomato Bed',             done:false, badge:'Water',  badgeClass:'badge-blue' },
  { id:3, text:'Bring sensitive plants indoors', done:false, badge:'Frost', badgeClass:'badge-red', urgent:true },
  { id:4, text:'Fertilize pepper seedlings',   done:false, badge:null },
  { id:5, text:'Check soil moisture — Herb Bed', done:false, badge:null },
]

const upcoming = [
  { date:'Mar 27', dot:'bg-garden-500', text:'Transplant tomato seedlings to Bed 1' },
  { date:'Mar 28', dot:'bg-amber-400',  text:'Apply fertilizer — all beds' },
  { date:'Apr 2',  dot:'bg-garden-500', text:'Start pepper seeds (round 2)' },
  { date:'Apr 5',  dot:'bg-blue-400',   text:'Deep water all garden beds' },
  { date:'Apr 10', dot:'bg-amber-400',  text:'Harvest window opens — Lettuce' },
]

const beds = [
  { name:'Tomato Bed',    size:'10×20 ft', plants:['Tomatoes ×6','Basil ×3','Peppers ×2'], color:'bg-red-50 border-red-100' },
  { name:'Herb Garden',   size:'4×8 ft',   plants:['Rosemary ×2','Thyme ×4','Mint ×3'],   color:'bg-garden-50 border-garden-100' },
  { name:'Spring Mix Bed',size:'6×12 ft',  plants:['Lettuce ×8','Spinach ×4','Kale ×3'],  color:'bg-blue-50 border-blue-100' },
]

const spendBreakdown = [
  { label:'Soil',       amount:105, pct:37, color:'bg-garden-600' },
  { label:'Seeds',      amount:82,  pct:29, color:'bg-garden-400' },
  { label:'Tools',      amount:60,  pct:21, color:'bg-soil-400' },
  { label:'Fertilizer', amount:37,  pct:13, color:'bg-garden-200' },
]

const photoColors = [
  'from-green-300 to-green-600','from-yellow-300 to-orange-500',
  'from-red-300 to-red-600','from-emerald-300 to-teal-600'
]
const photoLabels = ['Tomato Bed','Peppers','Herb Garden','Spring Mix']

export default function DashboardPage() {
  const { profile, user } = useAuth()
  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Gardener'
  const [tasks, setTasks] = useState(mockTasks)

  const toggleTask = (id) => setTasks(t => t.map(x => x.id === id ? {...x, done:!x.done} : x))
  const doneTasks = tasks.filter(t => t.done).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="fade-in stagger-1">
        <h1 className="font-display text-3xl font-semibold text-garden-900">
          Welcome back, {firstName}
        </h1>
        <p className="text-garden-500 text-sm mt-1">Here's what to focus on today — {new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</p>
      </div>

      {/* Row 1: Tasks + Weather + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Today's Tasks */}
        <div className="card fade-in stagger-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Today's tasks</h2>
            <span className="text-xs text-garden-500 bg-garden-50 px-2 py-1 rounded-full">
              {doneTasks}/{tasks.length} done
            </span>
          </div>
          <div className="space-y-1">
            {tasks.map(task => (
              <button key={task.id} onClick={() => toggleTask(task.id)}
                className={`w-full flex items-center gap-3 py-2.5 px-2 rounded-xl text-left transition-colors hover:bg-garden-50 ${task.done ? 'opacity-60' : ''}`}>
                {task.done
                  ? <CheckCircle2 size={17} className="text-garden-500 flex-shrink-0" />
                  : <Circle size={17} className={`flex-shrink-0 ${task.urgent ? 'text-red-400' : 'text-garden-300'}`} />
                }
                <span className={`text-sm flex-1 ${task.done ? 'line-through text-garden-400' : task.urgent ? 'text-red-700 font-medium' : 'text-garden-800'}`}>
                  {task.text}
                </span>
                {task.badge && (
                  <span className={`${task.badgeClass} badge text-[10px]`}>{task.badge}</span>
                )}
              </button>
            ))}
          </div>
          <Link to="/calendar" className="mt-3 w-full btn-ghost justify-center text-xs border border-garden-100 rounded-xl py-2">
            View full schedule <ArrowRight size={12} />
          </Link>
        </div>

        {/* Weather */}
        <div className="card fade-in stagger-3 bg-gradient-to-br from-garden-50 to-blue-50 border-garden-200">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-garden-500 font-medium mb-1">Weather · Franklin, TN</p>
              <div className="flex items-baseline gap-1">
                <span className="font-display text-5xl font-medium text-garden-900">41°</span>
                <span className="text-garden-500 text-sm">F</span>
              </div>
              <p className="text-garden-500 text-xs mt-1">Partly cloudy</p>
            </div>
            <div className="w-14 h-14 relative">
              <div className="w-9 h-9 bg-yellow-300 rounded-full absolute top-1 left-1" />
              <div className="w-11 h-6 bg-slate-200 rounded-full absolute bottom-1 right-0" />
            </div>
          </div>

          {/* Frost Alert */}
          <div className="bg-white border border-orange-200 rounded-xl p-3 mb-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={15} className="text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-800">Frost warning tonight</p>
                <p className="text-xs text-orange-600 mt-0.5">Low: 31°F · Bring sensitive plants indoors</p>
              </div>
            </div>
          </div>

          {/* 3-day */}
          <div className="grid grid-cols-3 gap-2">
            {[['Wed','48°','bg-yellow-100 text-yellow-800','Sunny'],
              ['Thu','55°','bg-yellow-100 text-yellow-800','Clear'],
              ['Fri','52°','bg-slate-100 text-slate-600','Cloudy']].map(([day,temp,cls,desc]) => (
              <div key={day} className="bg-white rounded-xl p-2 text-center border border-garden-100">
                <p className="text-[11px] text-garden-400">{day}</p>
                <p className="font-display text-lg font-medium text-garden-900">{temp}</p>
                <p className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cls} mt-1`}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming */}
        <div className="card fade-in stagger-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Upcoming</h2>
            <Link to="/calendar" className="text-xs text-garden-500 hover:text-garden-700 flex items-center gap-1">
              Calendar <ChevronRight size={11} />
            </Link>
          </div>
          <div className="space-y-2">
            {upcoming.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-garden-50 transition-colors">
                <div className="text-[11px] font-medium text-garden-500 w-10 flex-shrink-0">{item.date}</div>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.dot}`} />
                <p className="text-xs text-garden-700 leading-snug">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Garden Categories */}
      <div className="card fade-in stagger-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">My garden</h2>
          <Link to="/plants" className="btn-ghost text-xs py-1.5">Manage plants <ChevronRight size={11} /></Link>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Sprout,  label:'Vegetables', count:14, color:'bg-garden-50 border-garden-200', iconColor:'text-garden-600', to:'/plants' },
            { icon: Flower2, label:'Flowers',    count:6,  color:'bg-pink-50 border-pink-200',     iconColor:'text-pink-500',   to:'/plants' },
            { icon: Leaf,    label:'Herbs',      count:9,  color:'bg-emerald-50 border-emerald-200', iconColor:'text-emerald-600', to:'/plants' },
          ].map(({ icon: Icon, label, count, color, iconColor, to }) => (
            <Link key={label} to={to}
              className={`border rounded-2xl p-4 text-center hover:shadow-card-hover transition-all duration-200 ${color}`}>
              <div className={`w-10 h-10 rounded-xl bg-white border ${color.split(' ')[1]} flex items-center justify-center mx-auto mb-3`}>
                <Icon size={18} className={iconColor} />
              </div>
              <div className="font-display text-3xl font-semibold text-garden-900">{count}</div>
              <div className="text-xs text-garden-500 mt-0.5">{label}</div>
              <div className="mt-3">
                <span className="text-[11px] font-medium text-garden-600 bg-white px-3 py-1 rounded-full border border-garden-200">
                  View all
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Row 3: Beds + Spend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Garden Beds */}
        <div className="card lg:col-span-2 fade-in stagger-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Garden beds</h2>
            <Link to="/beds" className="btn-ghost text-xs py-1.5">All beds <ChevronRight size={11} /></Link>
          </div>
          <div className="space-y-3">
            {beds.map(bed => (
              <div key={bed.name} className={`border rounded-xl p-3 ${bed.color}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-garden-900">{bed.name}</span>
                  <span className="text-xs text-garden-400">{bed.size}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {bed.plants.map(p => (
                    <span key={p} className="text-[11px] bg-white text-garden-700 px-2 py-0.5 rounded-full border border-garden-200 font-medium">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Spend */}
        <div className="card fade-in stagger-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="section-title mb-0">2026 spend</h2>
            <Link to="/expenses" className="btn-ghost text-xs py-1.5">Details <ChevronRight size={11} /></Link>
          </div>
          <div className="mb-4">
            <div className="font-display text-3xl font-semibold text-garden-900">$284.50</div>
            <div className="text-xs text-garden-400 mt-0.5">across 4 categories</div>
          </div>
          <div className="space-y-2.5">
            {spendBreakdown.map(({ label, amount, pct, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs text-garden-600 mb-1">
                  <span>{label}</span><span>${amount}</span>
                </div>
                <div className="h-1.5 bg-garden-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${color}`} style={{width:`${pct}%`}} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Photos + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Photos */}
        <div className="card lg:col-span-2 fade-in stagger-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Recent photos</h2>
            <button className="btn-ghost text-xs py-1.5">View all <ChevronRight size={11} /></button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {photoColors.map((gradient, i) => (
              <div key={i} className={`aspect-square rounded-xl bg-gradient-to-br ${gradient} relative overflow-hidden group cursor-pointer`}>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <div className="absolute bottom-1.5 left-1.5 right-1.5">
                  <span className="text-[10px] bg-black/40 text-white px-1.5 py-0.5 rounded-md font-medium">
                    {photoLabels[i]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-3 fade-in stagger-6">
          {[
            { icon: Leaf,        label:'Total plants',  value:'29',    sub:'+3 this month',  color:'text-garden-600', bg:'bg-garden-50' },
            { icon: CalendarDays,label:'Tasks today',   value:'4',     sub:'1 completed',    color:'text-blue-600',   bg:'bg-blue-50' },
            { icon: TrendingUp,  label:'Next harvest',  value:'Apr 10',sub:'Lettuce ready',  color:'text-amber-600',  bg:'bg-amber-50' },
          ].map(({ icon: Icon, label, value, sub, color, bg }) => (
            <div key={label} className="card flex items-center gap-4">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} className={color} />
              </div>
              <div>
                <div className="font-display text-xl font-semibold text-garden-900">{value}</div>
                <div className="text-xs text-garden-400">{label}</div>
                <div className={`text-[11px] font-medium ${color}`}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
