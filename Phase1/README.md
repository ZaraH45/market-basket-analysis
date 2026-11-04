# Instacart Market Basket Analysis — Phase 1 (Data Preparation and EDA)

**Scope: Member 1 only.** Data inspection, quality cleaning, preprocessing, exploration, insights, and reproducibility. No association-rule mining, recommendation engine, or website implementation is included.

## Dataset and provenance

Official source: https://www.kaggle.com/datasets/psparks/instacart-market-basket-analysis

This ZIP includes **all six original Kaggle CSV files** under `data/raw/`, including the complete `order_products__prior.csv` and `order_products__train.csv`. No synthetic or demonstration dataset is included. 

**Analysis scope:** the included saved notebooks, figures and processed outputs cover a reproducible 30,000-prior-order sample (seed 42), NOT all 3.2 million prior orders; this keeps Phase 1 computation practical. All original raw CSVs are retained so you can reproduce, choose another sample size, or extend the analysis. The `train` file is included in the source package for completeness, but Phase 1 basket analysis uses **prior orders only** (the correct labeled subset for unsupervised exploration). 

The dataset has no product descriptions, images, or verified prices. These are not used in Phase 1. Any UI placeholders belong to the other members' website work.

**Dataset features:** `order_id`, `user_id`, `eval_set`, `order_number`, `order_dow`, `order_hour_of_day`, `days_since_prior_order`, `product_id`, `product_name`, `aisle_id`, `department_id`, `reordered`, `add_to_cart_order`. Target variable: **none**, because Phase 1 is descriptive and basket preparation for unsupervised association mining. `reordered` is descriptive, not the supervised target here.

## Folder structure

- `data/raw/` — all six full original Kaggle CSVs (no fabricated data).
- `data/processed/` — cleaned products, orders, transactions, baskets, audit report.
- `notebooks/` — three executed real-data notebooks for inspection/cleaning, EDA, preprocessing.
- `images/real/` — seven actual EDA figures.
- `reports/real/` — written findings and EDA metrics.
- `scripts/` — reproducible Phase 1 pipeline.
- `tests/` — data-integrity smoke test.

## Quick start (VS Code / Windows)

Open **this folder** in VS Code and run:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m scripts.run_phase1 --max-orders 30000
.\.venv\Scripts\python.exe -m pytest -q
```

Open each `notebooks/*.ipynb`. Select the `.venv` Python environment and choose **Run All** / save. The notebooks already have recorded outputs using the real Instacart sample. To reproduce all figures, run the command above. The complete original CSVs are included; the command takes a reproducible sample to avoid excessive memory use.

## Cleaning and preprocessing

- Report source shapes, null counts, duplicate rows, and columns in `data/processed/cleaning_report.json`.
- Eliminate invalid/duplicate identifiers and malformed category/product references.
- Validate 0–6 day code, 0–23 order hours, positive cart positions and 0/1 reorder flags.
- Keep expected null `days_since_prior_order` for a customer's first order. Missing intervals are not invented.
- Do not automatically delete genuinely large baskets just because they are extreme; show their distribution using a boxplot.
- Build one basket per prior order; unique product IDs, categorical information only.
- Scaling/normalization not required: IDs are labels, and Phase 2 will use binary product presence.

## EDA and observations

Seven figures cover top products, basket-size distribution, order-day codes, order hours, departments, basket-size outlier boxplot and exploratory numeric correlations. See `reports/real/INSIGHTS.md` for each chart's interpretation and `reports/real/eda_metrics.json` for values.

For the analyzed **30,000 real prior orders**, the previously executed analysis found: mean basket size about **10.08**, median **8**, top product **Banana** (4,310 purchase rows), top department **produce** (87,854 lines), most frequent day code **0**, modal hour **10**, historical `reordered=1` rate about **59.2%**. Do not assume the encoded day corresponds to a named weekday; correlations do not imply causation. Figures and counts are sample-specific.

## Submission / GitHub

Teacher's deadline: 10 November 2026. There is **one submission per group**, so add this Phase 1 folder to the existing shared repo rather than creating a second project. The teacher may need access (GitHub `Rebelhere`) if the repository is private. Commit meaningful stages separately going forward; never invent historical commits.

The ZIP bundles the full original Kaggle dataset. **Do NOT commit the large CSV source files to GitHub**; `.gitignore` excludes `data/raw/*.csv`, and the Kaggle download URL is in this README. Keep notebook outputs and `reports/real` figures. In your report, state the sample size clearly.

## Full source dataset / saved analysis distinction

- **Original raw data:** all 6 Kaggle CSVs included (full-size).
- **Saved plots & processed data:** 30,000 reproducibly sampled prior orders, not full-population findings.
- **Run on your PC:** `python -m scripts.run_phase1 --max-orders 30000` from the project root after installing requirements. Keep `--max-orders 30000` to reproduce sampled analysis; `--max-orders 0` requests all prior orders and may need substantial RAM/time.
- **GitHub:** do not push `data/raw/*.csv` or giant processed exports; cite the Kaggle dataset link. You can share this ZIP locally without committing the full raw data.

## Source file manifest

`aisles.csv`, `departments.csv`, `products.csv`, `orders.csv`, `order_products__prior.csv`, `order_products__train.csv`. Full original source names preserved.
