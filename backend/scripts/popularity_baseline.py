
import json
from collections import Counter
from pathlib import Path

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = PROJECT_ROOT / "Phase1" / "data" / "processed"
OUTPUT_DIR = (PROJECT_ROOT / "backend" / "data" / "processed" / "popularity_baseline")

K_VALUES = [5, 10, 20]


def parse_products(product_string):
    products = set()

    for product in str(product_string).split("|"):
        if product:
            products.add(int(product))

    return products


def create_chronological_split():
    baskets = pd.read_csv(DATA_DIR / "baskets.csv")
    orders = pd.read_csv(DATA_DIR / "orders.csv")

    merged = baskets.merge(orders[["order_id", "user_id", "order_number"]], on="order_id", how="inner", suffixes=("_basket", "_order"), validate="one_to_one")

    if not (merged["user_id_basket"] == merged["user_id_order"]).all():
        raise ValueError("User ID mismatch found.")

    user_counts = merged.groupby("user_id_basket").size()

    eligible_users = user_counts[user_counts >= 2].index
    eligible_baskets = merged[merged["user_id_basket"].isin(eligible_users)].sort_values(["user_id_basket", "order_number"])

    test_df = eligible_baskets.groupby("user_id_basket").tail(1)
    train_df = merged.drop(index=test_df.index)

    latest_train_df = train_df.sort_values(["user_id_basket", "order_number"]).groupby("user_id_basket").tail(1)

    return train_df, latest_train_df, test_df


def calculate_product_popularity(train_df):
    product_counts = Counter()

    for product_string in train_df["product_ids"]:
        products = parse_products(product_string)

        for product_id in products:
            product_counts[product_id] += 1

    # Sort by frequency descending.
    # Product ID ascending provides deterministic tie-breaking.
    ranked_products = sorted(product_counts.items(), key=lambda item: (-item[1], item[0]))

    return ranked_products, product_counts


def evaluate_popularity(ranked_products, latest_train_df, test_df, training_basket_count):
    previous_baskets = {}
    next_baskets = {}

    for _, row in latest_train_df.iterrows():
        user_id = int(row["user_id_basket"])

        previous_baskets[user_id] = parse_products(row["product_ids"])

    for _, row in test_df.iterrows():
        user_id = int(row["user_id_basket"])

        next_baskets[user_id] = parse_products(row["product_ids"])

    if not set(next_baskets).issubset(set(previous_baskets)):
        raise ValueError("A test user does not have a previous training basket.")

    per_user_results = []

    for user_id, actual_products in next_baskets.items():

        previous_products = previous_baskets[user_id]

        # Exclude products already purchased in the latet training basket.
        recommendations = []

        for product_id, frequency in ranked_products:

            if product_id not in previous_products:
                recommendations.append(product_id)

            if len(recommendations) == max(K_VALUES):
                break

        relevant_products = actual_products - previous_products

        user_result = {
            "user_id": user_id,
            "actual_basket_size": len(actual_products),
            "context_basket_size": len(previous_products),
            "relevant_products": len(relevant_products)
        }

        for k in K_VALUES:

            recommended = set(recommendations[:k])
            matched = recommended.intersection(relevant_products)
            precision = len(matched) / k

            if len(relevant_products) > 0:
                recall = len(matched) / len(relevant_products)
            else:
                recall = 0.0

            if len(matched) > 0:
                hit_rate = 1.0
            else:
                hit_rate = 0.0

            user_result["precision_at_" + str(k)] = precision
            user_result["recall_at_" + str(k)] = recall
            user_result["hit_rate_at_" + str(k)] = hit_rate

        per_user_results.append(user_result)

    per_user_df = pd.DataFrame(per_user_results)

    summary_results = []

    for k in K_VALUES:

        precision_column = "precision_at_" + str(k)
        recall_column = "recall_at_" + str(k)
        hit_column = "hit_rate_at_" + str(k)

        summary_results.append({"k": k, "precision_at_k": float(per_user_df[precision_column].mean()), "recall_at_k": float( per_user_df[recall_column].mean()),
            "hit_rate_at_k": float(per_user_df[hit_column].mean())})

    summary_df = pd.DataFrame(summary_results)

    summary = {
        "training_baskets": training_basket_count,
        "test_baskets": len(test_df),
        "test_users": len(next_baskets),
        "unique_products_in_training": len(ranked_products),
        "recommendation_method": "global_product_popularity",
        "excludes_latest_training_basket_products": True,
        "relevant_products_definition": ("test basket products excluding products in the latest training basket"),
        "precision_denominator": "K",
        "k_values": K_VALUES
    }

    return summary, summary_df, per_user_df


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("Creating chronological split...")
    train_df, latest_train_df, test_df = (create_chronological_split())

    print("Training baskets:", len(train_df))
    print("Testing baskets:", len(test_df))
    print("Test users:", test_df["user_id_basket"].nunique())

    print("\nCalculating product popularity from training baskets...")
    ranked_products, product_counts = calculate_product_popularity(train_df)
    print("Unique products in training:", len(ranked_products))
    print("\nTop 10 most popular training products:")

    for product_id, frequency in ranked_products[:10]:
        print("Product ID:", product_id, "| Baskets:", frequency)

    print("\nEvaluating popularity recommendations...")

    summary, summary_df, per_user_df = evaluate_popularity(ranked_products, latest_train_df, test_df, len(train_df))

    summary_path = OUTPUT_DIR / "popularity_summary.json"
    metrics_path = OUTPUT_DIR / "popularity_metrics.csv"
    users_path = OUTPUT_DIR / "per_user_popularity_results.csv"

    with open(summary_path, "w", encoding="utf-8") as file:
        json.dump(summary, file, indent=4)

    summary_df.to_csv(metrics_path, index=False)
    per_user_df.to_csv(users_path, index=False)

    print("\n" + "=" * 55)
    print("POPULARITY BASELINE EVALUATION")
    print("=" * 55)

    for key, value in summary.items():
        print(key + ":", value)

    print("\nEvaluation metrics:")
    print(summary_df.to_string(index=False))

    print("\nSaved:")
    print(summary_path)
    print(metrics_path)
    print(users_path)


if __name__ == "__main__":
    main()
