import sys
import pandas as pd
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.services.association_mining import (
    load_data, mine_association_patterns, DEFAULT_BASKETS_PATH
)
from app.services.recommendation import (
    prepare_rules, get_popular, split_ids, recommend
)

# Test size taken from the Member 2 help guide (26,586 train / 3,414 test)
TEST_SIZE = 3414
K_VALUES = [5, 10]

baskets_df = pd.read_csv(DEFAULT_BASKETS_PATH).reset_index(drop=True)

# ASSUMPTION: baskets.csv is already in chronological order, so the last
# 3,414 rows are the test set. If not, sort it before this line.
# ASSUMPTION: baskets.csv has a "user_id" column (per the help guide).
split_point = len(baskets_df) - TEST_SIZE
train_df = baskets_df.iloc[:split_point]
test_df = baskets_df.iloc[split_point:]

# rules are mined on TRAIN baskets only, so test baskets never
# influence the rules (no leakage).
transactions = [list(split_ids(text)) for text in train_df["product_ids"]]
_, product_names = load_data()

result = mine_association_patterns(transactions, product_names, algorithm="fpgrowth")
rules = prepare_rules(result["association_rules"])
popular = get_popular(train_df)

# A user's previous basket is the input and the NEW products
# in their next basket are the relevant ones (same setup as Member 2).
last_basket = {}
for _, row in train_df.iterrows():
    last_basket[row["user_id"]] = split_ids(row["product_ids"])

pairs = []
for _, row in test_df.iterrows():
    current = split_ids(row["product_ids"])
    previous = last_basket.get(row["user_id"])
    if previous is not None:
        pairs.append((previous, current))
    last_basket[row["user_id"]] = current


def evaluate(fill):
    rows = []
    for k in K_VALUES:
        precision, recall, hits, count = 0, 0, 0, 0
        for previous, current in pairs:
            relevant = current - previous
            # baskets with no new products are skipped
            if not relevant:
                continue
            recs = recommend(previous, rules, popular, k, fill)
            recommended = {r["product_id"] for r in recs}
            correct = len(recommended & relevant)
            precision += correct / k
            recall += correct / len(relevant)
            hits += 1 if correct > 0 else 0
            count += 1
        if count == 0:
            print("WARNING: no usable (previous, current) basket pairs found.")
            continue
        rows.append({
            "K": k,
            "Precision@K": round(precision / count, 4),
            "Recall@K": round(recall / count, 4),
            "HitRate@K": round(hits / count, 4),
        })
    return pd.DataFrame(rows)


# Rules only shows how well the rules work alone;
# Hybrid is the final system (rules + popular fillers)
print(f"Usable user pairs: {len(pairs)}")
print("Rules only")
print(evaluate(False))
print()
print("Hybrid (rules + popular)")
print(evaluate(True))
