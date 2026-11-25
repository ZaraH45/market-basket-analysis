
from fastapi import APIRouter, Query, HTTPException

from app.schemas.products import (
    Product,
    ProductListResponse,
    DepartmentsResponse
)

from app.services.product_catalog import (
    search_products,
    get_product,
    get_departments
)


router = APIRouter(prefix="/products", tags=["Products"])


@router.get("/departments", response_model=DepartmentsResponse)
def product_departments():
    return {
        "departments": get_departments()
    }


@router.get("", response_model=ProductListResponse)
def list_products(
    search: str = Query(default=None),
    department: str = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=24, ge=1, le=100)
):
    return search_products(
        search=search,
        department=department,
        page=page,
        page_size=page_size
    )


@router.get("/{product_id}", response_model=Product)
def product_details(product_id: int):
    product = get_product(product_id)

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return product
