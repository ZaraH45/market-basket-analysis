
import sys
import json
import pandas as pd
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.services.association_mining import (
    load_data,
    mine_association_patterns,
    DEFAULT_BASKETS_PATH
)

from app.services.recommendation import (
    prepare_rules,
    get_popular,
    split_ids,
    recommend
)


K_VALUES = [5, 10]

ROOT = Path(__file__).resolve().parents[2]
ORDERS_PATH = ROOT / "Phase1" / "data" / "raw" / "orders.csv"

OUTPUT_DIR = (
    Path(__file__).resolve().parents[1]
    / "data"
    / "processed"
    / "per_user_recommendation_evaluation"
)


def create_evaluation_split():
    baskets = pd.read_csv(DEFAULT_BASKETS_PATH)

    orders = pd.read_csv(ORDERS_PATH)

    prior_orders = orders[
        orders["eval_set"] == "prior"
    ][["order_id", "user_id", "order_number"]].copy()

    merged = baskets.merge(
        prior_orders,
        on=["order_id", "user_id"],
        how="left",
        validate="one_to_one"
    )

    if merged["order_number"].isna().any():
        raise ValueError(
            "Some sampled baskets could not be matched "
            "to their original prior order records."
        )

    merged = merged.sort_values(
        ["user_id", "order_number", "order_id"]
    ).reset_index(drop=True)

    user_counts = merged.groupby("user_id").size()

    eligible_users = user_counts[
        user_counts >= 2
    ].index

    eligible_baskets = merged[
        merged["user_id"].isin(eligible_users)
    ]

    test_df = (
        eligible_baskets
        .groupby("user_id", sort=False)
        .tail(1)
        .copy()
    )

    train_df = merged.drop(
        index=test_df.index
    ).copy()

    train_df = train_df.reset_index(drop=True)
    test_df = test_df.reset_index(drop=True)

    return train_df, test_df, len(merged), len(eligible_users)


def create_test_pairs(train_df, test_df):
    previous_baskets = {}

    latest_training_baskets = (
        train_df
        .sort_values(["user_id", "order_number"])
        .groupby("user_id", sort=False)
        .tail(1)
    )

    for _, row in latest_training_baskets.iterrows():
        previous_baskets[row["user_id"]] = split_ids(
            row["product_ids"]
        )

    pairs = []

    for _, row in test_df.iterrows():
        user_id = row["user_id"]

        previous = previous_baskets.get(user_id)

        current = split_ids(row["product_ids"])

        if previous is None:
            continue

        pairs.append((previous, current))

    return pairs


def evaluate_methods(pairs, rules, popular):
    results = []

    methods = ["popularity", "rules", "hybrid"]

    for method in methods:
        for k in K_VALUES:

            precision_total = 0.0
            recall_total = 0.0
            hits = 0
            evaluated_cases = 0

            for previous, current in pairs:

                relevant = current - previous

                if not relevant:
                    continue

                if method == "popularity":

                    recommended = []

                    for product_id in popular:
                        if product_id not in previous:
                            recommended.append(product_id)

                        if len(recommended) == k:
                            break

                elif method == "rules":

                    recommendations = recommend(
                        previous,
                        rules,
                        popular,
                        k=k,
                        fill=False
                    )

                    recommended = [
                        item["product_id"]
                        for item in recommendations
                    ]

                else:

                    recommendations = recommend(
                        previous,
                        rules,
                        popular,
                        k=k,
                        fill=True
                    )

                    recommended = [
                        item["product_id"]
                        for item in recommendations
                    ]

                recommended_set = set(recommended[:k])

                correct = len(
                    recommended_set.intersection(relevant)
                )

                # Precision@K uses K as the denominator,
                # including when fewer than K recommendations exist.
                precision_total += correct / k

                recall_total += correct / len(relevant)

                if correct > 0:
                    hits += 1

                evaluated_cases += 1

            if evaluated_cases == 0:
                raise ValueError(
                    "No test cases with new products were available."
                )

            results.append({
                "method": method,
                "k": k,
                "precision_at_k": round(
                    precision_total / evaluated_cases, 4
                ),
                "recall_at_k": round(
                    recall_total / evaluated_cases, 4
                ),
                "hit_rate_at_k": round(
                    hits / evaluated_cases, 4
                ),
                "evaluated_cases": evaluated_cases
            })

    return pd.DataFrame(results)


def main():

    print("Creating per-user evaluation split...")

    train_df, test_df, total_baskets, eligible_users = (
        create_evaluation_split()
    )

    print("\n========== EVALUATION SPLIT ==========")
    print(f"Total sampled baskets: {total_baskets}")
    print(f"Training baskets: {len(train_df)}")
    print(f"Held-out baskets: {len(test_df)}")
    print(f"Eligible test users: {eligible_users}")

    pairs = create_test_pairs(train_df, test_df)

    print(f"Available user pairs: {len(pairs)}")

    print("\nMining association rules using training baskets only...")

    transactions = [
        list(split_ids(text))
        for text in train_df["product_ids"]
    ]

    _, product_names = load_data()

    mining_result = mine_association_patterns(
        transactions,
        product_names,
        algorithm="fpgrowth",
        min_support=0.005,
        min_confidence=0.20,
        min_lift=1.0,
        max_len=3
    )

    rules = prepare_rules(
        mining_result["association_rules"]
    )

    popular = get_popular(train_df)

    print(f"Rules mined: {len(rules)}")

    print("\nEvaluating recommendation methods...")

    results = evaluate_methods(
        pairs,
        rules,
        popular
    )

    print("\n========== CORRECTED RESULTS ==========")
    print(results.to_string(index=False))

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    csv_path = OUTPUT_DIR / "recommendation_results.csv"
    json_path = OUTPUT_DIR / "recommendation_summary.json"

    results.to_csv(
        csv_path,
        index=False
    )

    evaluated_cases = (
        results["evaluated_cases"].iloc[0]
    )

    summary = {
        "evaluation_method": (
            "Per-user leave-last-observed-sampled-basket-out"
        ),
        "description": (
            "For each user with at least two sampled baskets, "
            "the latest sampled basket by original order_number "
            "is held out. All other sampled baskets are used "
            "for training."
        ),
        "important_limitation": (
            "The source dataset is a deterministic random sample "
            "of prior orders. The held-out basket is the latest "
            "observed sampled basket, not necessarily the user's "
            "next consecutive real-world basket. This is not a "
            "global chronological split across users."
        ),
        "total_sampled_baskets": total_baskets,
        "training_baskets": len(train_df),
        "held_out_baskets": len(test_df),
        "eligible_test_users": eligible_users,
        "available_user_pairs": len(pairs),
        "evaluated_cases": int(evaluated_cases),
        "algorithm": "fpgrowth",
        "min_support": 0.005,
        "min_confidence": 0.20,
        "min_lift": 1.0,
        "max_len": 3,
        "rules_mined": len(rules),
        "k_values": K_VALUES,
        "precision_denominator": "K",
        "results": results.to_dict(orient="records")
    }

    with open(
        json_path,
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(
            summary,
            file,
            indent=4
        )

    print("\n========== SAVED RESULTS ==========")
    print(csv_path)
    print(json_path)


if __name__ == "__main__":
    main()
