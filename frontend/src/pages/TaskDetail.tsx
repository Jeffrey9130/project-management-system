import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Textarea } from '../components/ui/textarea'
import { Label } from '../components/ui/label'
import { ArrowLeft, User as UserIcon, FileText, MessageSquare, Plus } from 'lucide-react'
import { taskApi, fileApi, commentApi, projectApi, userApi, type Task, type FileItem, type Comment, type Project, type User } from '../lib/api'
import { useToast } from '../hooks/use-toast'

export function TaskDetail() {
  const { id } = useParams<{ id: string }>()
  const [task, setTask] = useState<Task | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [assignee, setAssignee] = useState<User | null>(null)
  const [subtasks, setSubtasks] = useState<Task[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    if (id) {
      loadTaskData(id)
    }
  }, [id])

  const loadTaskData = async (taskId: string) => {
    try {
      const [taskRes, subtasksRes, filesRes, commentsRes] = await Promise.all([
        taskApi.getTask(taskId),
        taskApi.getSubtasks(taskId),
        fileApi.getFiles({ task_id: taskId }),
        commentApi.getComments({ task_id: taskId })
      ])
      
      setTask(taskRes.data)
      setSubtasks(subtasksRes.data)
      setFiles(filesRes.data)
      setComments(commentsRes.data)

      if (taskRes.data.project_id) {
        const projectRes = await projectApi.getProject(taskRes.data.project_id)
        setProject(projectRes.data)
      }

      if (taskRes.data.assigned_to) {
        const userRes = await userApi.getUser(taskRes.data.assigned_to)
        setAssignee(userRes.data)
      }
    } catch (error) {
      console.error('Failed to load task data:', error)
      toast({
        title: "Error",
        description: "Failed to load task details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!task || !newComment.trim()) {
      toast({
        title: "Error",
        description: "Please enter a comment",
        variant: "destructive",
      })
      return
    }

    try {
      await commentApi.createComment({
        content: newComment,
        task_id: task.id
      })
      toast({
        title: "Success",
        description: "Comment added successfully",
      })
      setNewComment('')
      if (id) {
        loadTaskData(id)
      }
    } catch (error) {
      console.error('Failed to add comment:', error)
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading task...</div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Task not found</h3>
        <Link to="/tasks">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tasks
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/tasks">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
            <p className="text-gray-600 mt-2">{task.description || 'No description'}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
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
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{task.progress}%</div>
            <Progress value={task.progress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignee</CardTitle>
            <UserIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {assignee?.name || 'Unassigned'}
            </div>
            {assignee?.email && (
              <p className="text-xs text-muted-foreground">{assignee.email}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subtasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subtasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {subtasks.filter(t => t.status === 'done').length} completed
            </p>
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
              Attachments
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium">Project</div>
              <div className="text-sm text-gray-600">
                {project ? (
                  <Link to={`/projects/${project.id}`} className="hover:text-blue-600">
                    {project.name}
                  </Link>
                ) : (
                  'Unknown Project'
                )}
              </div>
            </div>
            {task.start_date && (
              <div>
                <div className="text-sm font-medium">Start Date</div>
                <div className="text-sm text-gray-600">
                  {new Date(task.start_date).toLocaleDateString()}
                </div>
              </div>
            )}
            {task.end_date && (
              <div>
                <div className="text-sm font-medium">Due Date</div>
                <div className="text-sm text-gray-600">
                  {new Date(task.end_date).toLocaleDateString()}
                </div>
              </div>
            )}
            {task.estimated_hours && (
              <div>
                <div className="text-sm font-medium">Estimated Hours</div>
                <div className="text-sm text-gray-600">{task.estimated_hours}h</div>
              </div>
            )}
            {task.actual_hours && (
              <div>
                <div className="text-sm font-medium">Actual Hours</div>
                <div className="text-sm text-gray-600">{task.actual_hours}h</div>
              </div>
            )}
            <div>
              <div className="text-sm font-medium">Created</div>
              <div className="text-sm text-gray-600">
                {new Date(task.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {subtasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Subtasks ({subtasks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <Link 
                      to={`/tasks/${subtask.id}`}
                      className="font-medium hover:text-blue-600"
                    >
                      {subtask.title}
                    </Link>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">{subtask.priority}</Badge>
                      <Badge variant="outline" className="text-xs">
                        {subtask.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{subtask.progress}%</div>
                    <Progress value={subtask.progress} className="w-16 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Attachments ({files.length})</CardTitle>
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
              <p className="text-gray-600 mb-4">No files attached</p>
              <Link to="/files">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Upload File
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
                  <span className="text-sm text-gray-600">
                    {new Date(file.uploaded_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Comments ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="border-b pb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">User {comment.author_id}</span>
                  <span className="text-sm text-gray-600">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-700">{comment.content}</p>
              </div>
            ))}
            
            {comments.length === 0 && (
              <p className="text-gray-600 text-center py-4">No comments yet</p>
            )}
            
            <div className="border-t pt-4">
              <Label htmlFor="comment">Add Comment</Label>
              <Textarea
                id="comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
                className="mt-2"
              />
              <Button onClick={handleAddComment} className="mt-2">
                Add Comment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
