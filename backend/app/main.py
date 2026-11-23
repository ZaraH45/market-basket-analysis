
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.recommend import router as recommend_router
from app.api.routes.analytics import router as analytics_router


app = FastAPI(title="Market Basket Analysis API", description="Backend API for market basket analysis and product recommendations.", version="1.0.0")


app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],)

app.include_router(recommend_router)
app.include_router(analytics_router)


@app.get("/")
def home():
    return {"message": "Market Basket Analysis API is running!"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
