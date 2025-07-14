import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Calendar, User as UserIcon, Trash2 } from 'lucide-react'
import { taskApi, projectApi, userApi, type Task, type Project, type User } from '@/lib/api'
import { Link } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
}


export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [filterProject, setFilterProject] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    parent_task_id: '',
    assigned_to: '',
    priority: 'medium',
    start_date: '',
    end_date: '',
    estimated_hours: ''
  })
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [tasksRes, projectsRes, usersRes] = await Promise.all([
        taskApi.getTasks(),
        projectApi.getProjects(),
        userApi.getUsers()
      ])
      
      setTasks(tasksRes.data)
      setProjects(projectsRes.data)
      setUsers(usersRes.data)
    } catch (error) {
      console.error('Failed to load data:', error)
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async () => {
    if (!formData.title || !formData.project_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const taskData = {
        ...formData,
        parent_task_id: formData.parent_task_id === 'none' ? '' : formData.parent_task_id,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        assigned_to: formData.assigned_to || null,
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null
      }
      
      console.log('Creating task with data:', taskData)
      await taskApi.createTask(taskData)
      toast({
        title: "Success",
        description: "Task created successfully",
      })
      setCreateDialogOpen(false)
      setFormData({
        title: '',
        description: '',
        project_id: '',
        parent_task_id: '',
        assigned_to: '',
        priority: 'medium',
        start_date: '',
        end_date: '',
        estimated_hours: ''
      })
      loadData()
    } catch (error) {
      console.error('Failed to create task:', error)
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return
    }

    try {
      await taskApi.deleteTask(taskId)
      toast({
        title: "Success",
        description: "Task deleted successfully",
      })
      loadData()
    } catch (error) {
      console.error('Failed to delete task:', error)
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      })
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await taskApi.updateTask(taskId, { status: newStatus })
      toast({
        title: "Success",
        description: "Task status updated",
      })
      loadData()
    } catch (error) {
      console.error('Failed to update task:', error)
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      })
    }
  }

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    return project?.name || 'Unknown Project'
  }

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId)
    return user?.name || 'Unassigned'
  }

  const filteredTasks = tasks.filter(task => {
    if (filterProject && filterProject !== 'all' && task.project_id !== filterProject) return false
    if (filterStatus && filterStatus !== 'all' && task.status !== filterStatus) return false
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading tasks...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-2">Manage and track your tasks</p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Add a new task to track work and assign to team members.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Task Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter task title"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Task description"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="project">Project *</Label>
                  <Select value={formData.project_id} onValueChange={(value) => setFormData({ ...formData, project_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="parent_task">Parent Task (Optional)</Label>
                  <Select value={formData.parent_task_id} onValueChange={(value) => setFormData({ ...formData, parent_task_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent task" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No parent task</SelectItem>
                      {tasks
                        .filter(task => task.project_id === formData.project_id && !task.parent_task_id)
                        .map((task) => (
                          <SelectItem key={task.id} value={task.id}>
                            {task.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="assigned_to">Assign To</Label>
                <Select value={formData.assigned_to} onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="end_date">Due Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="estimated_hours">Estimated Hours</Label>
                <Input
                  id="estimated_hours"
                  type="number"
                  step="0.5"
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTask}>
                Create Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setFilterProject('all')
                  setFilterStatus('all')
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks ({filteredTasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No tasks found</p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Task
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div>
                        <div className="flex items-center">
                          {task.parent_task_id && (
                            <div className="w-4 h-4 mr-2 text-gray-400">└</div>
                          )}
                          <Link 
                            to={`/tasks/${task.id}`}
                            className="font-medium hover:text-blue-600"
                          >
                            {task.title}
                          </Link>
                        </div>
                        {task.description && (
                          <div className="text-sm text-gray-600 mt-1">
                            {task.description.substring(0, 100)}
                            {task.description.length > 100 && '...'}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getProjectName(task.project_id)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <UserIcon className="w-4 h-4 mr-1" />
                        {getUserName(task.assigned_to || '')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={task.status} 
                        onValueChange={(value) => handleStatusChange(task.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {task.end_date ? (
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(task.end_date).toLocaleDateString()}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
