import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

from app.routers import auth, account, transaction, category, tag, budget, agent
from app.assistant import router as assistant_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(name)s | %(message)s',
    datefmt='%H:%M:%S'
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.API_V1_STR, tags=["authentication"])
app.include_router(account.router, prefix=f"{settings.API_V1_STR}/account", tags=["account"])
app.include_router(transaction.router, prefix=f"{settings.API_V1_STR}/transaction", tags=["transaction"])

app.include_router(category.router, prefix=f"{settings.API_V1_STR}/category", tags=["category"])
app.include_router(tag.router, prefix=f"{settings.API_V1_STR}/tag", tags=["tag"])
app.include_router(budget.router, prefix=f"{settings.API_V1_STR}/budget", tags=["budget"])
app.include_router(agent.router, prefix=f"{settings.API_V1_STR}/agent", tags=["agent"])
app.include_router(assistant_router.router, prefix=f"{settings.API_V1_STR}/assistant", tags=["assistant"])

@app.get("/api")
async def root():
    return {"message": "Money Intelligence API", "version": settings.VERSION}



