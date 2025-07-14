import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Label } from '../components/ui/label'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import { Plus, Zap, Play, Trash2, ExternalLink } from 'lucide-react'
import { integrationApi, projectApi, type APIIntegration, type Project } from '../lib/api'
import { useToast } from '../hooks/use-toast'

export function Integrations() {
  const [integrations, setIntegrations] = useState<APIIntegration[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [executeDialogOpen, setExecuteDialogOpen] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<APIIntegration | null>(null)
  const [filterProject, setFilterProject] = useState<string>('')
  const [formData, setFormData] = useState({
    name: '',
    endpoint: '',
    method: 'GET',
    headers: '{}',
    project_id: ''
  })
  const [executePayload, setExecutePayload] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [integrationsRes, projectsRes] = await Promise.all([
        integrationApi.getIntegrations(),
        projectApi.getProjects()
      ])
      
      setIntegrations(integrationsRes.data)
      setProjects(projectsRes.data)
    } catch (error) {
      console.error('Failed to load data:', error)
      toast({
        title: "Error",
        description: "Failed to load integrations",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateIntegration = async () => {
    if (!formData.name || !formData.endpoint) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      let headers = {}
      try {
        headers = JSON.parse(formData.headers)
      } catch (e) {
        toast({
          title: "Error",
          description: "Invalid JSON format for headers",
          variant: "destructive",
        })
        return
      }

      await integrationApi.createIntegration({
        ...formData,
        headers
      })
      
      toast({
        title: "Success",
        description: "Integration created successfully",
      })
      setCreateDialogOpen(false)
      setFormData({ name: '', endpoint: '', method: 'GET', headers: '{}', project_id: '' })
      loadData()
    } catch (error) {
      console.error('Failed to create integration:', error)
      toast({
        title: "Error",
        description: "Failed to create integration",
        variant: "destructive",
      })
    }
  }

  const handleExecuteIntegration = async () => {
    if (!selectedIntegration) return

    try {
      let payload = undefined
      if (executePayload.trim()) {
        try {
          payload = JSON.parse(executePayload)
        } catch (e) {
          toast({
            title: "Error",
            description: "Invalid JSON format for payload",
            variant: "destructive",
          })
          return
        }
      }

      const response = await integrationApi.executeIntegration(selectedIntegration.id, payload)
      
      toast({
        title: "Success",
        description: "Integration executed successfully",
      })
      setExecuteDialogOpen(false)
      setExecutePayload('')
      
      console.log('Integration response:', response.data)
    } catch (error) {
      console.error('Failed to execute integration:', error)
      toast({
        title: "Error",
        description: "Failed to execute integration",
        variant: "destructive",
      })
    }
  }

  const handleDeleteIntegration = async (integrationId: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) {
      return
    }

    try {
      await integrationApi.deleteIntegration(integrationId)
      toast({
        title: "Success",
        description: "Integration deleted successfully",
      })
      loadData()
    } catch (error) {
      console.error('Failed to delete integration:', error)
      toast({
        title: "Error",
        description: "Failed to delete integration",
        variant: "destructive",
      })
    }
  }

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    return project?.name || 'Unknown Project'
  }

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-green-100 text-green-800'
      case 'POST': return 'bg-blue-100 text-blue-800'
      case 'PUT': return 'bg-yellow-100 text-yellow-800'
      case 'DELETE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredIntegrations = integrations.filter(integration => {
    if (filterProject && integration.project_id !== filterProject) return false
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading integrations...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API Integrations</h1>
          <p className="text-gray-600 mt-2">Connect external APIs and automate workflows</p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Integration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create API Integration</DialogTitle>
              <DialogDescription>
                Connect an external API to automate tasks and workflows.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Integration Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Slack Notifications"
                />
              </div>
              
              <div>
                <Label htmlFor="endpoint">API Endpoint *</Label>
                <Input
                  id="endpoint"
                  value={formData.endpoint}
                  onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                  placeholder="https://api.example.com/webhook"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="method">HTTP Method</Label>
                  <Select value={formData.method} onValueChange={(value) => setFormData({ ...formData, method: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="project">Project</Label>
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
              </div>
              
              <div>
                <Label htmlFor="headers">Headers (JSON)</Label>
                <Textarea
                  id="headers"
                  value={formData.headers}
                  onChange={(e) => setFormData({ ...formData, headers: e.target.value })}
                  placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                  rows={4}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateIntegration}>
                Create Integration
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
                  <SelectItem value="">All projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => setFilterProject('')}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integrations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Integrations ({filteredIntegrations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredIntegrations.length === 0 ? (
            <div className="text-center py-8">
              <Zap className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No integrations yet</h3>
              <p className="text-gray-600 mb-4">Connect external APIs to automate your workflows</p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Integration
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIntegrations.map((integration) => (
                  <TableRow key={integration.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Zap className="w-4 h-4 mr-2" />
                        <span className="font-medium">{integration.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        <span className="text-sm font-mono">{integration.endpoint}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getMethodColor(integration.method)}>
                        {integration.method}
                      </Badge>
                    </TableCell>
                    <TableCell>{getProjectName(integration.project_id)}</TableCell>
                    <TableCell>
                      {new Date(integration.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedIntegration(integration)
                            setExecuteDialogOpen(true)
                          }}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteIntegration(integration.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Execute Integration Dialog */}
      <Dialog open={executeDialogOpen} onOpenChange={setExecuteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Execute Integration</DialogTitle>
            <DialogDescription>
              Execute {selectedIntegration?.name} with optional payload
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Endpoint</Label>
              <div className="p-2 bg-gray-100 rounded text-sm font-mono">
                {selectedIntegration?.method} {selectedIntegration?.endpoint}
              </div>
            </div>
            
            <div>
              <Label htmlFor="payload">Payload (JSON, optional)</Label>
              <Textarea
                id="payload"
                value={executePayload}
                onChange={(e) => setExecutePayload(e.target.value)}
                placeholder='{"message": "Task completed", "project": "Project Name"}'
                rows={6}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setExecuteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExecuteIntegration}>
              <Play className="w-4 h-4 mr-2" />
              Execute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
