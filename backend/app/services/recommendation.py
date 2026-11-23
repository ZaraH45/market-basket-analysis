
import pandas as pd
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]

RULES_PATH = ROOT / "backend" / "data" / "processed" / "association_mining" / "fpgrowth_association_rules.csv"

BASKETS_PATH = ROOT / "Phase1" / "data" / "processed" / "baskets.csv"
CATALOG_PATH = ROOT / "Phase1" / "data" / "processed" / "product_catalog.csv"


def split_ids(text):
    return frozenset(int(x) for x in str(text).split("|"))


def prepare_rules(rules):
    rules = rules.copy()

    rules["antecedents"] = rules["antecedent_ids"].apply(split_ids)
    rules["consequents"] = rules["consequent_ids"].apply(split_ids)

    return rules.sort_values(
        ["confidence", "lift", "support"],
        ascending=False
    )


def load_rules():
    return prepare_rules(pd.read_csv(RULES_PATH))


def get_popular(baskets_df):
    counts = Counter()

    for text in baskets_df["product_ids"]:
        counts.update(split_ids(text))

    ranked_products = sorted(
        counts.items(),
        key=lambda item: (-item[1], item[0])
    )

    popular = []

    for product_id, frequency in ranked_products:
        popular.append(product_id)

    return popular


def load_names():
    catalog = pd.read_csv(CATALOG_PATH)

    return dict(zip(catalog["product_id"], catalog["product_name"]))


def recommend(basket, rules, popular, k=10, fill=True):
    basket = set(basket)

    candidate_scores = {}

    matched = rules[
        rules["antecedents"].apply(
            lambda antecedents: antecedents.issubset(basket)
        )
    ]

    for _, row in matched.iterrows():
        score = (
            float(row["confidence"]),
            float(row["lift"]),
            float(row["support"])
        )

        for product_id in row["consequents"]:

            if product_id in basket:
                continue

            if product_id not in candidate_scores:
                candidate_scores[product_id] = score

            elif score > candidate_scores[product_id]:
                candidate_scores[product_id] = score

    ranked_candidates = sorted(
        candidate_scores.items(),
        key=lambda item: (
            -item[1][0],
            -item[1][1],
            -item[1][2],
            item[0]
        )
    )

    results = []

    for product_id, score in ranked_candidates[:k]:
        results.append({
            "product_id": int(product_id),
            "confidence": score[0],
            "lift": score[1],
            "support": score[2],
            "source": "rule"
        })

    seen = set(basket)

    for item in results:
        seen.add(item["product_id"])

    if fill:
        for product_id in popular:

            if len(results) >= k:
                break

            if product_id not in seen:
                seen.add(product_id)

                results.append({
                    "product_id": int(product_id),
                    "confidence": None,
                    "lift": None,
                    "support": None,
                    "source": "popular"
                })

    return results
