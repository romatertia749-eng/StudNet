from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import profiles, matches, auth
import os

app = FastAPI(title="Networking App API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://web.telegram.org"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Роутеры
app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(matches.router)

@app.get("/")
def root():
    return {"message": "Networking App API"}

@app.get("/health")
def health():
    return {"status": "ok"}

