
from typing import List, Optional
from pydantic import BaseModel


class Product(BaseModel):
    product_id: int
    product_name: str
    aisle_id: Optional[int] = None
    department_id: Optional[int] = None
    aisle: Optional[str] = None
    department: Optional[str] = None


class ProductListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    products: List[Product]


class DepartmentsResponse(BaseModel):
    departments: List[str]
