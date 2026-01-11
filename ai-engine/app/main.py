from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import routers
from app.api.routes import (
    extract_router,
    risk_router,
    osint_router,
    agent_router,
    email_router
)

app = FastAPI(
    title="MantleFlow AI Engine",
    description="AI-powered document processing, risk scoring, and collection automation",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(extract_router)
app.include_router(risk_router)
app.include_router(osint_router)
app.include_router(agent_router)
app.include_router(email_router)


@app.get("/")
def health_check():
    """Health check endpoint"""
    return {"status": "AI Engine is running", "version": "1.0.0"}


@app.get("/health")
def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "services": {
            "ocr": "available",
            "osint": "available",
            "risk_scoring": "available",
            "email": "available",
            "agent": "available"
        }
    }
