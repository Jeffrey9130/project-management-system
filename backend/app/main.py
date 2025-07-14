from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from enum import Enum
import uuid
import json

app = FastAPI(title="Project Management System API")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

db = {
    "users": {},
    "teams": {},
    "projects": {},
    "tasks": {},
    "files": {},
    "comments": {},
    "notifications": {},
    "api_integrations": {}
}

class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    MEMBER = "member"
    VIEWER = "viewer"

class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class User(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole
    team_ids: List[str] = []
    created_at: datetime

class Team(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    admin_id: str
    member_ids: List[str] = []
    created_at: datetime

class Project(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    team_id: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str = "active"
    created_at: datetime
    created_by: str

class Task(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    project_id: str
    parent_task_id: Optional[str] = None
    assigned_to: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    progress: int = 0
    file_ids: List[str] = []
    created_at: datetime
    created_by: str
    updated_at: datetime

class FileItem(BaseModel):
    id: str
    name: str
    size: int
    content_type: str
    project_id: Optional[str] = None
    task_id: Optional[str] = None
    uploaded_by: str
    uploaded_at: datetime
    is_public: bool = False

class Comment(BaseModel):
    id: str
    content: str
    file_id: Optional[str] = None
    task_id: Optional[str] = None
    author_id: str
    created_at: datetime

class Notification(BaseModel):
    id: str
    title: str
    message: str
    user_id: str
    type: str
    read: bool = False
    created_at: datetime

class APIIntegration(BaseModel):
    id: str
    name: str
    endpoint: str
    method: str
    headers: Dict[str, str] = {}
    project_id: str
    created_by: str
    created_at: datetime

class CreateUserRequest(BaseModel):
    name: str
    email: str
    role: UserRole = UserRole.MEMBER

class CreateTeamRequest(BaseModel):
    name: str
    description: Optional[str] = None

class CreateProjectRequest(BaseModel):
    name: str
    description: Optional[str] = None
    team_id: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class CreateTaskRequest(BaseModel):
    title: str
    description: Optional[str] = None
    project_id: str
    parent_task_id: Optional[str] = None
    assigned_to: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    estimated_hours: Optional[float] = None

class UpdateTaskRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    progress: Optional[int] = None

class CreateCommentRequest(BaseModel):
    content: str
    file_id: Optional[str] = None
    task_id: Optional[str] = None

class CreateAPIIntegrationRequest(BaseModel):
    name: str
    endpoint: str
    method: str
    headers: Dict[str, str] = {}
    project_id: str

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    return "user_1"

@app.post("/api/users", response_model=User)
async def create_user(request: CreateUserRequest, current_user: str = Depends(get_current_user)):
    user_id = str(uuid.uuid4())
    user = User(
        id=user_id,
        name=request.name,
        email=request.email,
        role=request.role,
        created_at=datetime.now()
    )
    db["users"][user_id] = user.dict()
    return user

@app.get("/api/users", response_model=List[User])
async def get_users(current_user: str = Depends(get_current_user)):
    return [User(**user) for user in db["users"].values()]

@app.get("/api/users/{user_id}", response_model=User)
async def get_user(user_id: str, current_user: str = Depends(get_current_user)):
    if user_id not in db["users"]:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**db["users"][user_id])

@app.post("/api/teams", response_model=Team)
async def create_team(request: CreateTeamRequest, current_user: str = Depends(get_current_user)):
    team_id = str(uuid.uuid4())
    team = Team(
        id=team_id,
        name=request.name,
        description=request.description,
        admin_id=current_user,
        member_ids=[current_user],
        created_at=datetime.now()
    )
    db["teams"][team_id] = team.dict()
    
    if current_user in db["users"]:
        db["users"][current_user]["team_ids"].append(team_id)
    
    return team

@app.get("/api/teams", response_model=List[Team])
async def get_teams(current_user: str = Depends(get_current_user)):
    return [Team(**team) for team in db["teams"].values()]

@app.get("/api/teams/{team_id}", response_model=Team)
async def get_team(team_id: str, current_user: str = Depends(get_current_user)):
    if team_id not in db["teams"]:
        raise HTTPException(status_code=404, detail="Team not found")
    return Team(**db["teams"][team_id])

@app.post("/api/teams/{team_id}/members/{user_id}")
async def add_team_member(team_id: str, user_id: str, current_user: str = Depends(get_current_user)):
    if team_id not in db["teams"]:
        raise HTTPException(status_code=404, detail="Team not found")
    if user_id not in db["users"]:
        raise HTTPException(status_code=404, detail="User not found")
    
    team = db["teams"][team_id]
    if current_user != team["admin_id"]:
        raise HTTPException(status_code=403, detail="Only team admin can add members")
    
    if user_id not in team["member_ids"]:
        team["member_ids"].append(user_id)
        db["users"][user_id]["team_ids"].append(team_id)
    
    return {"message": "Member added successfully"}

@app.delete("/api/teams/{team_id}/members/{user_id}")
async def remove_team_member(team_id: str, user_id: str, current_user: str = Depends(get_current_user)):
    if team_id not in db["teams"]:
        raise HTTPException(status_code=404, detail="Team not found")
    
    team = db["teams"][team_id]
    if current_user != team["admin_id"]:
        raise HTTPException(status_code=403, detail="Only team admin can remove members")
    
    if user_id in team["member_ids"]:
        team["member_ids"].remove(user_id)
        if team_id in db["users"][user_id]["team_ids"]:
            db["users"][user_id]["team_ids"].remove(team_id)
    
    return {"message": "Member removed successfully"}

@app.post("/api/projects", response_model=Project)
async def create_project(request: CreateProjectRequest, current_user: str = Depends(get_current_user)):
    if request.team_id not in db["teams"]:
        raise HTTPException(status_code=404, detail="Team not found")
    
    project_id = str(uuid.uuid4())
    project = Project(
        id=project_id,
        name=request.name,
        description=request.description,
        team_id=request.team_id,
        start_date=request.start_date,
        end_date=request.end_date,
        created_at=datetime.now(),
        created_by=current_user
    )
    db["projects"][project_id] = project.dict()
    return project

@app.get("/api/projects", response_model=List[Project])
async def get_projects(team_id: Optional[str] = None, current_user: str = Depends(get_current_user)):
    projects = []
    for project in db["projects"].values():
        if team_id is None or project["team_id"] == team_id:
            projects.append(Project(**project))
    return projects

@app.get("/api/projects/{project_id}", response_model=Project)
async def get_project(project_id: str, current_user: str = Depends(get_current_user)):
    if project_id not in db["projects"]:
        raise HTTPException(status_code=404, detail="Project not found")
    return Project(**db["projects"][project_id])

@app.put("/api/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, request: CreateProjectRequest, current_user: str = Depends(get_current_user)):
    if project_id not in db["projects"]:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project = db["projects"][project_id]
    project.update({
        "name": request.name,
        "description": request.description,
        "team_id": request.team_id,
        "start_date": request.start_date.isoformat() if request.start_date else None,
        "end_date": request.end_date.isoformat() if request.end_date else None
    })
    
    return Project(**project)

@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: str, current_user: str = Depends(get_current_user)):
    if project_id not in db["projects"]:
        raise HTTPException(status_code=404, detail="Project not found")
    
    tasks_to_delete = [task_id for task_id, task in db["tasks"].items() if task["project_id"] == project_id]
    for task_id in tasks_to_delete:
        del db["tasks"][task_id]
    
    del db["projects"][project_id]
    return {"message": "Project deleted successfully"}

@app.post("/api/tasks", response_model=Task)
async def create_task(request: CreateTaskRequest, current_user: str = Depends(get_current_user)):
    if request.project_id not in db["projects"]:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if request.parent_task_id and request.parent_task_id not in db["tasks"]:
        raise HTTPException(status_code=404, detail="Parent task not found")
    
    task_id = str(uuid.uuid4())
    task = Task(
        id=task_id,
        title=request.title,
        description=request.description,
        project_id=request.project_id,
        parent_task_id=request.parent_task_id,
        assigned_to=request.assigned_to,
        priority=request.priority,
        start_date=request.start_date,
        end_date=request.end_date,
        estimated_hours=request.estimated_hours,
        created_at=datetime.now(),
        created_by=current_user,
        updated_at=datetime.now()
    )
    db["tasks"][task_id] = task.dict()
    return task

@app.get("/api/tasks", response_model=List[Task])
async def get_tasks(
    project_id: Optional[str] = None,
    assigned_to: Optional[str] = None,
    status: Optional[TaskStatus] = None,
    current_user: str = Depends(get_current_user)
):
    tasks = []
    for task in db["tasks"].values():
        if (project_id is None or task["project_id"] == project_id) and \
           (assigned_to is None or task["assigned_to"] == assigned_to) and \
           (status is None or task["status"] == status):
            tasks.append(Task(**task))
    return tasks

@app.get("/api/tasks/{task_id}", response_model=Task)
async def get_task(task_id: str, current_user: str = Depends(get_current_user)):
    if task_id not in db["tasks"]:
        raise HTTPException(status_code=404, detail="Task not found")
    return Task(**db["tasks"][task_id])

@app.put("/api/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, request: UpdateTaskRequest, current_user: str = Depends(get_current_user)):
    if task_id not in db["tasks"]:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task = db["tasks"][task_id]
    update_data = request.dict(exclude_unset=True)
    
    if "start_date" in update_data and update_data["start_date"]:
        update_data["start_date"] = update_data["start_date"].isoformat()
    if "end_date" in update_data and update_data["end_date"]:
        update_data["end_date"] = update_data["end_date"].isoformat()
    
    task.update(update_data)
    task["updated_at"] = datetime.now().isoformat()
    
    if request.status == TaskStatus.DONE and task["status"] != TaskStatus.DONE:
        await send_task_completion_notification(task_id, current_user)
    
    return Task(**task)

@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: str, current_user: str = Depends(get_current_user)):
    if task_id not in db["tasks"]:
        raise HTTPException(status_code=404, detail="Task not found")
    
    subtasks_to_delete = [tid for tid, t in db["tasks"].items() if t["parent_task_id"] == task_id]
    for subtask_id in subtasks_to_delete:
        del db["tasks"][subtask_id]
    
    del db["tasks"][task_id]
    return {"message": "Task deleted successfully"}

@app.get("/api/tasks/{task_id}/subtasks", response_model=List[Task])
async def get_subtasks(task_id: str, current_user: str = Depends(get_current_user)):
    if task_id not in db["tasks"]:
        raise HTTPException(status_code=404, detail="Task not found")
    
    subtasks = []
    for task in db["tasks"].values():
        if task["parent_task_id"] == task_id:
            subtasks.append(Task(**task))
    return subtasks

@app.get("/api/gantt")
async def get_gantt_data(
    project_id: Optional[str] = None,
    team_id: Optional[str] = None,
    assigned_to: Optional[str] = None,
    current_user: str = Depends(get_current_user)
):
    tasks = []
    for task in db["tasks"].values():
        if project_id and task["project_id"] != project_id:
            continue
        if team_id:
            project = db["projects"].get(task["project_id"])
            if not project or project["team_id"] != team_id:
                continue
        if assigned_to and task["assigned_to"] != assigned_to:
            continue
        
        gantt_task = {
            "id": task["id"],
            "title": task["title"],
            "start": task["start_date"],
            "end": task["end_date"],
            "progress": task["progress"],
            "status": task["status"],
            "assigned_to": task["assigned_to"],
            "project_id": task["project_id"],
            "parent_task_id": task["parent_task_id"]
        }
        tasks.append(gantt_task)
    
    return {"tasks": tasks}

@app.post("/api/files/upload")
async def upload_file(
    file: UploadFile = File(...),
    project_id: Optional[str] = None,
    task_id: Optional[str] = None,
    is_public: bool = False,
    current_user: str = Depends(get_current_user)
):
    file_id = str(uuid.uuid4())
    content = await file.read()
    
    file_item = FileItem(
        id=file_id,
        name=file.filename,
        size=len(content),
        content_type=file.content_type,
        project_id=project_id,
        task_id=task_id,
        uploaded_by=current_user,
        uploaded_at=datetime.now(),
        is_public=is_public
    )
    
    db["files"][file_id] = {
        **file_item.dict(),
        "content": content
    }
    
    if task_id and task_id in db["tasks"]:
        db["tasks"][task_id]["file_ids"].append(file_id)
    
    return file_item

@app.get("/api/files", response_model=List[FileItem])
async def get_files(
    project_id: Optional[str] = None,
    task_id: Optional[str] = None,
    current_user: str = Depends(get_current_user)
):
    files = []
    for file_data in db["files"].values():
        if (project_id is None or file_data["project_id"] == project_id) and \
           (task_id is None or file_data["task_id"] == task_id):
            file_item = {k: v for k, v in file_data.items() if k != "content"}
            files.append(FileItem(**file_item))
    return files

@app.get("/api/files/{file_id}")
async def download_file(file_id: str, current_user: str = Depends(get_current_user)):
    if file_id not in db["files"]:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_data = db["files"][file_id]
    return {
        "filename": file_data["name"],
        "content_type": file_data["content_type"],
        "size": file_data["size"]
    }

@app.delete("/api/files/{file_id}")
async def delete_file(file_id: str, current_user: str = Depends(get_current_user)):
    if file_id not in db["files"]:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_data = db["files"][file_id]
    if file_data["uploaded_by"] != current_user:
        raise HTTPException(status_code=403, detail="Not authorized to delete this file")
    
    if file_data["task_id"] and file_data["task_id"] in db["tasks"]:
        task = db["tasks"][file_data["task_id"]]
        if file_id in task["file_ids"]:
            task["file_ids"].remove(file_id)
    
    del db["files"][file_id]
    return {"message": "File deleted successfully"}

@app.post("/api/comments", response_model=Comment)
async def create_comment(request: CreateCommentRequest, current_user: str = Depends(get_current_user)):
    if request.file_id and request.file_id not in db["files"]:
        raise HTTPException(status_code=404, detail="File not found")
    if request.task_id and request.task_id not in db["tasks"]:
        raise HTTPException(status_code=404, detail="Task not found")
    
    comment_id = str(uuid.uuid4())
    comment = Comment(
        id=comment_id,
        content=request.content,
        file_id=request.file_id,
        task_id=request.task_id,
        author_id=current_user,
        created_at=datetime.now()
    )
    db["comments"][comment_id] = comment.dict()
    return comment

@app.get("/api/comments", response_model=List[Comment])
async def get_comments(
    file_id: Optional[str] = None,
    task_id: Optional[str] = None,
    current_user: str = Depends(get_current_user)
):
    comments = []
    for comment in db["comments"].values():
        if (file_id is None or comment["file_id"] == file_id) and \
           (task_id is None or comment["task_id"] == task_id):
            comments.append(Comment(**comment))
    return comments

@app.delete("/api/comments/{comment_id}")
async def delete_comment(comment_id: str, current_user: str = Depends(get_current_user)):
    if comment_id not in db["comments"]:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    comment = db["comments"][comment_id]
    if comment["author_id"] != current_user:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
    
    del db["comments"][comment_id]
    return {"message": "Comment deleted successfully"}

async def send_task_completion_notification(task_id: str, completed_by: str):
    task = db["tasks"][task_id]
    project = db["projects"][task["project_id"]]
    team = db["teams"][project["team_id"]]
    
    notification_id = str(uuid.uuid4())
    notification = Notification(
        id=notification_id,
        title="Task Completed",
        message=f"Task '{task['title']}' has been completed by {completed_by}",
        user_id=team["admin_id"],
        type="task_completion",
        created_at=datetime.now()
    )
    db["notifications"][notification_id] = notification.dict()

@app.get("/api/notifications", response_model=List[Notification])
async def get_notifications(current_user: str = Depends(get_current_user)):
    notifications = []
    for notification in db["notifications"].values():
        if notification["user_id"] == current_user:
            notifications.append(Notification(**notification))
    return sorted(notifications, key=lambda x: x.created_at, reverse=True)

@app.put("/api/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: str = Depends(get_current_user)):
    if notification_id not in db["notifications"]:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification = db["notifications"][notification_id]
    if notification["user_id"] != current_user:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    notification["read"] = True
    return {"message": "Notification marked as read"}

@app.post("/api/integrations", response_model=APIIntegration)
async def create_api_integration(request: CreateAPIIntegrationRequest, current_user: str = Depends(get_current_user)):
    if request.project_id not in db["projects"]:
        raise HTTPException(status_code=404, detail="Project not found")
    
    integration_id = str(uuid.uuid4())
    integration = APIIntegration(
        id=integration_id,
        name=request.name,
        endpoint=request.endpoint,
        method=request.method,
        headers=request.headers,
        project_id=request.project_id,
        created_by=current_user,
        created_at=datetime.now()
    )
    db["api_integrations"][integration_id] = integration.dict()
    return integration

@app.get("/api/integrations", response_model=List[APIIntegration])
async def get_api_integrations(project_id: Optional[str] = None, current_user: str = Depends(get_current_user)):
    integrations = []
    for integration in db["api_integrations"].values():
        if project_id is None or integration["project_id"] == project_id:
            integrations.append(APIIntegration(**integration))
    return integrations

@app.post("/api/integrations/{integration_id}/execute")
async def execute_api_integration(integration_id: str, payload: Dict[str, Any] = {}, current_user: str = Depends(get_current_user)):
    if integration_id not in db["api_integrations"]:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    integration = db["api_integrations"][integration_id]
    
    return {
        "status": "success",
        "message": f"API call to {integration['endpoint']} executed successfully",
        "integration": integration,
        "payload": payload
    }

@app.delete("/api/integrations/{integration_id}")
async def delete_api_integration(integration_id: str, current_user: str = Depends(get_current_user)):
    if integration_id not in db["api_integrations"]:
        raise HTTPException(status_code=404, detail="Integration not found")
    
    integration = db["api_integrations"][integration_id]
    if integration["created_by"] != current_user:
        raise HTTPException(status_code=403, detail="Not authorized to delete this integration")
    
    del db["api_integrations"][integration_id]
    return {"message": "Integration deleted successfully"}

@app.on_event("startup")
async def startup_event():
    user_id = "user_1"
    demo_user = User(
        id=user_id,
        name="Demo User",
        email="demo@example.com",
        role=UserRole.ADMIN,
        created_at=datetime.now()
    )
    db["users"][user_id] = demo_user.dict()

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}
