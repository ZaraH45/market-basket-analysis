from pathlib import Path
from collections import Counter
import argparse
import json
import math

import pandas as pd
from scipy.sparse import csr_matrix
from mlxtend.frequent_patterns import apriori, fpgrowth, association_rules


PROJECT_ROOT = Path(__file__).resolve().parents[3]

DEFAULT_BASKETS_PATH = (PROJECT_ROOT / "Phase1" / "data" / "processed" / "baskets.csv")
DEFAULT_CATALOG_PATH = (PROJECT_ROOT / "Phase1" / "data" / "processed" / "product_catalog.csv")
DEFAULT_OUTPUT_DIR = (PROJECT_ROOT / "backend" / "data" / "processed" / "association_mining")

def load_data(baskets_path=DEFAULT_BASKETS_PATH, catalog_path=DEFAULT_CATALOG_PATH):

    baskets_df = pd.read_csv(baskets_path)
    catalog_df = pd.read_csv(catalog_path)

    required_basket_columns = {"order_id", "product_ids"}
    required_catalog_columns = {"product_id", "product_name"}

    if not required_basket_columns.issubset(baskets_df.columns):
        raise ValueError("baskets.csv is missing required columns.")

    if not required_catalog_columns.issubset(catalog_df.columns):
        raise ValueError("product_catalog.csv is missing required columns.")

    if baskets_df["order_id"].duplicated().any():
        raise ValueError("Duplicate order IDs found in baskets.csv.")

    product_names = {}

    for _, row in catalog_df.iterrows():
        product_names[int(row["product_id"])] = str(row["product_name"])

    transactions = []

    for _, row in baskets_df.iterrows():
        product_string = str(row["product_ids"])

        products = []
        seen_products = set()

        for product in product_string.split("|"):
            product_id = int(product)

            if product_id not in seen_products:
                products.append(product_id)
                seen_products.add(product_id)

        if len(products) == 0:
            raise ValueError("An empty basket was found for order ID " + str(row["order_id"]))

        transactions.append(products)

    return transactions, product_names


def build_sparse_matrix(transactions, min_support):

    if not 0 < min_support <= 1:
        raise ValueError("min_support must be greater than 0 and at most 1.")

    total_transactions = len(transactions)

    if total_transactions == 0:
        raise ValueError("No transactions were provided.")

    minimum_count = math.ceil(min_support * total_transactions)
    product_counts = Counter()

    for transaction in transactions:
        product_counts.update(set(transaction))

    frequent_products = []

    for product_id, count in product_counts.items():
        if count >= minimum_count:
            frequent_products.append(product_id)

    frequent_products.sort()

    if len(frequent_products) == 0:
        raise ValueError("No products meet the selected minimum support threshold.")

    product_to_column = {}

    for column, product_id in enumerate(frequent_products):
        product_to_column[product_id] = column

    row_indices = []
    column_indices = []

    for row, transaction in enumerate(transactions):
        for product_id in set(transaction):
            if product_id in product_to_column:
                row_indices.append(row)
                column_indices.append(product_to_column[product_id])

    values = [True] * len(row_indices)

    matrix = csr_matrix((values, (row_indices, column_indices)), shape=(total_transactions, len(frequent_products)), dtype=bool)
    sparse_columns = {}

    for column, product_id in enumerate(frequent_products):
        column_values = matrix.getcol(column).toarray().ravel()
        sparse_columns[str(product_id)] = pd.arrays.SparseArray(column_values, dtype=pd.SparseDtype(bool, False))

    transaction_df = pd.DataFrame(sparse_columns)

    return transaction_df, product_counts, minimum_count


def format_itemsets(itemsets_df, product_names):

    result = itemsets_df.copy()

    result["product_ids"] = result["itemsets"].apply(lambda items: "|".join(str(int(product_id)) for product_id in sorted(items, key=int)))
    result["product_names"] = result["itemsets"].apply(lambda items: " | ".join(product_names.get(int(product_id), "Unknown product")
            for product_id in sorted(items, key=int))
    )

    result["itemset_length"] = result["itemsets"].apply(len)
    result = result.drop(columns=["itemsets"])

    result = result[[ "product_ids", "product_names", "itemset_length", "support"]]

    return result.sort_values(by=["itemset_length", "support", "product_ids"], ascending=[True, False, True]).reset_index(drop=True)


def format_rules(rules_df, product_names):

    if rules_df.empty:
        return pd.DataFrame(
            columns=[
                "antecedent_ids",
                "antecedent_names",
                "consequent_ids",
                "consequent_names",
                "support",
                "confidence",
                "lift",
                "leverage",
                "conviction"
            ]
        )

    result = rules_df.copy()

    def get_ids(items):
        return "|".join(str(int(product_id)) for product_id in sorted(items, key=int))

    def get_names(items):
        return " | ".join(product_names.get(int(product_id), "Unknown product")
            for product_id in sorted(items, key=int)
        )

    result["antecedent_ids"] = result["antecedents"].apply(get_ids)
    result["antecedent_names"] = result["antecedents"].apply(get_names)

    result["consequent_ids"] = result["consequents"].apply(get_ids)
    result["consequent_names"] = result["consequents"].apply(get_names)

    result = result[
        [
            "antecedent_ids",
            "antecedent_names",
            "consequent_ids",
            "consequent_names",
            "support",
            "confidence",
            "lift",
            "leverage",
            "conviction"
        ]
    ]

    return result.sort_values(by=["lift", "confidence", "support"], ascending=[False, False, False]).reset_index(drop=True)


def mine_association_patterns(transactions, product_names, algorithm="apriori", min_support=0.005, min_confidence=0.20, min_lift=1.0, max_len=3):

    if algorithm not in {"apriori", "fpgrowth"}:
        raise ValueError("algorithm must be 'apriori' or 'fpgrowth'.")

    if not 0 < min_confidence <= 1:
        raise ValueError("min_confidence must be greater than 0 and at most 1.")

    if min_lift < 0:
        raise ValueError("min_lift cannot be negative.")

    if max_len < 2:
        raise ValueError("max_len must be at least 2 to generate rules.")

    transaction_df, product_counts, minimum_count = build_sparse_matrix(transactions, min_support)

    print("\nRunning:", algorithm)
    print("Transactions:", len(transaction_df))
    print("Products before support filtering:", len(product_counts))
    print("Products after support filtering:", len(transaction_df.columns))
    print("Minimum basket count:", minimum_count)
    print("Minimum support:", min_support)
    print("Maximum itemset length:", max_len)

    if algorithm == "apriori":
        frequent_itemsets = apriori(transaction_df, min_support=min_support, use_colnames=True, max_len=max_len, low_memory=True)
    else:
        frequent_itemsets = fpgrowth(transaction_df, min_support=min_support, use_colnames=True, max_len=max_len)

    if frequent_itemsets.empty:
        raise ValueError("No frequent itemsets were found.")

    frequent_itemsets = frequent_itemsets.sort_values(by="support", ascending=False).reset_index(drop=True)
    frequent_itemsets_readable = format_itemsets(frequent_itemsets, product_names)

    rules = pd.DataFrame()
    has_combinations = False

    for items in frequent_itemsets["itemsets"]:
        if len(items) >= 2:
            has_combinations = True
            break

    if has_combinations:
        rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=min_confidence)

        if not rules.empty:
            rules = rules[rules["lift"] >= min_lift].copy()

    rules_readable = format_rules(rules, product_names)

    return {
        "algorithm": algorithm,
        "frequent_itemsets": frequent_itemsets_readable,
        "association_rules": rules_readable,
        "statistics": {
            "transactions": len(transactions),
            "products_before_filtering": len(product_counts),
            "products_after_filtering": len(transaction_df.columns),
            "minimum_basket_count": minimum_count,
            "frequent_itemset_count": len(frequent_itemsets),
            "association_rule_count": len(rules_readable),
            "min_support": min_support,
            "min_confidence": min_confidence,
            "min_lift": min_lift,
            "max_len": max_len
        }
    }


def save_results(results, output_dir=DEFAULT_OUTPUT_DIR):

    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    algorithm = results["algorithm"]
    itemsets_path = output_dir / (algorithm + "_frequent_itemsets.csv")

    rules_path = output_dir / (algorithm + "_association_rules.csv")
    statistics_path = output_dir / (algorithm + "_statistics.json")

    results["frequent_itemsets"].to_csv(itemsets_path, index=False)
    results["association_rules"].to_csv(rules_path, index=False)

    with open(statistics_path, "w", encoding="utf-8") as file:
        json.dump(results["statistics"], file, indent=4)

    print("\nSaved results:")
    print(itemsets_path)
    print(rules_path)
    print(statistics_path)


def main():
    parser = argparse.ArgumentParser(description="Market Basket Association Rule Mining")

    parser.add_argument("--algorithm", choices=["apriori", "fpgrowth", "both"], default="both")
    parser.add_argument("--min-support", type=float, default=0.005)
    parser.add_argument("--min-confidence", type=float, default=0.20)
    parser.add_argument("--min-lift", type=float, default=1.0)
    parser.add_argument("--max-len", type=int, default=3)

    args = parser.parse_args()
    transactions, product_names = load_data()

    algorithms = []

    if args.algorithm == "both":
        algorithms = ["apriori", "fpgrowth"]
    else:
        algorithms = [args.algorithm]

    for algorithm in algorithms:
        results = mine_association_patterns(transactions=transactions, product_names=product_names, algorithm=algorithm,
            min_support=args.min_support, min_confidence=args.min_confidence, min_lift=args.min_lift, max_len=args.max_len)

        save_results(results)

        print("\n---", algorithm.upper(), "SUMMARY ---")
        print(json.dumps(results["statistics"], indent=4))
        print("\nTop 10 association rules:")
        print(results["association_rules"] .head(10) .to_string(index=False))


if __name__ == "__main__":
    main()
