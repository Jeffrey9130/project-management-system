import axios from 'axios'

const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://app-qtmxfjcr.fly.dev'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Authorization': 'Bearer demo-token',
    'Content-Type': 'application/json',
  },
})

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'member' | 'viewer'
  team_ids: string[]
  created_at: string
}

export interface Team {
  id: string
  name: string
  description?: string
  admin_id: string
  member_ids: string[]
  created_at: string
}

export interface Project {
  id: string
  name: string
  description?: string
  team_id: string
  start_date?: string
  end_date?: string
  status: string
  created_at: string
  created_by: string
}

export interface Task {
  id: string
  title: string
  description?: string
  project_id: string
  parent_task_id?: string
  assigned_to?: string
  status: 'todo' | 'in_progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  start_date?: string
  end_date?: string
  estimated_hours?: number
  actual_hours?: number
  progress: number
  file_ids: string[]
  created_at: string
  created_by: string
  updated_at: string
}

export interface FileItem {
  id: string
  name: string
  size: number
  content_type: string
  project_id?: string
  task_id?: string
  uploaded_by: string
  uploaded_at: string
  is_public: boolean
}

export interface Comment {
  id: string
  content: string
  file_id?: string
  task_id?: string
  author_id: string
  created_at: string
}

export interface Notification {
  id: string
  title: string
  message: string
  user_id: string
  type: string
  read: boolean
  created_at: string
}

export interface APIIntegration {
  id: string
  name: string
  endpoint: string
  method: string
  headers: Record<string, string>
  project_id: string
  created_by: string
  created_at: string
}

export const userApi = {
  getUsers: () => api.get<User[]>('/api/users'),
  getUser: (id: string) => api.get<User>(`/api/users/${id}`),
  createUser: (data: { name: string; email: string; role?: string }) => 
    api.post<User>('/api/users', data),
}

export const teamApi = {
  getTeams: () => api.get<Team[]>('/api/teams'),
  getTeam: (id: string) => api.get<Team>(`/api/teams/${id}`),
  createTeam: (data: { name: string; description?: string }) => 
    api.post<Team>('/api/teams', data),
  addMember: (teamId: string, userId: string) => 
    api.post(`/api/teams/${teamId}/members/${userId}`),
  removeMember: (teamId: string, userId: string) => 
    api.delete(`/api/teams/${teamId}/members/${userId}`),
}

export const projectApi = {
  getProjects: (teamId?: string) => 
    api.get<Project[]>('/api/projects', { params: { team_id: teamId } }),
  getProject: (id: string) => api.get<Project>(`/api/projects/${id}`),
  createProject: (data: { name: string; description?: string; team_id: string; start_date?: string; end_date?: string }) => 
    api.post<Project>('/api/projects', data),
  updateProject: (id: string, data: any) => 
    api.put<Project>(`/api/projects/${id}`, data),
  deleteProject: (id: string) => api.delete(`/api/projects/${id}`),
}

export const taskApi = {
  getTasks: (params?: { project_id?: string; assigned_to?: string; status?: string }) => 
    api.get<Task[]>('/api/tasks', { params }),
  getTask: (id: string) => api.get<Task>(`/api/tasks/${id}`),
  createTask: (data: any) => api.post<Task>('/api/tasks', data),
  updateTask: (id: string, data: any) => api.put<Task>(`/api/tasks/${id}`, data),
  deleteTask: (id: string) => api.delete(`/api/tasks/${id}`),
  getSubtasks: (id: string) => api.get<Task[]>(`/api/tasks/${id}/subtasks`),
}

export const fileApi = {
  getFiles: (params?: { project_id?: string; task_id?: string }) => 
    api.get<FileItem[]>('/api/files', { params }),
  uploadFile: (file: File, projectId?: string, taskId?: string, isPublic?: boolean) => {
    const formData = new FormData()
    formData.append('file', file)
    if (projectId) formData.append('project_id', projectId)
    if (taskId) formData.append('task_id', taskId)
    if (isPublic !== undefined) formData.append('is_public', String(isPublic))
    
    return api.post<FileItem>('/api/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  deleteFile: (id: string) => api.delete(`/api/files/${id}`),
}

export const commentApi = {
  getComments: (params?: { file_id?: string; task_id?: string }) => 
    api.get<Comment[]>('/api/comments', { params }),
  createComment: (data: { content: string; file_id?: string; task_id?: string }) => 
    api.post<Comment>('/api/comments', data),
  deleteComment: (id: string) => api.delete(`/api/comments/${id}`),
}

export const notificationApi = {
  getNotifications: () => api.get<Notification[]>('/api/notifications'),
  markAsRead: (id: string) => api.put(`/api/notifications/${id}/read`),
}

export const integrationApi = {
  getIntegrations: (projectId?: string) => 
    api.get<APIIntegration[]>('/api/integrations', { params: { project_id: projectId } }),
  createIntegration: (data: any) => api.post<APIIntegration>('/api/integrations', data),
  executeIntegration: (id: string, payload?: any) => 
    api.post(`/api/integrations/${id}/execute`, payload),
  deleteIntegration: (id: string) => api.delete(`/api/integrations/${id}`),
}

export const ganttApi = {
  getGanttData: (params?: { project_id?: string; team_id?: string; assigned_to?: string }) => 
    api.get('/api/gantt', { params }),
}

export default api
