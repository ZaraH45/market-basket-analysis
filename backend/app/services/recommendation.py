
import pandas as pd
from collections import Counter, defaultdict
from pathlib import Path

from app.services.pairings import DEPARTMENT_PAIRINGS, PAIRINGS

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


def get_popular_counts(baskets_df):
    counts = Counter()

    for text in baskets_df["product_ids"]:
        counts.update(split_ids(text))

    ranked_products = sorted(
        counts.items(),
        key=lambda item: (-item[1], item[0])
    )

    return ranked_products


def get_popular(baskets_df):
    ranked_products = get_popular_counts(baskets_df)

    popular = []

    for product_id, frequency in ranked_products:
        popular.append(product_id)

    return popular


def build_cooccurrence(baskets_df, min_pair_count=3):
    """Learn from the baskets which products are bought together.

    Association rules only cover a few dozen products. This table covers EVERY
    product that appears in the baskets, so the website can always give
    personal suggestions. Returns (partners, item_counts, n_baskets), where
    partners[a][b] = number of baskets containing both a and b.
    """
    item_counts = Counter()
    pair_counts = Counter()
    n_baskets = 0

    for text in baskets_df["product_ids"]:
        items = sorted(split_ids(text))
        n_baskets += 1
        item_counts.update(items)
        for i, a in enumerate(items):
            for b in items[i + 1:]:
                pair_counts[(a, b)] += 1

    partners = defaultdict(dict)
    for (a, b), count in pair_counts.items():
        if count >= min_pair_count:
            partners[a][b] = count
            partners[b][a] = count

    return {"partners": partners, "item_counts": item_counts, "n_baskets": n_baskets}


def cooccurrence_candidates(basket, cooc, exclude):
    """Score products by how often they appear with the items in the cart."""
    partners = cooc["partners"]
    item_counts = cooc["item_counts"]
    n = cooc["n_baskets"]
    scored = {}

    for a in basket:
        for b, pair in partners.get(a, {}).items():
            if b in exclude:
                continue
            expected = item_counts[a] * item_counts[b] / n
            lift = pair / expected if expected else 0.0
            confidence = pair / item_counts[a]
            # "shrunk" lift: rare products need real evidence to rank high
            score = pair / (expected + 2.0)
            entry = scored.setdefault(b, {"score": 0.0, "best": None, "triggers": []})
            entry["score"] += score
            entry["triggers"].append(a)
            if entry["best"] is None or score > entry["best"][0]:
                entry["best"] = (score, confidence, lift, pair / n)

    return scored


def build_similar(catalog_df, popular, baskets_df=None, min_aisle_pair=20, top_aisles=3):
    """Aisle knowledge, used for products with little or no basket history.

    by_aisle    : products of each aisle, most popular first.
    complements : for each aisle, the OTHER aisles shoppers most often buy together
                  with it (learned from the baskets), e.g. chips -> soft drinks.
    """
    rank = {pid: i for i, pid in enumerate(popular)}
    aisle_of = dict(zip(catalog_df["product_id"], catalog_df["aisle"].fillna("Unknown")))
    dept_of = (dict(zip(catalog_df["product_id"], catalog_df["department"].fillna("Unknown")))
               if "department" in catalog_df.columns else {})
    by_aisle = defaultdict(list)
    for pid, aisle in aisle_of.items():
        if pid in rank:
            by_aisle[aisle].append(pid)
    for aisle in by_aisle:
        by_aisle[aisle].sort(key=lambda p: rank[p])

    complements = {}
    if baskets_df is not None:
        aisle_counts = Counter()
        pair_counts = Counter()
        n = 0
        for text in baskets_df["product_ids"]:
            aisles = sorted({aisle_of[i] for i in split_ids(text) if i in aisle_of})
            n += 1
            aisle_counts.update(aisles)
            for i, x in enumerate(aisles):
                for y in aisles[i + 1:]:
                    pair_counts[(x, y)] += 1
        scored = defaultdict(list)
        for (x, y), pair in pair_counts.items():
            if pair < min_aisle_pair:
                continue
            for a, b in ((x, y), (y, x)):
                confidence = pair / aisle_counts[a]
                lift = pair * n / (aisle_counts[a] * aisle_counts[b])
                # geometric mean of "how often" and "how much more than chance"
                scored[a].append(((confidence * lift) ** 0.5, b))
        for a, items in scored.items():
            items.sort(key=lambda t: -t[0])
            complements[a] = [b for _, b in items[:top_aisles]]

    return {"aisle_of": aisle_of, "dept_of": dept_of, "by_aisle": by_aisle, "complements": complements}


def load_names():
    catalog = pd.read_csv(CATALOG_PATH)

    return dict(zip(catalog["product_id"], catalog["product_name"]))


def recommend(basket, rules, popular, k=10, fill=True, names=None, cooc=None, similar=None):
    basket = set(basket)

    if names is None:
        names = {}

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

        antecedents = sorted(row["antecedents"])

        for product_id in row["consequents"]:

            if product_id in basket:
                continue

            if product_id not in candidate_scores:
                candidate_scores[product_id] = {
                    "score": score,
                    "antecedents": antecedents
                }

            elif score > candidate_scores[product_id]["score"]:
                candidate_scores[product_id] = {
                    "score": score,
                    "antecedents": antecedents
                }

    ranked_candidates = sorted(
        candidate_scores.items(),
        key=lambda item: (
            -item[1]["score"][0],
            -item[1]["score"][1],
            -item[1]["score"][2],
            item[0]
        )
    )

    results = []

    for product_id, candidate in ranked_candidates[:k]:
        score = candidate["score"]
        antecedents = candidate["antecedents"]

        trigger_names = []

        for antecedent_id in antecedents:
            trigger_names.append(
                names.get(antecedent_id, f"Product {antecedent_id}")
            )

        product_name = names.get(product_id, f"Product {product_id}")
        trigger_text = ", ".join(trigger_names)

        results.append({
            "product_id": int(product_id),
            "confidence": score[0],
            "lift": score[1],
            "support": score[2],
            "source": "rule",
            "explanation": (
                f"Your basket includes {trigger_text}. "
                f"This association rule links these products "
                f"with {product_name}."
            ),
            "triggered_by": trigger_names
        })

    seen = set(basket)

    for item in results:
        seen.add(item["product_id"])

    # Layer 1b: hand-written "goes well with" pairings (bread -> butter, jam, cheese ...)
    if similar is not None and len(results) < k:
        lower_aisles = {name.lower(): name for name in similar["by_aisle"]}
        pairing_cap = len(results) + max(2, k // 2)
        for a in sorted(basket):
            aisle = similar["aisle_of"].get(a)
            partners_list = PAIRINGS.get(str(aisle).lower()) or DEPARTMENT_PAIRINGS.get(
                str(similar.get("dept_of", {}).get(a)).lower(), [])
            for partner in partners_list:
                if len(results) >= min(k, pairing_cap):
                    break
                real_aisle = lower_aisles.get(partner)
                if real_aisle is None:
                    continue
                for product_id in similar["by_aisle"][real_aisle]:
                    if product_id in seen:
                        continue
                    seen.add(product_id)
                    results.append({
                        "product_id": int(product_id),
                        "confidence": None,
                        "lift": None,
                        "support": None,
                        "source": "pairing",
                        "explanation": (
                            f"Goes well with {names.get(a, f'Product {a}')}: "
                            f"{partner} is usually bought or eaten together with {aisle}."
                        ),
                        "triggered_by": [names.get(a, f"Product {a}")]
                    })
                    break

    # Layer 2: products bought together with the cart items (covers all products)
    cooc_cap = len(results) + max(2, k // 3)   # leave room for category suggestions
    if cooc is not None and len(results) < k:
        candidates = cooccurrence_candidates(basket, cooc, seen)
        ranked = sorted(candidates.items(), key=lambda kv: (-kv[1]["score"], kv[0]))
        for product_id, cand in ranked:
            if len(results) >= min(k, cooc_cap):
                break
            seen.add(product_id)
            trigger_names = [names.get(t, f"Product {t}") for t in sorted(cand["triggers"])[:3]]
            product_name = names.get(product_id, f"Product {product_id}")
            _, confidence, lift, support = cand["best"]
            results.append({
                "product_id": int(product_id),
                "confidence": confidence,
                "lift": lift,
                "support": support,
                "source": "cooccurrence",
                "explanation": (
                    f"Shoppers who bought {', '.join(trigger_names)} "
                    f"often bought {product_name} in the same basket."
                ),
                "triggered_by": trigger_names
            })

    # Layer 3: popular products from aisles that are usually bought WITH the cart items
    if similar is not None and len(results) < k:
        for a in sorted(basket):
            aisle = similar["aisle_of"].get(a)
            for other in similar["complements"].get(aisle, []):
                taken = 0
                for product_id in similar["by_aisle"].get(other, []):
                    if len(results) >= k or taken >= 2:
                        break
                    if product_id in seen:
                        continue
                    seen.add(product_id)
                    taken += 1
                    results.append({
                        "product_id": int(product_id),
                        "confidence": None,
                        "lift": None,
                        "support": None,
                        "source": "category",
                        "explanation": (
                            f"Shoppers who buy {names.get(a, f'Product {a}')} "
                            f"(aisle: {aisle}) often also buy from the "
                            f"'{other}' aisle."
                        ),
                        "triggered_by": [names.get(a, f"Product {a}")]
                    })

    # Layer 4: popular products from the same aisle as the cart items
    if similar is not None and len(results) < k:
        for a in sorted(basket):
            aisle = similar["aisle_of"].get(a)
            for product_id in similar["by_aisle"].get(aisle, [])[:k + len(basket) + 5]:
                if len(results) >= k:
                    break
                if product_id in seen:
                    continue
                seen.add(product_id)
                results.append({
                    "product_id": int(product_id),
                    "confidence": None,
                    "lift": None,
                    "support": None,
                    "source": "similar",
                    "explanation": (
                        f"Similar item: popular in the same aisle ({aisle}) as "
                        f"{names.get(a, f'Product {a}')}."
                    ),
                    "triggered_by": [names.get(a, f"Product {a}")]
                })

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
                    "source": "popular",
                    "explanation": (
                        "Added as a popularity-based fallback "
                        "based on how often this product appears "
                        "across shoppers' baskets."
                    ),
                    "triggered_by": []
                })

    return results
