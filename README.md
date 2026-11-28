# Basketly — Market Basket Analysis and Product Recommendation System

Basketly is a data-driven grocery shopping application that uses **market basket analysis and association-rule mining** to identify purchasing patterns and recommend products that customers may want to add to their baskets.

The project combines data preprocessing, exploratory data analysis, Apriori and FP-Growth algorithms, recommendation evaluation, and a web application for exploring products, shopping baskets, analytics, and recommendations.

## Project Objectives

- Analyze historical grocery transactions to identify frequently purchased products and product combinations.
- Discover association rules using Apriori and FP-Growth.
- Compare the algorithms under different support and confidence thresholds.
- Develop a basket-based recommendation system using association rules and popularity-based fallback recommendations.
- Evaluate recommendations against a held-out test set.
- Integrate the analysis and recommendation functionality into a web application.

## Dataset

**Source:** [Instacart Market Basket Analysis — Kaggle](https://www.kaggle.com/datasets/psparks/instacart-market-basket-analysis)

The project uses the Instacart grocery transaction dataset, which contains historical orders, product information, aisles, and departments.

The original dataset contains approximately 3.2 million orders and 49,688 products.

The Phase 1 analysis uses a reproducible sample of **30,000 prior orders**, selected using random seed 42.

| Dataset statistic | Result |
|---|---:|
| Selected prior orders | 30,000 |
| Cleaned product purchase records | 302,305 |
| Non-empty shopping baskets | 30,000 |
| Average basket size | 10.08 products |
| Most frequently purchased product | Banana |
| Most popular department | Produce |

The original Kaggle CSV files are not included in the repository. They must be downloaded separately and placed in `Phase1/data/raw/` when reproducing the Phase 1 pipeline.

## Project Phases

### Phase 1 — Data Preparation and Exploratory Analysis

Phase 1 focuses on preparing the transaction data for association-rule mining.

Work completed:

- Data inspection, cleaning, and validation.
- Handling duplicate records and invalid identifiers.
- Integration of product, aisle, and department information.
- Conversion of transaction records into shopping baskets.
- Exploratory data analysis of purchasing patterns.
- Generation of seven visualizations.

The Phase 1 notebooks are:

1. `01_Data_Cleaning.ipynb`
2. `02_EDA.ipynb`
3. `03_Preprocessing.ipynb`

The visualizations are available in `Phase1/images/real/`, and additional findings are documented in `Phase1/reports/real/INSIGHTS.md`.

### Phase 2 — Association Mining and Recommendations

Phase 2 implements two frequent-itemset mining algorithms:

- **Apriori:** Identifies frequent itemsets by progressively generating and evaluating candidate itemsets.
- **FP-Growth:** Uses an FP-tree structure to mine frequent patterns without explicitly generating candidate itemsets in the same way as Apriori.

Association rules are evaluated using:

- **Support:** Frequency of an itemset in the transactions.
- **Confidence:** Strength of the association between antecedent and consequent.
- **Lift:** Strength of the association relative to independent occurrence.

The selected mining configuration is:

| Parameter | Value |
|---|---:|
| Minimum support | 0.005 |
| Minimum confidence | 0.20 |
| Minimum lift | 1.0 |
| Maximum itemset length | 3 |

At this configuration, both algorithms generated **335 frequent itemsets and 49 association rules** in the parameter-sensitivity experiment.

### Parameter Sensitivity and Algorithm Comparison

The experiments tested three minimum-support values and three minimum-confidence values:

- Minimum support: 0.003, 0.005, 0.010
- Minimum confidence: 0.20, 0.30, 0.40

Both algorithms were evaluated for every parameter combination. Their frequent itemsets and association rules were compared to verify that they produced matching patterns and metrics.

At minimum support 0.005 and minimum confidence 0.20:

| Metric | Apriori | FP-Growth |
|---|---:|---:|
| Frequent itemsets | 335 | 335 |
| Association rules | 49 | 49 |
| Runtime (seconds) | 0.9622 | 0.8374 |

Runtime is dependent on the execution environment. In this experiment, FP-Growth completed faster while producing matching frequent itemsets and rules.

The full parameter-sensitivity results are available in:

`backend/data/processed/parameter_sensitivity/sensitivity_results.csv`

### Recommendation Strategy

Basketly uses a hybrid recommendation strategy:

1. Identify association rules activated by products already present in a customer's basket.
2. Rank rule-based recommendations using confidence, lift, and support.
3. Exclude products already present in the basket.
4. Use popularity-based recommendations as a fallback when association rules do not provide enough recommendations.

This approach combines personalized basket context with product popularity and ensures recommendation availability.

## Evaluation Results

### Association Rule Evaluation

The association-rule evaluation used 26,586 training baskets and 3,414 test baskets.

| Metric | Result |
|---|---:|
| Training baskets | 26,586 |
| Test baskets | 3,414 |
| Rules mined | 41 |
| Test users with activated rules | 1,795 |
| Rule activation coverage | 52.58% |
| Rule activations | 5,088 |
| Successful rule activations | 430 |
| Consequent item precision | 11.15% |

These results show that association rules can identify useful purchasing relationships, but they do not provide recommendations for every test user.

### Recommendation Comparison

The hybrid recommender was compared with popularity-only and association-rule-only approaches.

| Method | Precision@5 | Recall@5 | Hit Rate@5 |
|---|---:|---:|---:|
| Popularity | 6.75% | 4.51% | 27.83% |
| Association rules | 1.77% | 1.08% | 8.38% |
| Hybrid | **6.84%** | **4.56%** | **28.18%** |

At cutoff 10:

| Method | Precision@10 | Recall@10 | Hit Rate@10 |
|---|---:|---:|---:|
| Popularity | 5.23% | 6.61% | 36.82% |
| Association rules | 0.88% | 1.08% | 8.38% |
| Hybrid | **5.25%** | **6.64%** | **36.97%** |

The hybrid approach achieved slightly better results than the popularity baseline at both cutoffs. Association-rule-only recommendations performed less effectively, which supports using popularity as a fallback.

The hybrid recommender achieved **100% recommendation coverage** on the evaluated test users.

The evaluation summaries are stored in:

- `backend/data/processed/association_rule_evaluation/evaluation_summary.json`
- `backend/data/processed/hybrid_recommendation_evaluation/hybrid_comparison_summary.json`

## Web Application

Basketly provides a web interface connected to a FastAPI backend.

The application includes:

- Product catalogue and product detail pages.
- Product categories and search.
- Shopping basket functionality.
- Basket-based product recommendations.
- Analytics and association-mining insights.
- Evaluation results and parameter-sensitivity information.

### Technologies

| Component | Technologies |
|---|---|
| Data processing | Python, Pandas, NumPy |
| Association mining | mlxtend, Apriori, FP-Growth |
| Backend | FastAPI, Uvicorn |
| Frontend | Next.js, React, TypeScript |
| Styling | Tailwind CSS |
| Analytics | Plotly |
| Data exploration | Jupyter Notebook, Matplotlib, Seaborn |

## Repository Structure

```text
market-basket-analysis/
│
├── Phase1/
│   ├── data/
│   ├── notebooks/
│   ├── images/
│   ├── reports/
│   ├── scripts/
│   ├── tests/
│   ├── requirements.txt
│   └── README.md
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── schemas/
│   │   └── services/
│   ├── data/
│   │   └── processed/
│   ├── scripts/
│   ├── tests/
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   └── package.json
│
└── README.md
```

## Installation and Execution

### Prerequisites

- Python 3.10 or later
- Node.js and npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/ZaraH45/market-basket-analysis.git
cd market-basket-analysis
```

### 2. Set up the backend

Create and activate a virtual environment:

```bash
python -m venv venv
```

On Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

Install backend dependencies:

```bash
pip install -r backend/requirements.txt
```

Start the FastAPI backend from the repository root:

```bash
uvicorn --app-dir backend app.main:app --reload
```

The backend runs at:

`http://localhost:8000`

API documentation is available at:

`http://localhost:8000/docs`

### 3. Set up the frontend

Open another terminal from the repository root:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at:

`http://localhost:3000`

### 4. Run Phase 1

Download the required Instacart dataset files from Kaggle and place them in `Phase1/data/raw/`.

Install Phase 1 dependencies:

```bash
cd Phase1
pip install -r requirements.txt
```

Run the Phase 1 pipeline:

```bash
python -m scripts.run_phase1 --max-orders 30000
```

The Phase 1 notebooks can also be opened and executed using Jupyter.

### 5. Run tests

Backend tests can be executed from the repository root:

```bash
python -m pytest backend/tests -v
```

Phase 1 tests can be executed from the `Phase1` directory:

```bash
python -m pytest tests -v
```

## Conclusion

The project demonstrates how market basket analysis can be used to discover purchasing relationships and support grocery product recommendations.

Apriori and FP-Growth produced matching frequent itemsets and association rules in the tested parameter configurations. FP-Growth was faster in the selected configuration. The recommendation evaluation showed that association rules alone were less effective than popularity-based recommendations, while the hybrid strategy achieved modest improvements over the popularity baseline and maintained full recommendation coverage.

The completed application brings together the data-mining results, product catalogue, shopping basket, and recommendation functionality in a single web interface.

## Limitations and Future Work

- The analysis uses a reproducible sample of 30,000 prior orders rather than the entire original dataset.
- Association rules do not activate for every basket, so popularity-based fallback recommendations are required.
- The measured improvement of the hybrid approach over popularity alone is modest.
- The dataset represents historical Instacart purchasing behavior and may not reflect current customer preferences.
- Product prices and real-time inventory information are not provided by the original dataset.
- Future work could explore larger datasets, additional recommendation strategies, richer user-context features, and deployment for real-world usage.

## License and Dataset Attribution

The transaction data is sourced from the [Instacart Market Basket Analysis dataset on Kaggle](https://www.kaggle.com/datasets/psparks/instacart-market-basket-analysis). Refer to the dataset source for its terms of use and attribution requirements.
