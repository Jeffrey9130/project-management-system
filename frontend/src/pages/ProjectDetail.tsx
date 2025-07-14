import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { ArrowLeft, Calendar, CheckSquare, FileText, Plus } from 'lucide-react'
import { projectApi, taskApi, fileApi, type Project, type Task, type FileItem } from '../lib/api'
import { useToast } from '../hooks/use-toast'

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (id) {
      loadProjectData(id)
    }
  }, [id])

  const loadProjectData = async (projectId: string) => {
    try {
      const [projectRes, tasksRes, filesRes] = await Promise.all([
        projectApi.getProject(projectId),
        taskApi.getTasks({ project_id: projectId }),
        fileApi.getFiles({ project_id: projectId })
      ])
      
      setProject(projectRes.data)
      setTasks(tasksRes.data)
      setFiles(filesRes.data)
    } catch (error) {
      console.error('Failed to load project data:', error)
      toast({
        title: "Error",
        description: "Failed to load project details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading project...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Project not found</h3>
        <Link to="/projects">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
        </Link>
      </div>
    )
  }

  const completedTasks = tasks.filter(t => t.status === 'done').length
  const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/projects">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600 mt-2">{project.description || 'No description'}</p>
          </div>
        </div>
        
        <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
          {project.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {completedTasks} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress.toFixed(0)}%</div>
            <Progress value={progress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Files</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{files.length}</div>
            <p className="text-xs text-muted-foreground">
              Project files
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {project.start_date && (
              <div>
                <div className="text-sm font-medium">Start Date</div>
                <div className="text-sm text-gray-600">
                  {new Date(project.start_date).toLocaleDateString()}
                </div>
              </div>
            )}
            {project.end_date && (
              <div>
                <div className="text-sm font-medium">End Date</div>
                <div className="text-sm text-gray-600">
                  {new Date(project.end_date).toLocaleDateString()}
                </div>
              </div>
            )}
            <div>
              <div className="text-sm font-medium">Created</div>
              <div className="text-sm text-gray-600">
                {new Date(project.created_at).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Team ID</div>
              <div className="text-sm text-gray-600">{project.team_id}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tasks ({tasks.length})</CardTitle>
            <Link to="/tasks">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No tasks yet</p>
              <Link to="/tasks">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Task
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <Link 
                      to={`/tasks/${task.id}`}
                      className="font-medium hover:text-blue-600"
                    >
                      {task.title}
                    </Link>
                    <div className="text-sm text-gray-600 mt-1">
                      {task.description && task.description.substring(0, 100)}
                      {task.description && task.description.length > 100 && '...'}
                    </div>
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge variant="outline">{task.priority}</Badge>
                      <Badge 
                        variant={
                          task.status === 'todo' ? 'secondary' :
                          task.status === 'in_progress' ? 'default' :
                          task.status === 'review' ? 'outline' : 'default'
                        }
                      >
                        {task.status.replace('_', ' ')}
                      </Badge>
                      {task.end_date && (
                        <span className="text-sm text-gray-600">
                          Due {new Date(task.end_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{task.progress}%</div>
                    <Progress value={task.progress} className="w-20 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Project Files ({files.length})</CardTitle>
            <Link to="/files">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Upload File
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No files yet</p>
              <Link to="/files">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Upload First File
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    <span className="font-medium">{file.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={file.is_public ? 'default' : 'secondary'}>
                      {file.is_public ? 'Public' : 'Private'}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {new Date(file.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
