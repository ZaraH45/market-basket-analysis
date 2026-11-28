
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
    explanation: str
    triggered_by: List[str] = Field(default_factory=list)


class RecommendationResponse(BaseModel):
    recommendations: List[RecommendedProduct]


class PopularProduct(BaseModel):
    product_id: int
    product_name: str
    basket_count: int


class PopularProductsResponse(BaseModel):
    total_baskets: int
    products: List[PopularProduct]
