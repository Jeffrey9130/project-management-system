import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3, 
  CheckSquare, 
  Clock, 
  FolderOpen, 
  Users 
} from 'lucide-react'
import { projectApi, taskApi, teamApi, type Project, type Task, type Team } from '@/lib/api'
import { Link } from 'react-router-dom'

export function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [projectsRes, tasksRes, teamsRes] = await Promise.all([
        projectApi.getProjects(),
        taskApi.getTasks(),
        teamApi.getTeams()
      ])
      
      setProjects(projectsRes.data)
      setTasks(tasksRes.data)
      setTeams(teamsRes.data)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTaskStats = () => {
    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'done').length
    const inProgress = tasks.filter(t => t.status === 'in_progress').length
    const overdue = tasks.filter(t => {
      if (!t.end_date) return false
      return new Date(t.end_date) < new Date() && t.status !== 'done'
    }).length

    return { total, completed, inProgress, overdue }
  }

  const taskStats = getTaskStats()
  const completionRate = taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your projects.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">
              Active projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {taskStats.completed} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              Tasks in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teams.length}</div>
            <p className="text-xs text-muted-foreground">
              Active teams
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
          <CardDescription>
            Task completion across all projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span>Completion Rate</span>
                <span>{completionRate.toFixed(1)}%</span>
              </div>
              <Progress value={completionRate} className="mt-2" />
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
                <div className="text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
                <div className="text-gray-600">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{taskStats.overdue}</div>
                <div className="text-gray-600">Overdue</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>
              Your latest projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects.slice(0, 5).map((project) => {
                const projectTasks = tasks.filter(t => t.project_id === project.id)
                const completedTasks = projectTasks.filter(t => t.status === 'done').length
                const progress = projectTasks.length > 0 ? (completedTasks / projectTasks.length) * 100 : 0

                return (
                  <div key={project.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <Link 
                        to={`/projects/${project.id}`}
                        className="font-medium hover:text-blue-600"
                      >
                        {project.name}
                      </Link>
                      <div className="text-sm text-gray-600">
                        {projectTasks.length} tasks • {progress.toFixed(0)}% complete
                      </div>
                    </div>
                    <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                      {project.status}
                    </Badge>
                  </div>
                )
              })}
              
              {projects.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No projects yet. <Link to="/projects" className="text-blue-600 hover:underline">Create your first project</Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
            <CardDescription>
              Tasks that need your attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks
                .filter(t => t.status !== 'done')
                .slice(0, 5)
                .map((task) => (
                  <div key={task.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <Link 
                        to={`/tasks/${task.id}`}
                        className="font-medium hover:text-blue-600"
                      >
                        {task.title}
                      </Link>
                      <div className="text-sm text-gray-600">
                        {task.priority} priority
                        {task.end_date && ` • Due ${new Date(task.end_date).toLocaleDateString()}`}
                      </div>
                    </div>
                    <Badge 
                      variant={
                        task.status === 'todo' ? 'secondary' :
                        task.status === 'in_progress' ? 'default' :
                        task.status === 'review' ? 'outline' : 'default'
                      }
                    >
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              
              {tasks.filter(t => t.status !== 'done').length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  All tasks completed! 🎉
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common actions to get you started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/projects">
              <Button variant="outline" className="w-full h-20 flex flex-col">
                <FolderOpen className="h-6 w-6 mb-2" />
                New Project
              </Button>
            </Link>
            <Link to="/tasks">
              <Button variant="outline" className="w-full h-20 flex flex-col">
                <CheckSquare className="h-6 w-6 mb-2" />
                New Task
              </Button>
            </Link>
            <Link to="/teams">
              <Button variant="outline" className="w-full h-20 flex flex-col">
                <Users className="h-6 w-6 mb-2" />
                Manage Teams
              </Button>
            </Link>
            <Link to="/gantt">
              <Button variant="outline" className="w-full h-20 flex flex-col">
                <BarChart3 className="h-6 w-6 mb-2" />
                View Gantt
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
