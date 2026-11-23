
import time
import json
import pandas as pd
import numpy as np
from pathlib import Path
from backend.app.services.association_mining import (load_data, mine_association_patterns)


PROJECT_ROOT = Path(__file__).resolve().parents[2]
OUTPUT_DIR = (PROJECT_ROOT / "backend" / "data" / "processed" / "parameter_sensitivity")

def compare_itemsets(apriori_results, fpgrowth_results):
    apriori_df = apriori_results["frequent_itemsets"]
    fpgrowth_df = fpgrowth_results["frequent_itemsets"]

    apriori_metrics = apriori_df.set_index("product_ids")[["support"]]
    fpgrowth_metrics = fpgrowth_df.set_index("product_ids")[["support"]]

    apriori_metrics = apriori_metrics.sort_index()
    fpgrowth_metrics = fpgrowth_metrics.sort_index()

    if not apriori_metrics.index.equals(fpgrowth_metrics.index):
        return False

    return np.allclose(
        apriori_metrics.to_numpy(dtype=float),
        fpgrowth_metrics.to_numpy(dtype=float),
        rtol=1e-9,
        atol=1e-12
    )


def compare_rules(apriori_results, fpgrowth_results):
    apriori_df = apriori_results["association_rules"]
    fpgrowth_df = fpgrowth_results["association_rules"]

    rule_columns = ["antecedent_ids", "consequent_ids"]
    metric_columns = ["support", "confidence", "lift"]

    apriori_metrics = apriori_df.set_index(rule_columns)[metric_columns]
    fpgrowth_metrics = fpgrowth_df.set_index(rule_columns)[metric_columns]

    apriori_metrics = apriori_metrics.sort_index()
    fpgrowth_metrics = fpgrowth_metrics.sort_index()

    if not apriori_metrics.index.equals(fpgrowth_metrics.index):
        return False

    return np.allclose(
        apriori_metrics.to_numpy(dtype=float),
        fpgrowth_metrics.to_numpy(dtype=float),
        rtol=1e-9,
        atol=1e-12
    )


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("Loading Phase 1 dataset...")
    transactions, product_names = load_data()

    print("Transactions loaded:", len(transactions))
    print("Products in catalog:", len(product_names))

    support_values = [0.003, 0.005, 0.010]
    confidence_values = [0.20, 0.30, 0.40]

    results_summary = []

    experiment_number = 0

    for min_support in support_values:
        for min_confidence in confidence_values:

            experiment_number += 1

            print("\n" + "=" * 60)
            print("Experiment:", experiment_number)
            print("Minimum support:", min_support)
            print("Minimum confidence:", min_confidence)
            print("=" * 60)

            experiment_results = {}

            for algorithm in ["apriori", "fpgrowth"]:

                print("\nRunning", algorithm)

                start_time = time.perf_counter()

                result = mine_association_patterns(transactions=transactions, product_names=product_names,
                    algorithm=algorithm, min_support=min_support, min_confidence=min_confidence, min_lift=1.0, max_len=3)

                elapsed_time = time.perf_counter() - start_time
                experiment_results[algorithm] = result
                stats = result["statistics"]

                print("Frequent itemsets:", stats["frequent_itemset_count"])
                print("Association rules:", stats["association_rule_count"])
                print("Products retained:", stats["products_after_filtering"])
                print("Runtime:", round(elapsed_time, 3), "seconds")

                results_summary.append({
                    "experiment": experiment_number,
                    "algorithm": algorithm,
                    "min_support": min_support,
                    "min_confidence": min_confidence,
                    "min_lift": 1.0,
                    "max_len": 3,
                    "products_retained": stats["products_after_filtering"],
                    "minimum_basket_count": stats["minimum_basket_count"],
                    "frequent_itemsets": stats["frequent_itemset_count"],
                    "association_rules": stats["association_rule_count"],
                    "runtime_seconds": round(elapsed_time, 4)
                })

            itemsets_match = compare_itemsets(experiment_results["apriori"], experiment_results["fpgrowth"])
            rules_match = compare_rules(experiment_results["apriori"], experiment_results["fpgrowth"])

            print("\nAlgorithm comparison:")
            print("Itemsets match:", itemsets_match)
            print("Rules match:", rules_match)

            if not itemsets_match or not rules_match:
                raise AssertionError("Apriori and FP-Growth produced different results for support " + str(min_support) + " and confidence " + str(min_confidence))

    summary_df = pd.DataFrame(results_summary)

    csv_path = OUTPUT_DIR / "sensitivity_results.csv"
    json_path = OUTPUT_DIR / "sensitivity_results.json"

    summary_df.to_csv(csv_path, index=False)

    with open(json_path, "w", encoding="utf-8") as file:
        json.dump(results_summary, file, indent=4)

    print("\n" + "=" * 60)
    print("PARAMETER SENSITIVITY ANALYSIS COMPLETED")
    print("=" * 60)

    print("\nResults:")
    print(summary_df.to_string(index=False))

    print("\nSaved files:")
    print(csv_path)
    print(json_path)


if __name__ == "__main__":
    main()
