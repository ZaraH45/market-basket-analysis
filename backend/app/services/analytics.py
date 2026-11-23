
from pathlib import Path
import json

import pandas as pd
from fastapi import HTTPException


PROJECT_ROOT = Path(__file__).resolve().parents[3]

PROCESSED_DIR = PROJECT_ROOT / "backend" / "data" / "processed"

MINING_DIR = PROCESSED_DIR / "association_mining"
RULE_EVALUATION_DIR = PROCESSED_DIR / "association_rule_evaluation"
HYBRID_EVALUATION_DIR = PROCESSED_DIR / "hybrid_recommendation_evaluation"
SENSITIVITY_DIR = PROCESSED_DIR / "parameter_sensitivity"


def read_json(path):
    if not path.exists():
        raise HTTPException(status_code=503, detail="Analytics data file is missing: " + path.name)

    with open(path, "r", encoding="utf-8") as file:
        return json.load(file)


def read_csv(path):
    if not path.exists():
        raise HTTPException(status_code=503, detail="Analytics data file is missing: " + path.name)

    return pd.read_csv(path)


def paginate_dataframe(dataframe, page, page_size):
    total_records = len(dataframe)

    start_index = (page - 1) * page_size
    end_index = start_index + page_size

    page_df = dataframe.iloc[start_index:end_index]

    records = page_df.astype(object).where(pd.notna(page_df), None).to_dict(orient="records")
    total_pages = (total_records + page_size - 1) // page_size

    return {
        "data": records,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_records": total_records,
            "total_pages": total_pages
        }
    }


def get_overview():

    apriori_stats = read_json(MINING_DIR / "apriori_statistics.json")
    fpgrowth_stats = read_json(MINING_DIR / "fpgrowth_statistics.json")
    rule_evaluation = read_json(RULE_EVALUATION_DIR / "evaluation_summary.json")
    hybrid_evaluation = read_json(HYBRID_EVALUATION_DIR / "hybrid_comparison_summary.json")

    return {
        "dataset": {
            "transactions": apriori_stats["transactions"],
            "products_before_filtering": (fpgrowth_stats["products_before_filtering"]),
            "products_after_filtering": (fpgrowth_stats["products_after_filtering"])
        },
        "mining": {
            "apriori": apriori_stats,
            "fpgrowth": fpgrowth_stats
        },
        "rule_evaluation": rule_evaluation,
        "hybrid_evaluation": hybrid_evaluation
    }


def get_itemsets(algorithm="fpgrowth", page=1, page_size=20, itemset_length=None, search=None):

    if algorithm not in {"apriori", "fpgrowth"}:
        raise HTTPException(status_code=400, detail="Algorithm must be apriori or fpgrowth.")

    path = MINING_DIR / (algorithm + "_frequent_itemsets.csv")

    dataframe = read_csv(path)

    if itemset_length is not None:
        dataframe = dataframe[dataframe["itemset_length"] == itemset_length]

    if search:
        dataframe = dataframe[dataframe["product_names"].str.contains(search, case=False, na=False)]

    return {"algorithm": algorithm, **paginate_dataframe(dataframe, page, page_size)}


def get_rules(algorithm="fpgrowth", page=1, page_size=20, min_confidence=None, min_lift=None, search=None):

    if algorithm not in {"apriori", "fpgrowth"}:
        raise HTTPException(status_code=400, detail="Algorithm must be apriori or fpgrowth.")

    path = MINING_DIR / (algorithm + "_association_rules.csv")

    dataframe = read_csv(path)

    if min_confidence is not None:
        dataframe = dataframe[dataframe["confidence"] >= min_confidence]

    if min_lift is not None:
        dataframe = dataframe[dataframe["lift"] >= min_lift]

    if search:
        matches = ( dataframe["antecedent_names"].str.contains(search, case=False, na=False) | dataframe["consequent_names"].str.contains(search, case=False, na=False))
        dataframe = dataframe[matches]

    return {"algorithm": algorithm, **paginate_dataframe(dataframe, page, page_size)}


def get_evaluation():

    rule_evaluation = read_json(RULE_EVALUATION_DIR / "evaluation_summary.json")
    hybrid_evaluation = read_json(HYBRID_EVALUATION_DIR / "hybrid_comparison_summary.json")
    sensitivity = read_csv(SENSITIVITY_DIR / "sensitivity_results.csv")

    sensitivity_records = sensitivity.astype(object).where(pd.notna(sensitivity), None).to_dict(orient="records")

    return {
        "rule_evaluation": rule_evaluation,
        "hybrid_comparison": hybrid_evaluation,
        "parameter_sensitivity": sensitivity_records
    }
