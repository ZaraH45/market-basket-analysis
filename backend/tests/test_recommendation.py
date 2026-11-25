import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))
import pandas as pd
from fastapi.testclient import TestClient

from app.main import app
from app.services.recommendation import (
    prepare_rules,
    get_popular,
    get_popular_counts,
    recommend
)


# --------------------------------------------------
# 1. Popular product counting
# --------------------------------------------------

baskets = pd.DataFrame({
    "product_ids": [
        "1|2",
        "1|3",
        "2|3",
        "1"
    ]
})

counts = get_popular_counts(baskets)

assert counts == [(1, 3), (2, 2), (3, 2)], counts

popular = get_popular(baskets)

assert popular == [1, 2, 3], popular

print("Popular product counting: PASSED")


# --------------------------------------------------
# 2. Rule-based recommendations and explanations
# --------------------------------------------------

raw_rules = pd.DataFrame([
    {
        "antecedent_ids": "1",
        "consequent_ids": "2",
        "confidence": 0.8,
        "lift": 2.0,
        "support": 0.05
    },
    {
        "antecedent_ids": "1|3",
        "consequent_ids": "2",
        "confidence": 0.9,
        "lift": 3.0,
        "support": 0.04
    },
    {
        "antecedent_ids": "1",
        "consequent_ids": "4",
        "confidence": 0.7,
        "lift": 2.5,
        "support": 0.03
    }
])

rules = prepare_rules(raw_rules)

names = {
    1: "Banana",
    2: "Organic Milk",
    3: "Bread",
    4: "Eggs"
}

results = recommend(
    basket={1, 3},
    rules=rules,
    popular=[],
    k=5,
    fill=False,
    names=names
)

assert len(results) == 2, results

milk = next(
    item for item in results
    if item["product_id"] == 2
)

assert milk["source"] == "rule"
assert milk["triggered_by"] == ["Banana", "Bread"], milk
assert "Banana" in milk["explanation"]
assert "Bread" in milk["explanation"]

print("Rule-based explanation: PASSED")


# --------------------------------------------------
# 3. Popularity fallback explanation
# --------------------------------------------------

fallback = recommend(
    basket={99},
    rules=rules,
    popular=[1, 2, 3],
    k=2,
    fill=True,
    names=names
)

assert len(fallback) == 2, fallback
assert all(item["source"] == "popular" for item in fallback)
assert all(item["confidence"] is None for item in fallback)
assert all(item["triggered_by"] == [] for item in fallback)
assert all("popularity-based" in item["explanation"] for item in fallback)

print("Popularity fallback explanation: PASSED")


# --------------------------------------------------
# 4. API endpoint tests using real project data
# --------------------------------------------------

client = TestClient(app)

response = client.get("/popular-products?limit=5")

assert response.status_code == 200, response.text

popular_data = response.json()

assert popular_data["total_baskets"] == 30000
assert len(popular_data["products"]) == 5
assert all(
    "product_id" in item
    and "product_name" in item
    and "basket_count" in item
    for item in popular_data["products"]
)

counts = [
    item["basket_count"]
    for item in popular_data["products"]
]

assert counts == sorted(counts, reverse=True), counts

print("Popular products API: PASSED")


# Invalid limit should be rejected.
response = client.get("/popular-products?limit=0")

assert response.status_code == 422, response.text

print("Popular products limit validation: PASSED")


# Empty basket should return popularity-based recommendations.
response = client.post(
    "/recommend",
    json={"basket": [], "k": 5}
)

assert response.status_code == 200, response.text

recommendations = response.json()["recommendations"]

assert len(recommendations) == 5
assert all("product_name" in item for item in recommendations)
assert all("explanation" in item for item in recommendations)
assert all("triggered_by" in item for item in recommendations)
assert all(item["source"] == "popular" for item in recommendations)

print("Recommendation API response: PASSED")


print("\nALL RECOMMENDATION TESTS PASSED")


# --------------------------------------------------
# 5. Real association rule through the recommendation API
# --------------------------------------------------

from app.services.recommendation import RULES_PATH

real_rules = pd.read_csv(RULES_PATH)

first_rule = real_rules.iloc[0]

real_basket = [
    int(product_id)
    for product_id in str(first_rule["antecedent_ids"]).split("|")
]

response = client.post(
    "/recommend",
    json={"basket": real_basket, "k": 10}
)

assert response.status_code == 200, response.text

real_recommendations = response.json()["recommendations"]

rule_recommendations = [
    item for item in real_recommendations
    if item["source"] == "rule"
]

assert len(rule_recommendations) > 0, real_recommendations

for item in rule_recommendations:
    assert item["explanation"]
    assert len(item["triggered_by"]) > 0

print("Real association rule API test: PASSED")
