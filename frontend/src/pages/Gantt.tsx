import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Label } from '../components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { BarChart3, Calendar, Filter } from 'lucide-react'
import { ganttApi, projectApi, teamApi, userApi, type Project, type Team, type User, type Task } from '../lib/api'
import { useToast } from '../hooks/use-toast'

interface GanttTask extends Task {
  startDate: Date
  endDate: Date
  duration: number
}

export function Gantt() {
  const [tasks, setTasks] = useState<GanttTask[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filterProject, setFilterProject] = useState<string>('')
  const [filterTeam, setFilterTeam] = useState<string>('')
  const [filterAssignee, setFilterAssignee] = useState<string>('')
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadGanttData()
  }, [filterProject, filterTeam, filterAssignee])

  const loadData = async () => {
    try {
      const [projectsRes, teamsRes, usersRes] = await Promise.all([
        projectApi.getProjects(),
        teamApi.getTeams(),
        userApi.getUsers()
      ])
      
      setProjects(projectsRes.data)
      setTeams(teamsRes.data)
      setUsers(usersRes.data)
    } catch (error) {
      console.error('Failed to load data:', error)
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadGanttData = async () => {
    try {
      const params: any = {}
      if (filterProject && filterProject !== 'all') params.project_id = filterProject
      if (filterTeam && filterTeam !== 'all') params.team_id = filterTeam
      if (filterAssignee && filterAssignee !== 'all') params.assigned_to = filterAssignee

      const response = await ganttApi.getGanttData(params)
      
      const ganttTasks: GanttTask[] = response.data.tasks.map((task: Task) => {
        const startDate = task.start_date ? new Date(task.start_date) : new Date()
        const endDate = task.end_date ? new Date(task.end_date) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        
        return {
          ...task,
          startDate,
          endDate,
          duration: Math.max(1, duration)
        }
      })
      
      setTasks(ganttTasks)
    } catch (error) {
      console.error('Failed to load Gantt data:', error)
      toast({
        title: "Error",
        description: "Failed to load Gantt data",
        variant: "destructive",
      })
    }
  }

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    return project?.name || 'Unknown Project'
  }

  const getUserName = (userId?: string) => {
    if (!userId) return 'Unassigned'
    const user = users.find(u => u.id === userId)
    return user?.name || 'Unknown User'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-400'
      case 'in_progress': return 'bg-blue-500'
      case 'review': return 'bg-yellow-500'
      case 'done': return 'bg-green-500'
      default: return 'bg-gray-400'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'border-l-gray-400'
      case 'medium': return 'border-l-blue-400'
      case 'high': return 'border-l-orange-400'
      case 'urgent': return 'border-l-red-400'
      default: return 'border-l-gray-400'
    }
  }

  const allDates = tasks.flatMap(task => [task.startDate, task.endDate])
  const minDate = allDates.length > 0 ? new Date(Math.min(...allDates.map(d => d.getTime()))) : new Date()
  const maxDate = allDates.length > 0 ? new Date(Math.max(...allDates.map(d => d.getTime()))) : new Date()
  
  minDate.setDate(minDate.getDate() - 7)
  maxDate.setDate(maxDate.getDate() + 7)
  
  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
  const dayWidth = 40 // pixels per day

  const getTaskPosition = (task: GanttTask) => {
    const startOffset = Math.ceil((task.startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
    const left = startOffset * dayWidth
    const width = task.duration * dayWidth
    return { left, width }
  }

  const generateTimelineHeaders = () => {
    const headers = []
    const current = new Date(minDate)
    
    while (current <= maxDate) {
      headers.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    return headers
  }

  const timelineHeaders = generateTimelineHeaders()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading Gantt chart...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gantt Chart</h1>
          <p className="text-gray-600 mt-2">Visualize project timelines and task dependencies</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5" />
          <span className="text-sm font-medium">Timeline View</span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Project</Label>
              <Select value={filterProject} onValueChange={setFilterProject}>
                <SelectTrigger>
                  <SelectValue placeholder="All projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Team</Label>
              <Select value={filterTeam} onValueChange={setFilterTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="All teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All teams</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Assignee</Label>
              <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder="All assignees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All assignees</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilterProject('all')
                  setFilterTeam('all')
                  setFilterAssignee('all')
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gantt Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline ({tasks.length} tasks)</CardTitle>
          <CardDescription>
            Drag and drop to adjust task timelines (demo view only)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks to display</h3>
              <p className="text-gray-600">Create some tasks with dates to see them in the Gantt chart</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-max">
                {/* Timeline Header */}
                <div className="flex border-b bg-gray-50">
                  <div className="w-64 p-3 font-medium border-r">Task</div>
                  <div className="flex">
                    {timelineHeaders.map((date, index) => (
                      <div 
                        key={index} 
                        className="border-r text-xs p-2 text-center"
                        style={{ width: dayWidth }}
                      >
                        <div className="font-medium">{date.getDate()}</div>
                        <div className="text-gray-600">
                          {date.toLocaleDateString('en', { month: 'short' })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Task Rows */}
                <div className="relative">
                  {tasks.map((task) => {
                    const position = getTaskPosition(task)
                    
                    return (
                      <div key={task.id} className="flex border-b hover:bg-gray-50">
                        {/* Task Info */}
                        <div className="w-64 p-3 border-r">
                          <div className="font-medium text-sm mb-1">{task.title}</div>
                          <div className="text-xs text-gray-600 mb-1">
                            {getProjectName(task.project_id)}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getPriorityColor(task.priority)}`}
                            >
                              {task.priority}
                            </Badge>
                            <span className="text-xs text-gray-600">
                              {getUserName(task.assigned_to)}
                            </span>
                          </div>
                        </div>

                        {/* Timeline */}
                        <div className="relative flex-1" style={{ height: '80px' }}>
                          {/* Grid lines */}
                          {timelineHeaders.map((_, gridIndex) => (
                            <div
                              key={gridIndex}
                              className="absolute top-0 bottom-0 border-r border-gray-100"
                              style={{ left: gridIndex * dayWidth }}
                            />
                          ))}

                          {/* Task Bar */}
                          <div
                            className={`absolute top-6 h-6 rounded ${getStatusColor(task.status)} ${getPriorityColor(task.priority)} border-l-4 flex items-center px-2`}
                            style={{
                              left: position.left,
                              width: Math.max(position.width, 60)
                            }}
                          >
                            <span className="text-white text-xs font-medium truncate">
                              {task.progress}%
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div
                            className="absolute top-6 h-6 bg-white bg-opacity-30 rounded-r"
                            style={{
                              left: position.left + (position.width * task.progress / 100),
                              width: position.width * (1 - task.progress / 100)
                            }}
                          />

                          {/* Task Dates */}
                          <div className="absolute bottom-2 left-0 text-xs text-gray-600">
                            <div style={{ left: position.left }}>
                              {task.startDate.toLocaleDateString()}
                            </div>
                          </div>
                          <div className="absolute bottom-2 right-0 text-xs text-gray-600">
                            <div style={{ right: totalDays * dayWidth - position.left - position.width }}>
                              {task.endDate.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <h4 className="font-medium mb-2">Status</h4>
              <div className="space-y-1">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-400 rounded mr-2"></div>
                  <span className="text-sm">To Do</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                  <span className="text-sm">In Progress</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                  <span className="text-sm">Review</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                  <span className="text-sm">Done</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Priority</h4>
              <div className="space-y-1">
                <div className="flex items-center">
                  <div className="w-4 h-4 border-l-4 border-l-gray-400 mr-2"></div>
                  <span className="text-sm">Low</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 border-l-4 border-l-blue-400 mr-2"></div>
                  <span className="text-sm">Medium</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 border-l-4 border-l-orange-400 mr-2"></div>
                  <span className="text-sm">High</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 border-l-4 border-l-red-400 mr-2"></div>
                  <span className="text-sm">Urgent</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
