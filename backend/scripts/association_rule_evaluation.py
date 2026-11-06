
import json
import pandas as pd
from pathlib import Path
from backend.app.services.association_mining import (mine_association_patterns)


PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATA_DIR = PROJECT_ROOT / "Phase1" / "data" / "processed"
OUTPUT_DIR = (PROJECT_ROOT / "backend" / "data" / "processed" / "association_rule_evaluation")

MIN_SUPPORT = 0.005
MIN_CONFIDENCE = 0.20
MIN_LIFT = 1.0
MAX_LEN = 3

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


def evaluate_rules(rules_df, latest_train_df, test_df, training_basket_count):
    previous_baskets = {}
    next_baskets = {}

    for _, row in latest_train_df.iterrows():
        user_id = int(row["user_id_basket"])

        previous_baskets[user_id] = parse_products(row["product_ids"])

    for _, row in test_df.iterrows():
        user_id = int(row["user_id_basket"])

        next_baskets[user_id] = parse_products(row["product_ids"])

    # Every test user must have a previous training basket.
    if not set(next_baskets).issubset(set(previous_baskets)):
        raise ValueError("A test user does not have a previous training basket.")

    rule_records = []

    for _, rule in rules_df.iterrows():

        antecedents = parse_products(rule["antecedent_ids"])
        consequents = parse_products(rule["consequent_ids"])

        rule_records.append({
            "antecedent_ids": rule["antecedent_ids"],
            "consequent_ids": rule["consequent_ids"],
            "antecedent_names": rule["antecedent_names"],
            "consequent_names": rule["consequent_names"],
            "support": float(rule["support"]),
            "confidence": float(rule["confidence"]),
            "lift": float(rule["lift"]),
            "antecedents": antecedents,
            "consequents": consequents,
            "activations": 0,
            "exact_matches": 0,
            "predicted_items": 0,
            "matched_items": 0
        })

    covered_users = set()

    total_activations = 0
    total_exact_matches = 0
    total_predicted_items = 0
    total_matched_items = 0

    # Singleton training users have no held-out next basket.
    for user_id, actual_next_products in next_baskets.items():

        previous_products = previous_baskets[user_id]

        for rule in rule_records:

            if rule["antecedents"].issubset(previous_products):

                covered_users.add(user_id)

                total_activations += 1
                rule["activations"] += 1

                predicted = rule["consequents"]
                matched = predicted.intersection(actual_next_products)

                total_predicted_items += len(predicted)
                total_matched_items += len(matched)

                rule["predicted_items"] += len(predicted)
                rule["matched_items"] += len(matched)

                if predicted.issubset(actual_next_products):
                    total_exact_matches += 1
                    rule["exact_matches"] += 1

    test_count = len(test_df)

    if total_activations > 0:
        rule_success_rate = (total_exact_matches / total_activations)
    else:
        rule_success_rate = 0.0

    if total_predicted_items > 0:
        consequent_item_precision = (total_matched_items / total_predicted_items)
    else:
        consequent_item_precision = 0.0

    if test_count > 0:
        coverage = len(covered_users) / test_count
    else:
        coverage = 0.0

    per_rule_results = []

    for rule in rule_records:

        if rule["activations"] > 0:
            success_rate = (rule["exact_matches"] / rule["activations"])
        else:
            success_rate = None

        per_rule_results.append({
            "antecedent_ids": rule["antecedent_ids"],
            "antecedent_names": rule["antecedent_names"],
            "consequent_ids": rule["consequent_ids"],
            "consequent_names": rule["consequent_names"],
            "support": rule["support"],
            "confidence": rule["confidence"],
            "lift": rule["lift"],
            "activations": rule["activations"],
            "exact_matches": rule["exact_matches"],
            "heldout_success_rate": success_rate,
            "predicted_items": rule["predicted_items"],
            "matched_items": rule["matched_items"]
        })

    per_rule_df = pd.DataFrame(per_rule_results)

    if not per_rule_df.empty:
        per_rule_df = per_rule_df.sort_values(["activations", "heldout_success_rate"], ascending=[False, False], na_position="last").reset_index(drop=True)

    summary = {
        "training_baskets": training_basket_count,
        "test_baskets": test_count,
        "test_users": len(next_baskets),
        "rules_mined": len(rules_df),
        "test_users_with_at_least_one_activated_rule": len(covered_users),
        "test_coverage": coverage,
        "total_rule_activations": total_activations,
        "successful_rule_activations": total_exact_matches,
        "rule_success_rate": rule_success_rate,
        "predicted_consequent_items": total_predicted_items,
        "correctly_predicted_consequent_items": total_matched_items,
        "consequent_item_precision": consequent_item_precision,
        "mean_activated_rules_per_test_user": (total_activations / test_count if test_count > 0 else 0.0)
    }

    return summary, per_rule_df


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("Loading product catalog..")
    product_names = load_product_names()
    print("Creating chronological split..")

    train_df, latest_train_df, test_df = (create_chronological_split())

    train_transactions = []

    for product_string in train_df["product_ids"]:
        train_transactions.append(sorted(parse_products(product_string)))

    print("Training baskets:", len(train_transactions))
    print("Testing baskets:", len(test_df))
    print("Test users:", test_df["user_id_basket"].nunique())

    print("\nMining rules using training baskets only...")

    result = mine_association_patterns(
        transactions=train_transactions,
        product_names=product_names,
        algorithm="fpgrowth",
        min_support=MIN_SUPPORT,
        min_confidence=MIN_CONFIDENCE,
        min_lift=MIN_LIFT,
        max_len=MAX_LEN
    )

    print("\nEvaluating rules on held-out next baskets...")

    summary, per_rule_df = evaluate_rules(
        result["association_rules"],
        latest_train_df,
        test_df,
        len(train_df)
    )

    summary.update({
        "algorithm": "fpgrowth",
        "min_support": MIN_SUPPORT,
        "min_confidence": MIN_CONFIDENCE,
        "min_lift": MIN_LIFT,
        "max_len": MAX_LEN
    })

    summary_path = OUTPUT_DIR / "evaluation_summary.json"
    rules_path = OUTPUT_DIR / "per_rule_evaluation.csv"

    with open(summary_path, "w", encoding="utf-8") as file:
        json.dump(summary, file, indent=4)

    per_rule_df.to_csv(rules_path, index=False)

    print("\n" + "=" * 55)
    print("ASSOCIATION RULE EVALUATION")
    print("=" * 55)

    for key, value in summary.items():
        print(key + ":", value)

    print("\nTop evaluated rules:")

    if not per_rule_df.empty:
        print(per_rule_df.head(10).to_string(index=False))

    print("\nSaved:")
    print(summary_path)
    print(rules_path)


if __name__ == "__main__":
    main()
