import pandas as pd
from fastapi import APIRouter
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse
from app.services.recommendation import (
    BASKETS_PATH, load_rules, get_popular, load_names, recommend
)

router = APIRouter()

rules = load_rules()
popular = get_popular(pd.read_csv(BASKETS_PATH))
names = load_names()


@router.post("/recommend", response_model=RecommendationResponse)
def get_recommendations(request: RecommendationRequest):
    results = recommend(request.basket, rules, popular, request.k)
    for item in results:
        item["product_name"] = names.get(item["product_id"], "Unknown")
    return {"recommendations": results}
