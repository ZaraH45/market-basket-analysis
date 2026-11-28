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

# 8 Co-occurrence layer: product 100 appears with 50 in many baskets, so 50 is suggested for a cart with 100,
#   even though NO rule mentions product 100.
from app.services.recommendation import build_cooccurrence
cb = pd.DataFrame({"product_ids": ["100|50"] * 10 + ["100|51"] * 2 + ["7|8"] * 20 + ["7"] * 20})
cooc = build_cooccurrence(cb)
r = recommend({100}, rules, popular, k=2, fill=True, cooc=cooc)
assert r[0]["product_id"] == 50 and r[0]["source"] == "cooccurrence", r
assert 100 not in [x["product_id"] for x in r]
assert r[1]["product_id"] != 50 and len({x["product_id"] for x in r}) == 2   # no duplicates

# 9 Without cooc, behaviour is unchanged (old tests above still hold)
assert recommend({100}, rules, popular, k=2, fill=False) == []

# 10 Same-aisle layer for a product with no history at all
from app.services.recommendation import build_similar
cat = pd.DataFrame({"product_id": [7, 8, 60, 61, 200], "aisle": ["fruit", "fruit", "milk", "milk", "milk"]})
sim = build_similar(cat, [7, 8, 60, 61, 200])
r = recommend({200}, rules, popular, k=2, fill=True, cooc=cooc, similar=sim)
assert r[0]["product_id"] == 60 and r[0]["source"] == "similar", r      # 200 is a milk product -> other milk first
assert 200 not in [x["product_id"] for x in r]

# 11 Category layer: chips (aisle "chips") are usually bought with soda (aisle "soda").
cat2 = pd.DataFrame({"product_id": [1000, 1001, 2000, 2001, 3000],
                     "aisle": ["chips", "chips", "soda", "soda", "bread"]})
bk = pd.DataFrame({"product_ids": ["1000|2000"] * 30 + ["1001|2001"] * 30 + ["3000"] * 40})
pop2 = [3000, 2000, 1000, 2001, 1001]
sim2 = build_similar(cat2, pop2, bk, min_aisle_pair=5)
assert sim2["complements"]["chips"] == ["soda"], sim2["complements"]
r = recommend({1001}, rules, pop2, k=3, fill=True, similar=sim2)
assert r[0]["source"] == "category" and r[0]["product_id"] == 2000, r   # chips -> soda
assert 1001 not in [x["product_id"] for x in r]

# 12 Hand-written pairings: a bread product gets butter, spreads (jam) and cheese first.
cat3 = pd.DataFrame({"product_id": [101, 102, 103, 104, 105, 106],
                     "aisle": ["bread", "butter", "spreads", "packaged cheese", "eggs", "bread"]})
pop3 = [106, 105, 104, 103, 102, 101]
sim3 = build_similar(cat3, pop3)
r = recommend({101}, rules, pop3, k=8, fill=True, similar=sim3)   # website uses k=8 -> 4 pairing slots
assert [x["product_id"] for x in r[:4]] == [102, 103, 104, 105], r          # butter, jam, cheese, eggs
assert all(x["source"] == "pairing" for x in r[:4])
assert 101 not in [x["product_id"] for x in r]

print("ALL CHECKS PASSED")

