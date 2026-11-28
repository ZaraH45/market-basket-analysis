"""Cart-style evaluation of the recommender (Member 3).

The website recommends products from a shopper's CURRENT cart, so this script
tests exactly that: for every held-out basket, half the items are treated as
"already in the cart" and the other half are hidden. We then check whether the
recommender can bring the hidden items back.

Rules are mined on TRAIN baskets only (80%), and every test basket is unseen,
so there is no data leakage. Three methods are compared:
  popularity   - always recommend the most popular products
  rules        - association rules only (may return fewer than K items)
  hybrid       - rules first, popular products to fill (what the website uses)

Run from the backend folder:
    python scripts/basket_completion_evaluation.py
"""
import json
import math
import random
import sys
from pathlib import Path

import pandas as pd

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.services.association_mining import (  # noqa: E402
    DEFAULT_BASKETS_PATH,
    load_data,
    mine_association_patterns,
)
from app.services.recommendation import get_popular, prepare_rules, recommend, split_ids  # noqa: E402

SEED = 42
TEST_FRACTION = 0.20
MIN_BASKET_SIZE = 4          # need at least 2 cart items + 2 hidden items
K_VALUES = [5, 10, 20]
OUTPUT_DIR = Path(__file__).resolve().parents[1] / "data" / "processed" / "basket_completion_evaluation"


def main():
    baskets = pd.read_csv(DEFAULT_BASKETS_PATH).sample(frac=1.0, random_state=SEED).reset_index(drop=True)
    split = int(len(baskets) * (1 - TEST_FRACTION))
    train_df, test_df = baskets.iloc[:split], baskets.iloc[split:]

    _, product_names = load_data()
    transactions = [list(split_ids(t)) for t in train_df["product_ids"]]
    mined = mine_association_patterns(transactions, product_names, algorithm="fpgrowth")
    rules = prepare_rules(mined["association_rules"])
    popular = get_popular(train_df)

    rng = random.Random(SEED)
    cases = []
    for text in test_df["product_ids"]:
        items = sorted(split_ids(text))
        if len(items) < MIN_BASKET_SIZE:
            continue
        rng.shuffle(items)
        half = math.ceil(len(items) / 2)
        cases.append((set(items[:half]), set(items[half:])))

    print(f"train baskets: {len(train_df)} | test baskets: {len(test_df)} | usable test cases: {len(cases)} | rules: {len(rules)}")

    rows = []
    for method in ["popularity", "rules", "hybrid"]:
        for k in K_VALUES:
            precision = recall = hits = 0.0
            for cart, hidden in cases:
                if method == "popularity":
                    recommended = [p for p in popular if p not in cart][:k]
                else:
                    recs = recommend(cart, rules, popular, k, fill=(method == "hybrid"))
                    recommended = [r["product_id"] for r in recs]
                correct = len(set(recommended) & hidden)
                precision += correct / k
                recall += correct / len(hidden)
                hits += 1 if correct else 0
            n = len(cases)
            rows.append({
                "method": method, "k": k,
                "precision_at_k": round(precision / n, 4),
                "recall_at_k": round(recall / n, 4),
                "hit_rate_at_k": round(hits / n, 4),
            })

    result = pd.DataFrame(rows)
    print(result.to_string(index=False))

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    result.to_csv(OUTPUT_DIR / "basket_completion_results.csv", index=False)
    (OUTPUT_DIR / "basket_completion_summary.json").write_text(json.dumps({
        "protocol": "random 80/20 basket split; half of each test basket is the cart, the other half is hidden",
        "seed": SEED, "train_baskets": len(train_df), "test_cases": len(cases),
        "rules_mined": int(len(rules)), "k_values": K_VALUES,
    }, indent=2), encoding="utf-8")
    print("Saved to", OUTPUT_DIR)


if __name__ == "__main__":
    main()
