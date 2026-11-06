
import json
import pandas as pd
from pathlib import Path
from backend.app.services.association_mining import (mine_association_patterns)


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = PROJECT_ROOT / "Phase1" / "data" / "processed"

OUTPUT_DIR = (PROJECT_ROOT / "backend" / "data" / "processed" / "association_rule_topk_evaluation")

MIN_SUPPORT = 0.005
MIN_CONFIDENCE = 0.20
MIN_LIFT = 1.0
MAX_LEN = 3

K_VALUES = [5, 10, 20]


def parse_products(product_string):
    products = set()

    for product in str(product_string).split("|"):
        if product:
            products.add(int(product))

    return products


def load_product_names():
    catalog = pd.read_csv(DATA_DIR / "product_catalog.csv")

    product_names = {}

    for _, row in catalog.iterrows():
        product_id = int(row["product_id"])
        product_name = str(row["product_name"])
        product_names[product_id] = product_name

    return product_names


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


def prepare_user_baskets(latest_train_df, test_df):
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

    return previous_baskets, next_baskets


def prepare_rule_records(rules_df):
    rule_records = []

    for _, rule in rules_df.iterrows():

        antecedents = parse_products(rule["antecedent_ids"])
        consequents = parse_products(rule["consequent_ids"])

        rule_records.append({
            "antecedents": antecedents,
            "consequents": consequents,
            "confidence": float(rule["confidence"]),
            "lift": float(rule["lift"]),
            "support": float(rule["support"])
        })

    return rule_records


def generate_recommendations(previous_products, rule_records):

    # Each product stores its strongest activated rule score.
    # Score priority: confidence, then lift, then support.
    candidate_scores = {}
    activated_rules = 0

    for rule in rule_records:

        if rule["antecedents"].issubset(previous_products):

            activated_rules += 1
            score = (rule["confidence"], rule["lift"], rule["support"])

            for product_id in rule["consequents"]:

                # Do not recommend products already in context.
                if product_id in previous_products:
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

    recommendations = []

    for product_id, score in ranked_candidates:
        recommendations.append(product_id)

    return recommendations, activated_rules


def evaluate_association_rules(rules_df, latest_train_df, test_df, product_names, training_basket_count):

    previous_baskets, next_baskets = prepare_user_baskets(latest_train_df, test_df)
    rule_records = prepare_rule_records(rules_df)
    per_user_results = []

    users_with_activated_rules = 0
    users_with_recommendations = 0
    total_activated_rules = 0
    total_recommended_candidates = 0

    for user_id, actual_products in next_baskets.items():

        previous_products = previous_baskets[user_id]

        # Evaluate only products that were not already present in the user's latest training basket.
        relevant_products = actual_products - previous_products
        recommendations, activated_rules = generate_recommendations(previous_products, rule_records)

        total_activated_rules += activated_rules
        total_recommended_candidates += len(recommendations)

        if activated_rules > 0:
            users_with_activated_rules += 1

        if len(recommendations) > 0:
            users_with_recommendations += 1

        user_result = {
            "user_id": user_id,
            "actual_basket_size": len(actual_products),
            "context_basket_size": len(previous_products),
            "relevant_products": len(relevant_products),
            "activated_rules": activated_rules,
            "candidate_products": len(recommendations),
            "top_20_product_ids": "|".join(str(product_id)
                for product_id in recommendations[:20]),
            "top_20_product_names": "|".join(product_names.get(product_id, str(product_id))
                for product_id in recommendations[:20])
        }

        for k in K_VALUES:

            recommended = set(recommendations[:k])

            matched = recommended.intersection(relevant_products)

            # K remains the denominator even when fewer than K candidate recommendations are available.
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

        summary_results.append({"k": k, "precision_at_k": float(per_user_df[precision_column].mean()),
            "recall_at_k": float(per_user_df[recall_column].mean()),
            "hit_rate_at_k": float(per_user_df[hit_column].mean())
        })

    summary_df = pd.DataFrame(summary_results)

    test_count = len(test_df)

    summary = {
        "training_baskets": training_basket_count,
        "test_baskets": test_count,
        "test_users": len(next_baskets),
        "rules_mined": len(rules_df),
        "users_with_activated_rules": users_with_activated_rules,
        "users_with_recommendations": users_with_recommendations,
        "rule_activation_coverage": (users_with_activated_rules / test_count
            if test_count > 0 else 0.0),
        "recommendation_coverage": (users_with_recommendations / test_count
            if test_count > 0 else 0.0),
        "total_rule_activations": total_activated_rules,
        "total_user_candidate_recommendations": total_recommended_candidates,
        "mean_candidate_products_per_test_user": (total_recommended_candidates / test_count
            if test_count > 0 else 0.0),
        "recommendation_method": ("activated_association_rules_ranked_by_confidence_lift_support"),
        "excludes_latest_training_basket_products": True,
        "relevant_products_definition": ("test basket products excluding products in latest training basket"),
        "precision_denominator": "K",
        "k_values": K_VALUES
    }

    return summary, summary_df, per_user_df


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("Loading product catalog...")
    product_names = load_product_names()
    print("Creating chronological split...")

    train_df, latest_train_df, test_df = (create_chronological_split())

    train_transactions = []

    for product_string in train_df["product_ids"]:
        train_transactions.append(sorted(parse_products(product_string)))

    print("Training baskets:", len(train_transactions))
    print("Testing baskets:", len(test_df))
    print("Test users:", test_df["user_id_basket"].nunique())

    print("\nMining association rules using training baskets only...")

    result = mine_association_patterns(
        transactions=train_transactions,
        product_names=product_names,
        algorithm="fpgrowth",
        min_support=MIN_SUPPORT,
        min_confidence=MIN_CONFIDENCE,
        min_lift=MIN_LIFT,
        max_len=MAX_LEN
    )

    print("\nGenerating and evaluating Top-K recommendations...")

    summary, summary_df, per_user_df = (evaluate_association_rules(result["association_rules"], latest_train_df, test_df, product_names, len(train_df)))

    summary.update({
        "algorithm": "fpgrowth",
        "min_support": MIN_SUPPORT,
        "min_confidence": MIN_CONFIDENCE,
        "min_lift": MIN_LIFT,
        "max_len": MAX_LEN
    })

    summary_path = OUTPUT_DIR / "association_topk_summary.json"
    metrics_path = OUTPUT_DIR / "association_topk_metrics.csv"
    users_path = OUTPUT_DIR / "per_user_association_results.csv"

    with open(summary_path, "w", encoding="utf-8") as file:
        json.dump(summary, file, indent=4)

    summary_df.to_csv(metrics_path, index=False)
    per_user_df.to_csv(users_path, index=False)

    print("\n" + "=" * 60)
    print("ASSOCIATION RULE TOP-K EVALUATION")
    print("=" * 60)

    for key, value in summary.items():
        print(key + ":", value)

    print("\nRecommendation metrics:")
    print(summary_df.to_string(index=False))

    print("\nSaved:")
    print(summary_path)
    print(metrics_path)
    print(users_path)


if __name__ == "__main__":
    main()
