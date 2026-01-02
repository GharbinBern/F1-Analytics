"""
main.py
FastAPI application entry point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.database import engine, Base

# create fastapi app
app = FastAPI(
    title= "F1 Analytics API",
    description= "API for f1 race data analysis",
    version= "1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS (for React frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # remember to change to specific origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/")
def read_root():
    return {
        "message": "F1 Analytics API",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs"
    }

# Include routes
from routes import drivers, races, laps
app.include_router(drivers.router, prefix="/api/v1")
app.include_router(races.router, prefix="/api/v1")
app.include_router(laps.router, prefix="/api/v1")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
