
import json
import pandas as pd
from pathlib import Path
from backend.app.services.association_mining import mine_association_patterns


PROJECT_ROOT = Path(__file__).resolve().parents[2]

BASKETS_PATH = PROJECT_ROOT / "Phase1" / "data" / "processed" / "baskets.csv"
ORDERS_PATH = PROJECT_ROOT / "Phase1" / "data" / "processed" / "orders.csv"
CATALOG_PATH = PROJECT_ROOT / "Phase1" / "data" / "processed" / "product_catalog.csv"

OUTPUT_DIR = (PROJECT_ROOT / "backend" / "data" / "processed" / "hybrid_recommendation_evaluation")

MIN_SUPPORT = 0.005
MIN_CONFIDENCE = 0.20
MIN_LIFT = 1.0
MAX_LEN = 3

K_VALUES = [5, 10, 20]


def parse_product_ids(value):
    product_ids = set()

    if pd.isna(value):
        return product_ids

    for product_id in str(value).split("|"):
        product_id = product_id.strip()

        if product_id:
            product_ids.add(int(product_id))

    return product_ids


def load_project_data():
    baskets = pd.read_csv(BASKETS_PATH)
    orders = pd.read_csv(ORDERS_PATH)
    catalog = pd.read_csv(CATALOG_PATH)

    required_basket_columns = {"order_id", "user_id", "product_ids"}
    required_order_columns = {"order_id", "user_id", "order_number"}
    required_catalog_columns = {"product_id", "product_name"}

    if not required_basket_columns.issubset(baskets.columns):
        raise ValueError("Required columns are missing from baskets.csv.")

    if not required_order_columns.issubset(orders.columns):
        raise ValueError("Required columns are missing from orders.csv.")

    if not required_catalog_columns.issubset(catalog.columns):
        raise ValueError("Required columns are missing from product_catalog.csv.")

    product_names = {}

    for _, row in catalog.iterrows():
        product_id = int(row["product_id"])
        product_names[product_id] = str(row["product_name"])

    return baskets, orders, product_names



def create_chronological_split(baskets, orders):
    # user_id already exists in baskets.csv.
    # Merge only order_number to avoid duplicate user_id columns.
    merged = baskets.merge(orders[["order_id", "order_number"]], on="order_id", how="inner", validate="one_to_one")

    if len(merged) != len(baskets):
        raise ValueError("Some baskets could not be matched with their orders.")

    if merged["user_id"].isna().any():
        raise ValueError("Missing user IDs found in baskets.csv.")

    merged["product_set"] = merged["product_ids"].apply(parse_product_ids)
    merged = merged.sort_values(["user_id", "order_number", "order_id"]).reset_index(drop=True)

    train_rows = []
    test_rows = []

    context_by_user = {}
    target_by_user = {}

    for user_id, user_rows in merged.groupby("user_id", sort=False):

        user_rows = user_rows.reset_index(drop=True)

        # Users with only one sampled basket: Keep their basket in training.
        if len(user_rows) == 1:
            train_rows.append(user_rows.iloc[0])
            continue

        # Users with multiple sampled baskets: Hold out their latest basket for testing.
        test_row = user_rows.iloc[-1]
        context_row = user_rows.iloc[-2]

        test_rows.append(test_row)

        for index in range(len(user_rows) - 1):
            train_rows.append(user_rows.iloc[index])

        context_by_user[user_id] = set(context_row["product_set"])
        target_by_user[user_id] = set(test_row["product_set"])

    train_df = pd.DataFrame(train_rows).reset_index(drop=True)
    test_df = pd.DataFrame(test_rows).reset_index(drop=True)

    train_transactions = []

    for product_set in train_df["product_set"]:
        train_transactions.append(sorted(product_set))

    if len(train_df) == 0 or len(test_df) == 0:
        raise ValueError("The chronological split produced an empty dataset.")

    return (train_transactions, train_df, test_df, context_by_user, target_by_user)



def build_popularity_ranking(train_transactions):
    product_counts = {}

    for transaction in train_transactions:
        for product_id in transaction:

            if product_id not in product_counts:
                product_counts[product_id] = 0

            product_counts[product_id] += 1

    ranked_products = sorted(product_counts.keys(), key=lambda product_id: ( -product_counts[product_id], product_id))

    return ranked_products, product_counts


def build_rule_candidates(rules_df, context_products):
    best_scores = {}

    for _, rule in rules_df.iterrows():

        antecedent_ids = parse_product_ids(rule["antecedent_ids"])
        consequent_ids = parse_product_ids(rule["consequent_ids"])

        if not antecedent_ids.issubset(context_products):
            continue

        confidence = float(rule["confidence"])
        lift = float(rule["lift"])
        support = float(rule["support"])

        score = (confidence, lift, support)

        for product_id in consequent_ids:

            if product_id in context_products:
                continue

            if product_id not in best_scores:
                best_scores[product_id] = score

            elif score > best_scores[product_id]:
                best_scores[product_id] = score

    ranked_rule_products = sorted(best_scores.keys(), key=lambda product_id: (
            -best_scores[product_id][0], -best_scores[product_id][1], -best_scores[product_id][2], product_id))

    return ranked_rule_products


def build_recommendation_lists(rule_products, popularity_products, context_products):

    rule_only = []

    for product_id in rule_products:
        if product_id not in context_products:
            rule_only.append(product_id)

    popularity_only = []

    for product_id in popularity_products:
        if product_id not in context_products:
            popularity_only.append(product_id)

    hybrid = []
    already_added = set()

    for product_id in rule_only:

        if product_id not in already_added:
            hybrid.append(product_id)
            already_added.add(product_id)

    # Fill remaining positions using popularity.
    for product_id in popularity_only:

        if product_id not in already_added:
            hybrid.append(product_id)
            already_added.add(product_id)

    return rule_only, popularity_only, hybrid


def calculate_metrics(recommendations, relevant_products, k):

    top_k = recommendations[:k]
    hits = 0

    for product_id in top_k:
        if product_id in relevant_products:
            hits += 1

    if len(relevant_products) > 0:
        recall = hits / len(relevant_products)
    else:
        recall = 0.0

    precision = hits / k
    hit_rate = 1.0 if hits > 0 else 0.0

    return precision, recall, hit_rate


def evaluate_recommendations(user_ids, recommendations_by_user, context_by_user, target_by_user, method_name):

    per_user_results = []
    for user_id in user_ids:

        recommendations = recommendations_by_user[user_id]
        context_products = context_by_user[user_id]
        target_products = target_by_user[user_id]

        relevant_products = target_products - context_products

        user_result = {
            "user_id": user_id,
            "context_basket_size": len(context_products),
            "test_basket_size": len(target_products),
            "relevant_products": len(relevant_products),
            "candidate_count": len(recommendations)
        }

        for k in K_VALUES:

            precision, recall, hit_rate = calculate_metrics(recommendations, relevant_products, k)

            user_result[f"precision_at_{k}"] = precision
            user_result[f"recall_at_{k}"] = recall
            user_result[f"hit_rate_at_{k}"] = hit_rate

        user_result["top_20_product_ids"] = "|".join(str(product_id) for product_id in recommendations[:20])
        per_user_results.append(user_result)

    per_user_df = pd.DataFrame(per_user_results)

    metric_rows = []

    for k in K_VALUES:

        metric_rows.append({"method": method_name, "k": k,
            "precision_at_k": per_user_df[f"precision_at_{k}"].mean(),
            "recall_at_k": per_user_df[f"recall_at_{k}"].mean(),
            "hit_rate_at_k": per_user_df[f"hit_rate_at_{k}"].mean()
        })

    metrics_df = pd.DataFrame(metric_rows)
    return metrics_df, per_user_df


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("Loading project data..")
    baskets, orders, product_names = load_project_data()
    print("Creating chronological split..")

    (train_transactions, train_df, test_df, context_by_user, target_by_user) = create_chronological_split(baskets, orders)

    user_ids = list(target_by_user.keys())

    print(f"Training baskets: {len(train_transactions)}")
    print(f"Testing baskets: {len(test_df)}")
    print(f"Test users: {len(user_ids)}")

    print("\nMining association rules using training baskets only...")

    mining_result = mine_association_patterns(train_transactions, product_names, algorithm="fpgrowth", min_support=MIN_SUPPORT,
        min_confidence=MIN_CONFIDENCE, min_lift=MIN_LIFT, max_len=MAX_LEN)

    rules_df = mining_result["association_rules"]

    print(f"\nRules mined: {len(rules_df)}")

    print("\nBuilding popularity ranking from training baskets...")

    popularity_products, product_counts = build_popularity_ranking(train_transactions)

    rule_recommendations = {}
    popularity_recommendations = {}
    hybrid_recommendations = {}

    users_with_activated_rules = 0
    users_with_rule_recommendations = 0
    users_with_hybrid_recommendations = 0

    total_rule_activations = 0
    total_unique_rule_candidates = 0

    print("\nGenerating recommendations for test users...")

    for user_id in user_ids:

        context_products = context_by_user[user_id]
        has_activated_rule = False

        for _, rule in rules_df.iterrows():

            antecedent_ids = parse_product_ids(rule["antecedent_ids"])

            if antecedent_ids.issubset(context_products):
                has_activated_rule = True
                total_rule_activations += 1

        if has_activated_rule:
            users_with_activated_rules += 1

        rule_candidates = build_rule_candidates(rules_df, context_products)
        total_unique_rule_candidates += len(rule_candidates)

        (rule_only, popularity_only, hybrid) = build_recommendation_lists(rule_candidates, popularity_products, context_products)

        rule_recommendations[user_id] = rule_only
        popularity_recommendations[user_id] = popularity_only
        hybrid_recommendations[user_id] = hybrid

        if len(rule_only) > 0:
            users_with_rule_recommendations += 1

        if len(hybrid) > 0:
            users_with_hybrid_recommendations += 1

    print("\nEvaluating all three recommendation methods...")

    rule_metrics, rule_per_user = evaluate_recommendations(user_ids, rule_recommendations, context_by_user, target_by_user, "association_rules")
    popularity_metrics, popularity_per_user = evaluate_recommendations(user_ids, popularity_recommendations, context_by_user, target_by_user, "popularity")

    hybrid_metrics, hybrid_per_user = evaluate_recommendations(user_ids, hybrid_recommendations, context_by_user, target_by_user, "hybrid")

    all_metrics = pd.concat([popularity_metrics, rule_metrics, hybrid_metrics], ignore_index=True)

    metrics_path = OUTPUT_DIR / "hybrid_comparison_metrics.csv"
    all_metrics.to_csv(metrics_path, index=False)

    per_user_comparison = pd.DataFrame({"user_id": user_ids})

    method_results = [
        ("popularity", popularity_per_user),
        ("association_rules", rule_per_user),
        ("hybrid", hybrid_per_user)
    ]

    comparison_columns = [
        "candidate_count",
        "precision_at_5",
        "recall_at_5",
        "hit_rate_at_5",
        "precision_at_10",
        "recall_at_10",
        "hit_rate_at_10",
        "precision_at_20",
        "recall_at_20",
        "hit_rate_at_20",
        "top_20_product_ids"
    ]

    for method_name, method_df in method_results:

        method_df = method_df.set_index("user_id")

        for column in comparison_columns:

            per_user_comparison[f"{method_name}_{column}"] = (per_user_comparison["user_id"].map(method_df[column]))

    per_user_path = OUTPUT_DIR / "hybrid_per_user_comparison.csv"
    per_user_comparison.to_csv(per_user_path, index=False)

    summary = {
        "training_baskets": len(train_transactions),
        "test_baskets": len(test_df),
        "test_users": len(user_ids),
        "rules_mined": len(rules_df),
        "users_with_activated_rules": users_with_activated_rules,
        "users_with_rule_recommendations": users_with_rule_recommendations,
        "users_with_hybrid_recommendations": users_with_hybrid_recommendations,
        "rule_activation_coverage": (users_with_activated_rules / len(user_ids)),
        "rule_recommendation_coverage": (users_with_rule_recommendations / len(user_ids)),
        "hybrid_recommendation_coverage": (users_with_hybrid_recommendations / len(user_ids)),
        "total_rule_activations": total_rule_activations,
        "total_user_rule_candidate_recommendations": total_unique_rule_candidates,
        "popularity_products": len(popularity_products),
        "recommendation_method": ("association_rules_first_then_popularity_fallback"),
        "ranking": [
            "association-rule confidence descending",
            "association-rule lift descending",
            "association-rule support descending",
            "product ID ascending for rule ties",
            "popularity basket frequency descending for fallback",
            "product ID ascending for popularity ties"
        ],
        "excludes_latest_training_basket_products": True,
        "precision_denominator": "K",
        "k_values": K_VALUES,
        "algorithm": "fpgrowth",
        "min_support": MIN_SUPPORT,
        "min_confidence": MIN_CONFIDENCE,
        "min_lift": MIN_LIFT,
        "max_len": MAX_LEN,
        "metrics": all_metrics.to_dict(orient="records")
    }

    summary_path = OUTPUT_DIR / "hybrid_comparison_summary.json"

    with open(summary_path, "w", encoding="utf-8") as file:
        json.dump(summary, file, indent=4)

    print("\n" + "=" * 60)
    print("HYBRID RECOMMENDATION EVALUATION")
    print("=" * 60)

    print(f"Training baskets: {len(train_transactions)}")
    print(f"Test baskets: {len(test_df)}")
    print(f"Test users: {len(user_ids)}")
    print(f"Rules mined: {len(rules_df)}")

    print("Users with activated rules: " f"{users_with_activated_rules}")
    print("Users with rule recommendations: " f"{users_with_rule_recommendations}")
    print("Users with hybrid recommendations: " f"{users_with_hybrid_recommendations}")
    print("Hybrid recommendation coverage: " f"{users_with_hybrid_recommendations / len(user_ids):.6f}")

    print("\nRecommendation metrics:")
    print(all_metrics.to_string(index=False))

    print("\nSaved:")
    print(summary_path)
    print(metrics_path)
    print(per_user_path)


if __name__ == "__main__":
    main()
