
import pandas as pd
from pathlib import Path
from functools import lru_cache

ROOT = Path(__file__).resolve().parents[3]

CATALOG_PATH = (
    ROOT
    / "Phase1"
    / "data"
    / "processed"
    / "product_catalog.csv"
)


@lru_cache(maxsize=1)
def load_catalog():
    catalog = pd.read_csv(CATALOG_PATH)

    catalog["product_name"] = catalog["product_name"].fillna("")
    catalog["aisle"] = catalog["aisle"].fillna("Unknown")
    catalog["department"] = catalog["department"].fillna("Unknown")

    return catalog


def get_departments():
    catalog = load_catalog()

    departments = sorted(
        catalog["department"].dropna().unique().tolist()
    )

    return departments


def search_products(search=None, department=None, page=1, page_size=24):
    catalog = load_catalog()

    filtered = catalog

    if search:
        search = search.strip().lower()

        if search:
            mask = (
                filtered["product_name"].str.lower().str.contains(
                    search, regex=False, na=False
                )
                | filtered["aisle"].str.lower().str.contains(
                    search, regex=False, na=False
                )
                | filtered["department"].str.lower().str.contains(
                    search, regex=False, na=False
                )
            )

            filtered = filtered[mask]

    if department:
        filtered = filtered[
            filtered["department"].str.lower() == department.strip().lower()
        ]

    total = len(filtered)

    start = (page - 1) * page_size
    end = start + page_size

    page_data = filtered.iloc[start:end]

    products = page_data.to_dict(orient="records")

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "products": products
    }


def get_product(product_id):
    catalog = load_catalog()

    result = catalog[
        catalog["product_id"] == product_id
    ]

    if result.empty:
        return None

    return result.iloc[0].to_dict()
