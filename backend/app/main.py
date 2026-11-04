
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Market Basket Analysis API",
    description="Backend API for market basket analysis and product recommendations.",
    version="1.0.0"
)

# Allow requests from the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "Market Basket Analysis API is running!"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }
