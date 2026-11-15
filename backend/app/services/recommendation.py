import pandas as pd
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]

#the API uses FP-Growth rules. Run association_mining.py first to create this file.
RULES_PATH = ROOT / "backend" / "data" / "processed" / "association_mining" / "fpgrowth_association_rules.csv"

# Phase 1 files are read from Phase1/data/processed, same as association_mining.py.
BASKETS_PATH = ROOT / "Phase1" / "data" / "processed" / "baskets.csv"
CATALOG_PATH = ROOT / "Phase1" / "data" / "processed" / "product_catalog.csv"


def split_ids(text):
    # "12|45|78" -> frozenset({12, 45, 78}) (same "|" format as association_mining.py)
    return frozenset(int(x) for x in str(text).split("|"))


def prepare_rules(rules):
    rules = rules.copy()
    rules["antecedents"] = rules["antecedent_ids"].apply(split_ids)
    rules["consequents"] = rules["consequent_ids"].apply(split_ids)

    return rules.sort_values(["confidence", "lift", "support"], ascending=False)


def load_rules():
    return prepare_rules(pd.read_csv(RULES_PATH))


def get_popular(baskets_df):
    counts = Counter()
    for text in baskets_df["product_ids"]:
        counts.update(split_ids(text))
    return [product for product, _ in counts.most_common()]


def load_names():
    catalog = pd.read_csv(CATALOG_PATH)
    return dict(zip(catalog["product_id"], catalog["product_name"]))


def recommend(basket, rules, popular, k=10, fill=True):
    basket = set(basket)

    matched = rules[rules["antecedents"].apply(lambda a: a.issubset(basket))]

    results = []
    seen = set(basket)


    for _, row in matched.iterrows():
        for product in row["consequents"]:
            if product not in seen:
                seen.add(product)
                results.append({
                    "product_id": int(product),
                    "confidence": float(row["confidence"]),
                    "lift": float(row["lift"]),
                    "support": float(row["support"]),
                    "source": "rule",
                })

    results = results[:k]

    if fill:
        for product in popular:
            if len(results) >= k:
                break
            if product not in seen:
                seen.add(product)
                results.append({
                    "product_id": int(product),
                    "confidence": None,
                    "lift": None,
                    "support": None,
                    "source": "popular",
                })

    return results
