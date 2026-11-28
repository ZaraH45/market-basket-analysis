
import pandas as pd
from fastapi import APIRouter, Query

from app.schemas.recommendation import (
    RecommendationRequest,
    RecommendationResponse,
    PopularProductsResponse
)

from app.services.recommendation import (
    BASKETS_PATH,
    CATALOG_PATH,
    load_rules,
    get_popular,
    get_popular_counts,
    build_cooccurrence,
    build_similar,
    load_names,
    recommend
)


router = APIRouter()

baskets_df = pd.read_csv(BASKETS_PATH)

rules = load_rules()
popular = get_popular(baskets_df)
popular_counts = get_popular_counts(baskets_df)
names = load_names()
cooc = build_cooccurrence(baskets_df)
similar = build_similar(pd.read_csv(CATALOG_PATH), popular, baskets_df)


@router.post("/recommend", response_model=RecommendationResponse)
def get_recommendations(request: RecommendationRequest):
    results = recommend(
        request.basket,
        rules,
        popular,
        request.k,
        names=names,
        cooc=cooc,
        similar=similar
    )

    for item in results:
        item["product_name"] = names.get(
            item["product_id"],
            "Unknown"
        )

    return {"recommendations": results}


@router.get("/popular-products", response_model=PopularProductsResponse)
def get_popular_products(limit: int = Query(default=10, ge=1, le=100)):
    products = []

    for product_id, basket_count in popular_counts[:limit]:
        products.append({
            "product_id": int(product_id),
            "product_name": names.get(product_id, "Unknown"),
            "basket_count": int(basket_count)
        })

    return {
        "total_baskets": len(baskets_df),
        "products": products
    }
