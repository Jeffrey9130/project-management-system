import { cn } from '../lib/utils'
import { Button } from '../components/ui/button'
import { ScrollArea } from '../components/ui/scroll-area'
import { 
  LayoutDashboard, 
  FolderOpen, 
  CheckSquare, 
  Users, 
  FileText, 
  BarChart3, 
  Zap
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

interface SidebarProps {
  open: boolean
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Teams', href: '/teams', icon: Users },
  { name: 'Files', href: '/files', icon: FileText },
  { name: 'Gantt Chart', href: '/gantt', icon: BarChart3 },
  { name: 'Integrations', href: '/integrations', icon: Zap },
]

export function Sidebar({ open }: SidebarProps) {
  const location = useLocation()

  return (
    <div className={cn(
      'bg-white border-r border-gray-200 transition-all duration-300',
      open ? 'w-64' : 'w-16'
    )}>
      <div className="flex h-16 items-center px-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <CheckSquare className="w-5 h-5 text-white" />
          </div>
          {open && (
            <span className="text-xl font-bold text-gray-900">ProjectHub</span>
          )}
        </div>
      </div>
      
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link key={item.name} to={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    !open && 'px-2'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {open && <span className="ml-3">{item.name}</span>}
                </Button>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>
    </div>
  )
}
