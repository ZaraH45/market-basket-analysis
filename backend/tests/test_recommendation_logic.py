import sys
import pandas as pd
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))
from app.services.recommendation import prepare_rules, get_popular, recommend

raw = pd.DataFrame([
    {"antecedent_ids": "1",   "consequent_ids": "2",   "confidence": 0.9, "lift": 3.0, "support": 0.05},
    {"antecedent_ids": "1",   "consequent_ids": "3",   "confidence": 0.6, "lift": 2.0, "support": 0.04},
    {"antecedent_ids": "1|2", "consequent_ids": "4",   "confidence": 0.8, "lift": 4.0, "support": 0.02},
    {"antecedent_ids": "9",   "consequent_ids": "5",   "confidence": 0.7, "lift": 2.5, "support": 0.03},
])
rules = prepare_rules(raw)
baskets = pd.DataFrame({"product_ids": ["7|8", "7|8|1", "7|6", "7"]})
popular = get_popular(baskets)  # 7 most common, then 8, 1, 6

# 1
assert popular[0] == 7 and popular[1] == 8, popular

# 2 Basket {1}: rules 1->2 and 1->3 fire; 1|2->4 must NOT (2 not in cart); 9->5 must NOT
r = recommend({1}, rules, popular, k=2, fill=False)
assert [x["product_id"] for x in r] == [2, 3], r
assert all(x["source"] == "rule" for x in r)

# 3 Basket {1,2}: 1|2->4 now fires, cart items never recommended
r = recommend({1, 2}, rules, popular, k=5, fill=False)
ids = [x["product_id"] for x in r]
assert 4 in ids and 1 not in ids and 2 not in ids, ids

# 4No duplicates
assert len(ids) == len(set(ids))

# 5 Hybrid fill: basket with no matching rules gets k popular items
r = recommend({100}, rules, popular, k=3, fill=True)
assert len(r) == 3 and all(x["source"] == "popular" for x in r), r
assert r[0]["confidence"] is None

# 6Hybrid never recommends items already in the cart
r = recommend({7}, rules, popular, k=3, fill=True)
assert 7 not in [x["product_id"] for x in r], r

# 7 Rules-only returns nothing when no rule fires
assert recommend({100}, rules, popular, k=3, fill=False) == []

print("ALL CHECKS PASSED")

