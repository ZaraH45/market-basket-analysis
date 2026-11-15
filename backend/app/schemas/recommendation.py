from typing import List, Optional
from pydantic import BaseModel


class RecommendationRequest(BaseModel):
    # product IDs currently in the guest's cart
    basket: List[int]
    # number of recommendations to return
    k: int = 10


class RecommendedProduct(BaseModel):
    product_id: int
    product_name: str
    # confidence, lift and support are None for popular-product fillers
    confidence: Optional[float]
    lift: Optional[float]
    support: Optional[float]
    # "rule" = from association rules, "popular" = fallback filler
    source: str


class RecommendationResponse(BaseModel):
    recommendations: List[RecommendedProduct]
