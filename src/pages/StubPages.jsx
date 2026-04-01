import { CalendarDays, Leaf, Grid3x3, Receipt, BarChart3, ShoppingBag } from 'lucide-react'

const ComingSoon = ({ title, icon: Icon, description }) => (
  <div className="space-y-4">
    <div>
      <h1 className="font-display text-3xl font-semibold text-garden-900">{title}</h1>
      <p className="text-garden-500 text-sm mt-1">{description}</p>
    </div>
    <div className="card flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-garden-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon size={28} className="text-garden-500" />
      </div>
      <h2 className="font-display text-xl font-semibold text-garden-800 mb-2">{title} coming soon</h2>
      <p className="text-garden-400 text-sm max-w-xs">This section is being built. Check back soon — it'll be great.</p>
    </div>
  </div>
)

export function CalendarPage()  { return <ComingSoon title="Calendar"     icon={CalendarDays} description="View all your tasks and events in one place" /> }
export function PlantsPage()    { return <ComingSoon title="My Plants"    icon={Leaf}         description="Track every plant in your garden" /> }
export function BedsPage()      { return <ComingSoon title="Garden Beds"  icon={Grid3x3}      description="Manage your raised beds and plantings" /> }
export function ExpensesPage()  { return <ComingSoon title="Expenses"     icon={Receipt}      description="Track your garden spending by year and category" /> }
export function ReportsPage()   { return <ComingSoon title="Reports"      icon={BarChart3}    description="Weekly, monthly, and yearly garden reports" /> }
export function ShopPage()      { return <ComingSoon title="Shop"         icon={ShoppingBag}  description="Product recommendations based on your plants" /> }
