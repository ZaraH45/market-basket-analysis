import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parents[1]))

import pandas as pd
from fastapi.testclient import TestClient
from app.main import app
from app.services.recommendation import RULES_PATH

client = TestClient(app)

# empty basket -> should still return k popular products
r = client.post("/recommend", json={"basket": [], "k": 5})
assert r.status_code == 200, r.text
recs = r.json()["recommendations"]
assert len(recs) == 5, recs
assert all("product_name" in x and "source" in x for x in recs)
print("Empty basket OK ->", [x["product_name"] for x in recs])

# non-empty basket: use a product from the rules file so a rule is guaranteed to fire
rules = pd.read_csv(RULES_PATH)
first = int(str(rules.iloc[0]["antecedent_ids"]).split("|")[0])
r = client.post("/recommend", json={"basket": [first], "k": 10})
assert r.status_code == 200, r.text
recs = r.json()["recommendations"]
assert len(recs) == 10 and first not in [x["product_id"] for x in recs]
print(f"Basket [{first}] OK -> sources:", sorted({x['source'] for x in recs}))
print("API CHECKS PASSED")
