from fastapi import FastAPI
from fastapi.middleware.wsgi import WSGIMiddleware
from main import app as flask_app

app = FastAPI()

app.mount("/", WSGIMiddleware(flask_app))
