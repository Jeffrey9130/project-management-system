from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from werkzeug.utils import secure_filename
from datetime import datetime, date, timedelta
from enum import Enum
import uuid
import json
import io
import os

app = Flask(__name__)

app.config['JWT_SECRET_KEY'] = 'demo-secret-key'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)

jwt = JWTManager(app)
CORS(app, origins=["*"], supports_credentials=True)

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

class UserRole:
    ADMIN = "admin"
    MANAGER = "manager"
    MEMBER = "member"
    VIEWER = "viewer"

class TaskStatus:
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"

class TaskPriority:
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

def get_current_user():
    return "user_1"

def serialize_date(obj):
    if isinstance(obj, (date, datetime)):
        return obj.isoformat()
    return obj

def send_task_completion_notification(task_id, user_id):
    task = db["tasks"].get(task_id)
    if not task:
        return
    
    notification_id = str(uuid.uuid4())
    notification = {
        "id": notification_id,
        "title": "Task Completed",
        "message": f"Task '{task['title']}' has been completed",
        "user_id": "user_1",
        "type": "task_completion",
        "read": False,
        "created_at": datetime.now().isoformat()
    }
    db["notifications"][notification_id] = notification

@app.route('/api/auth/login', methods=['POST'])
def login():
    access_token = create_access_token(identity="user_1")
    return jsonify(access_token=access_token)

@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.get_json()
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "name": data.get("name"),
        "email": data.get("email"),
        "role": data.get("role", UserRole.MEMBER),
        "team_ids": [],
        "created_at": datetime.now().isoformat()
    }
    db["users"][user_id] = user
    return jsonify(user)

@app.route('/api/users', methods=['GET'])
def get_users():
    return jsonify(list(db["users"].values()))

@app.route('/api/users/<user_id>', methods=['GET'])
def get_user(user_id):
    if user_id not in db["users"]:
        return jsonify({"error": "User not found"}), 404
    return jsonify(db["users"][user_id])

@app.route('/api/teams', methods=['POST'])
def create_team():
    data = request.get_json()
    current_user = get_current_user()
    team_id = str(uuid.uuid4())
    team = {
        "id": team_id,
        "name": data.get("name"),
        "description": data.get("description"),
        "admin_id": current_user,
        "member_ids": [current_user],
        "created_at": datetime.now().isoformat()
    }
    db["teams"][team_id] = team
    
    if current_user in db["users"]:
        db["users"][current_user]["team_ids"].append(team_id)
    
    return jsonify(team)

@app.route('/api/teams', methods=['GET'])
def get_teams():
    return jsonify(list(db["teams"].values()))

@app.route('/api/teams/<team_id>', methods=['GET'])
def get_team(team_id):
    if team_id not in db["teams"]:
        return jsonify({"error": "Team not found"}), 404
    return jsonify(db["teams"][team_id])

@app.route('/api/teams/<team_id>/members/<user_id>', methods=['POST'])
def add_team_member(team_id, user_id):
    if team_id not in db["teams"]:
        return jsonify({"error": "Team not found"}), 404
    if user_id not in db["users"]:
        return jsonify({"error": "User not found"}), 404
    
    team = db["teams"][team_id]
    current_user = get_current_user()
    
    if current_user != team["admin_id"]:
        return jsonify({"error": "Only team admin can add members"}), 403
    
    if user_id not in team["member_ids"]:
        team["member_ids"].append(user_id)
        db["users"][user_id]["team_ids"].append(team_id)
    
    return jsonify({"message": "Member added successfully"})

@app.route('/api/teams/<team_id>/members/<user_id>', methods=['DELETE'])
def remove_team_member(team_id, user_id):
    if team_id not in db["teams"]:
        return jsonify({"error": "Team not found"}), 404
    
    team = db["teams"][team_id]
    current_user = get_current_user()
    
    if current_user != team["admin_id"]:
        return jsonify({"error": "Only team admin can remove members"}), 403
    
    if user_id in team["member_ids"]:
        team["member_ids"].remove(user_id)
        if team_id in db["users"][user_id]["team_ids"]:
            db["users"][user_id]["team_ids"].remove(team_id)
    
    return jsonify({"message": "Member removed successfully"})

@app.route('/api/projects', methods=['POST'])
def create_project():
    data = request.get_json()
    current_user = get_current_user()
    
    if data.get("team_id") not in db["teams"]:
        return jsonify({"error": "Team not found"}), 404
    
    project_id = str(uuid.uuid4())
    project = {
        "id": project_id,
        "name": data.get("name"),
        "description": data.get("description"),
        "team_id": data.get("team_id"),
        "start_date": data.get("start_date"),
        "end_date": data.get("end_date"),
        "status": "active",
        "created_at": datetime.now().isoformat(),
        "created_by": current_user
    }
    db["projects"][project_id] = project
    return jsonify(project)

@app.route('/api/projects', methods=['GET'])
def get_projects():
    team_id = request.args.get('team_id')
    projects = []
    for project in db["projects"].values():
        if team_id is None or project["team_id"] == team_id:
            projects.append(project)
    return jsonify(projects)

@app.route('/api/projects/<project_id>', methods=['GET'])
def get_project(project_id):
    if project_id not in db["projects"]:
        return jsonify({"error": "Project not found"}), 404
    return jsonify(db["projects"][project_id])

@app.route('/api/projects/<project_id>', methods=['PUT'])
def update_project(project_id):
    if project_id not in db["projects"]:
        return jsonify({"error": "Project not found"}), 404
    
    data = request.get_json()
    project = db["projects"][project_id]
    project.update({
        "name": data.get("name", project["name"]),
        "description": data.get("description", project["description"]),
        "team_id": data.get("team_id", project["team_id"]),
        "start_date": data.get("start_date", project["start_date"]),
        "end_date": data.get("end_date", project["end_date"])
    })
    
    return jsonify(project)

@app.route('/api/projects/<project_id>', methods=['DELETE'])
def delete_project(project_id):
    if project_id not in db["projects"]:
        return jsonify({"error": "Project not found"}), 404
    
    tasks_to_delete = [task_id for task_id, task in db["tasks"].items() if task["project_id"] == project_id]
    for task_id in tasks_to_delete:
        del db["tasks"][task_id]
    
    del db["projects"][project_id]
    return jsonify({"message": "Project deleted successfully"})

@app.route('/api/tasks', methods=['POST'])
def create_task():
    data = request.get_json()
    current_user = get_current_user()
    
    if data.get("project_id") not in db["projects"]:
        return jsonify({"error": "Project not found"}), 404
    
    if data.get("parent_task_id") and data.get("parent_task_id") not in db["tasks"]:
        return jsonify({"error": "Parent task not found"}), 404
    
    task_id = str(uuid.uuid4())
    task = {
        "id": task_id,
        "title": data.get("title"),
        "description": data.get("description"),
        "project_id": data.get("project_id"),
        "parent_task_id": data.get("parent_task_id"),
        "assigned_to": data.get("assigned_to"),
        "status": data.get("status", TaskStatus.TODO),
        "priority": data.get("priority", TaskPriority.MEDIUM),
        "start_date": data.get("start_date"),
        "end_date": data.get("end_date"),
        "estimated_hours": data.get("estimated_hours"),
        "actual_hours": data.get("actual_hours"),
        "progress": data.get("progress", 0),
        "file_ids": [],
        "created_at": datetime.now().isoformat(),
        "created_by": current_user,
        "updated_at": datetime.now().isoformat()
    }
    db["tasks"][task_id] = task
    return jsonify(task)

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    project_id = request.args.get('project_id')
    assigned_to = request.args.get('assigned_to')
    status = request.args.get('status')
    
    tasks = []
    for task in db["tasks"].values():
        if (project_id is None or task["project_id"] == project_id) and \
           (assigned_to is None or task["assigned_to"] == assigned_to) and \
           (status is None or task["status"] == status):
            tasks.append(task)
    return jsonify(tasks)

@app.route('/api/tasks/<task_id>', methods=['GET'])
def get_task(task_id):
    if task_id not in db["tasks"]:
        return jsonify({"error": "Task not found"}), 404
    return jsonify(db["tasks"][task_id])

@app.route('/api/tasks/<task_id>', methods=['PUT'])
def update_task(task_id):
    if task_id not in db["tasks"]:
        return jsonify({"error": "Task not found"}), 404
    
    data = request.get_json()
    task = db["tasks"][task_id]
    old_status = task["status"]
    
    for key, value in data.items():
        if value is not None:
            task[key] = value
    
    task["updated_at"] = datetime.now().isoformat()
    
    if data.get("status") == TaskStatus.DONE and old_status != TaskStatus.DONE:
        send_task_completion_notification(task_id, get_current_user())
    
    return jsonify(task)

@app.route('/api/tasks/<task_id>', methods=['DELETE'])
def delete_task(task_id):
    if task_id not in db["tasks"]:
        return jsonify({"error": "Task not found"}), 404
    
    subtasks_to_delete = [tid for tid, t in db["tasks"].items() if t["parent_task_id"] == task_id]
    for subtask_id in subtasks_to_delete:
        del db["tasks"][subtask_id]
    
    del db["tasks"][task_id]
    return jsonify({"message": "Task deleted successfully"})

@app.route('/api/tasks/<task_id>/subtasks', methods=['GET'])
def get_subtasks(task_id):
    if task_id not in db["tasks"]:
        return jsonify({"error": "Task not found"}), 404
    
    subtasks = []
    for task in db["tasks"].values():
        if task["parent_task_id"] == task_id:
            subtasks.append(task)
    return jsonify(subtasks)

@app.route('/api/gantt', methods=['GET'])
def get_gantt_data():
    project_id = request.args.get('project_id')
    team_id = request.args.get('team_id')
    assigned_to = request.args.get('assigned_to')
    
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
    
    return jsonify({"tasks": tasks})

@app.route('/api/files/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    project_id = request.form.get('project_id')
    task_id = request.form.get('task_id')
    is_public = request.form.get('is_public', 'false').lower() == 'true'
    current_user = get_current_user()
    
    file_id = str(uuid.uuid4())
    content = file.read()
    
    file_item = {
        "id": file_id,
        "name": secure_filename(file.filename),
        "size": len(content),
        "content_type": file.content_type,
        "project_id": project_id,
        "task_id": task_id,
        "uploaded_by": current_user,
        "uploaded_at": datetime.now().isoformat(),
        "is_public": is_public,
        "content": content
    }
    
    db["files"][file_id] = file_item
    
    if task_id and task_id in db["tasks"]:
        db["tasks"][task_id]["file_ids"].append(file_id)
    
    file_response = {k: v for k, v in file_item.items() if k != "content"}
    return jsonify(file_response)

@app.route('/api/files', methods=['GET'])
def get_files():
    project_id = request.args.get('project_id')
    task_id = request.args.get('task_id')
    
    files = []
    for file_data in db["files"].values():
        if (project_id is None or file_data["project_id"] == project_id) and \
           (task_id is None or file_data["task_id"] == task_id):
            file_item = {k: v for k, v in file_data.items() if k != "content"}
            files.append(file_item)
    return jsonify(files)

@app.route('/api/files/<file_id>', methods=['GET'])
def download_file(file_id):
    if file_id not in db["files"]:
        return jsonify({"error": "File not found"}), 404
    
    file_data = db["files"][file_id]
    return {
        "name": file_data["name"],
        "content_type": file_data["content_type"],
        "size": file_data["size"]
    }

@app.route('/api/files/<file_id>', methods=['DELETE'])
def delete_file(file_id):
    if file_id not in db["files"]:
        return jsonify({"error": "File not found"}), 404
    
    file_data = db["files"][file_id]
    if file_data["task_id"] and file_data["task_id"] in db["tasks"]:
        task = db["tasks"][file_data["task_id"]]
        if file_id in task["file_ids"]:
            task["file_ids"].remove(file_id)
    
    del db["files"][file_id]
    return jsonify({"message": "File deleted successfully"})

@app.route('/api/comments', methods=['POST'])
def create_comment():
    data = request.get_json()
    current_user = get_current_user()
    
    comment_id = str(uuid.uuid4())
    comment = {
        "id": comment_id,
        "content": data.get("content"),
        "file_id": data.get("file_id"),
        "task_id": data.get("task_id"),
        "author_id": current_user,
        "created_at": datetime.now().isoformat()
    }
    db["comments"][comment_id] = comment
    return jsonify(comment)

@app.route('/api/comments', methods=['GET'])
def get_comments():
    file_id = request.args.get('file_id')
    task_id = request.args.get('task_id')
    
    comments = []
    for comment in db["comments"].values():
        if (file_id is None or comment["file_id"] == file_id) and \
           (task_id is None or comment["task_id"] == task_id):
            comments.append(comment)
    return jsonify(comments)

@app.route('/api/comments/<comment_id>', methods=['DELETE'])
def delete_comment(comment_id):
    if comment_id not in db["comments"]:
        return jsonify({"error": "Comment not found"}), 404
    
    del db["comments"][comment_id]
    return jsonify({"message": "Comment deleted successfully"})

@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    user_id = request.args.get('user_id', get_current_user())
    notifications = [n for n in db["notifications"].values() if n["user_id"] == user_id]
    return jsonify(notifications)

@app.route('/api/notifications/<notification_id>/read', methods=['PUT'])
def mark_notification_read(notification_id):
    if notification_id not in db["notifications"]:
        return jsonify({"error": "Notification not found"}), 404
    
    db["notifications"][notification_id]["read"] = True
    return jsonify({"message": "Notification marked as read"})

@app.route('/api/integrations', methods=['POST'])
def create_api_integration():
    data = request.get_json()
    current_user = get_current_user()
    
    integration_id = str(uuid.uuid4())
    integration = {
        "id": integration_id,
        "name": data.get("name"),
        "endpoint": data.get("endpoint"),
        "method": data.get("method"),
        "headers": data.get("headers", {}),
        "project_id": data.get("project_id"),
        "created_by": current_user,
        "created_at": datetime.now().isoformat()
    }
    db["api_integrations"][integration_id] = integration
    return jsonify(integration)

@app.route('/api/integrations', methods=['GET'])
def get_api_integrations():
    project_id = request.args.get('project_id')
    integrations = []
    for integration in db["api_integrations"].values():
        if project_id is None or integration["project_id"] == project_id:
            integrations.append(integration)
    return jsonify(integrations)

@app.route('/api/integrations/<integration_id>/execute', methods=['POST'])
def execute_api_integration(integration_id):
    if integration_id not in db["api_integrations"]:
        return jsonify({"error": "Integration not found"}), 404
    
    return jsonify({"message": "API integration executed successfully", "result": "Demo response"})

@app.route('/api/integrations/<integration_id>', methods=['DELETE'])
def delete_api_integration(integration_id):
    if integration_id not in db["api_integrations"]:
        return jsonify({"error": "Integration not found"}), 404
    
    del db["api_integrations"][integration_id]
    return jsonify({"message": "Integration deleted successfully"})

@app.route('/healthz', methods=['GET'])
def healthz():
    return jsonify({"status": "ok"})

def init_demo_data():
    users_data = [
        {"id": "user_1", "name": "Demo User", "email": "demo@example.com", "role": UserRole.ADMIN},
        {"id": "user_2", "name": "John Doe", "email": "john@example.com", "role": UserRole.MANAGER},
        {"id": "user_3", "name": "Jane Smith", "email": "jane@example.com", "role": UserRole.MEMBER}
    ]
    
    for user_data in users_data:
        user = {
            **user_data,
            "team_ids": [],
            "created_at": datetime.now().isoformat()
        }
        db["users"][user_data["id"]] = user
    
    team = {
        "id": "team_1",
        "name": "Development Team",
        "description": "Main development team",
        "admin_id": "user_1",
        "member_ids": ["user_1", "user_2", "user_3"],
        "created_at": datetime.now().isoformat()
    }
    db["teams"]["team_1"] = team
    
    for user_id in ["user_1", "user_2", "user_3"]:
        db["users"][user_id]["team_ids"].append("team_1")
    
    project = {
        "id": "project_1",
        "name": "Test Project for Subtasks",
        "description": "A project to test subtask functionality",
        "team_id": "team_1",
        "start_date": "2024-01-15",
        "end_date": "2024-03-15",
        "status": "active",
        "created_at": datetime.now().isoformat(),
        "created_by": "user_1"
    }
    db["projects"]["project_1"] = project
    
    tasks_data = [
        {
            "id": "task_1",
            "title": "Main Feature Development",
            "description": "Develop the main feature of the application",
            "project_id": "project_1",
            "parent_task_id": None,
            "assigned_to": "user_1",
            "status": TaskStatus.IN_PROGRESS,
            "priority": TaskPriority.HIGH,
            "start_date": "2024-01-20",
            "end_date": "2024-02-20",
            "estimated_hours": 80.0,
            "actual_hours": 24.0,
            "progress": 30
        },
        {
            "id": "task_2",
            "title": "Database Schema Design",
            "description": "Design and implement database schema",
            "project_id": "project_1",
            "parent_task_id": "task_1",
            "assigned_to": "user_1",
            "status": TaskStatus.DONE,
            "priority": TaskPriority.HIGH,
            "start_date": "2024-01-22",
            "end_date": "2024-01-28",
            "estimated_hours": 16.0,
            "actual_hours": 16.0,
            "progress": 100
        },
        {
            "id": "task_3",
            "title": "Frontend Components",
            "description": "Create reusable frontend components",
            "project_id": "project_1",
            "parent_task_id": None,
            "assigned_to": "user_1",
            "status": TaskStatus.TODO,
            "priority": TaskPriority.MEDIUM,
            "start_date": "2024-02-01",
            "end_date": "2024-02-15",
            "estimated_hours": 40.0,
            "actual_hours": 0.0,
            "progress": 0
        }
    ]
    
    for task_data in tasks_data:
        task = {
            **task_data,
            "file_ids": [],
            "created_at": datetime.now().isoformat(),
            "created_by": "user_1",
            "updated_at": datetime.now().isoformat()
        }
        db["tasks"][task_data["id"]] = task

if __name__ == '__main__':
    init_demo_data()
    app.run(host='0.0.0.0', port=8000, debug=True)
