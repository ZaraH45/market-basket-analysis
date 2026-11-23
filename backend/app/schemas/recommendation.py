from typing import List, Optional
from pydantic import BaseModel, Field

class RecommendationRequest(BaseModel):
    basket: List[int]
    k: int = Field(default=10, ge=1)


class RecommendedProduct(BaseModel):
    product_id: int
    product_name: str
    confidence: Optional[float]
    lift: Optional[float]
    support: Optional[float]
    source: str


class RecommendationResponse(BaseModel):
    recommendations: List[RecommendedProduct]
