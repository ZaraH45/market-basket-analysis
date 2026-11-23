
from fastapi import APIRouter, Query
from app.services.analytics import (get_overview, get_itemsets, get_rules, get_evaluation)

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview")
def analytics_overview():
    return get_overview()


@router.get("/itemsets")
def frequent_itemsets(algorithm: str = Query(default="fpgrowth"), page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100), itemset_length: int = Query(default=None, ge=1), search: str = Query(default=None)):
    return get_itemsets(algorithm=algorithm, page=page, page_size=page_size, itemset_length=itemset_length, search=search)


@router.get("/rules")
def association_rules(algorithm: str = Query(default="fpgrowth"), page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100), min_confidence: float = Query(default=None, ge=0, le=1),
    min_lift: float = Query(default=None, ge=0), search: str = Query(default=None)):
    return get_rules(algorithm=algorithm, page=page, page_size=page_size, min_confidence=min_confidence, min_lift=min_lift,  search=search)


@router.get("/evaluation")
def analytics_evaluation():
    return get_evaluation()
