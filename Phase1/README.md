# Instacart Market Basket Analysis

## Project Overview

This project explores grocery shopping patterns using the Instacart Market Basket Analysis dataset. The objective is to prepare and analyze historical transaction data to support the development of a basket-based product recommendation system.

Phase 1 focuses on data cleaning, preprocessing, exploratory data analysis (EDA), and identifying meaningful purchasing patterns.

## Dataset

**Source:** [Instacart Market Basket Analysis — Kaggle](https://www.kaggle.com/datasets/psparks/instacart-market-basket-analysis)

The dataset contains historical grocery orders, product information, and product categories.

The original dataset consists of six CSV files:

| File | Description |
|---|---|
| `orders.csv` | Order information and purchasing patterns |
| `order_products__prior.csv` | Products purchased in prior orders |
| `order_products__train.csv` | Products associated with training orders |
| `products.csv` | Product names and category identifiers |
| `aisles.csv` | Product aisle information |
| `departments.csv` | Product department information |

The original dataset contains approximately 3.2 million orders and 49,688 products.

The Phase 1 pipeline requires five files: `orders.csv`, `order_products__prior.csv`, `products.csv`, `aisles.csv`, and `departments.csv`. The training-order product file is not used in this phase.

### Features

Key attributes include `order_id`, `user_id`, `product_id`, `product_name`, `order_number`, `order_dow`, `order_hour_of_day`, `days_since_prior_order`, `department_id`, `aisle_id`, `reordered`, and `add_to_cart_order`.

Since the project uses unsupervised association analysis, no supervised target variable is defined.

### Analysis Scope

A reproducible random sample of **30,000 prior orders**, selected using random seed 42, was used for the Phase 1 analysis. This is not a chronological split. All product lines belonging to each selected order are retained, preserving complete transaction baskets.

The sample contains:

- 30,000 selected prior orders
- 302,305 cleaned product purchase records
- 30,000 non-empty shopping baskets

The original Kaggle CSV files must be downloaded separately and placed in `data/raw/`. They are not bundled with the repository and are excluded from Git due to their size.

## Project Structure

```text
Phase1/
├── data/
│   ├── raw/
│   └── processed/
├── notebooks/
│   ├── 01_Data_Cleaning.ipynb
│   ├── 02_EDA.ipynb
│   └── 03_Preprocessing.ipynb
├── images/
│   └── real/
├── reports/
│   └── real/
├── scripts/
│   ├── pipeline.py
│   ├── eda.py
│   └── run_phase1.py
├── tests/
│   └── test_pipeline.py
├── requirements.txt
└── README.md
```

## Data Cleaning and Preprocessing

The data preparation pipeline includes:

- Inspection of dataset dimensions, data types, and missing values.
- Identification and handling of duplicate records and invalid identifiers.
- Validation of product-category relationships and transaction records.
- Examination of order times, reorder indicators, and cart positions.
- Preservation of expected missing values in `days_since_prior_order`.
- Identification and examination of basket-size outliers.
- Integration of product, aisle, and department information.
- Conversion of transaction records into shopping baskets.

Feature scaling is not required because the planned association-rule algorithms operate on categorical product identifiers and binary item-presence representations.

## Exploratory Data Analysis

Seven visualizations were generated to understand purchasing behavior:

1. **Top Products:** Identifies the most frequently purchased products.
2. **Basket Size Distribution:** Examines the number of products purchased per order.
3. **Order Day Distribution:** Shows purchasing frequency across encoded day values.
4. **Order Hour Distribution:** Analyzes shopping activity across different hours.
5. **Department Popularity:** Identifies frequently purchased product categories.
6. **Basket Size Boxplot:** Illustrates basket-size variation and potential outliers.
7. **Correlation Heatmap:** Explores relationships among selected numerical variables.

Visualizations are available in `images/real/`, with additional analysis documented in `reports/real/INSIGHTS.md`.

## Key Findings

The analysis of 30,000 prior orders produced the following observations:

| Metric | Result |
|---|---|
| Average basket size | 10.08 products |
| Median basket size | 8 products |
| Most frequently purchased product | Banana |
| Banana purchase records | 4,310 |
| Most popular department | Produce |
| Produce purchase records | 87,854 |
| Most frequent order-day code | 0 |
| Most frequent ordering hour | 10 |
| Reordered product rate | Approximately 59.2% |

These findings represent the selected sample rather than the entire dataset. Encoded day values are retained without assuming specific weekday names. The reorder rate is calculated across cleaned product purchase records.

## Technologies Used

- Python
- Pandas
- NumPy
- Matplotlib
- Seaborn
- Jupyter Notebook
- VS Code
- Git and GitHub

## Installation and Execution

### 1. Clone the repository

```bash
git clone https://github.com/ZaraH45/market-basket-analysis.git
```

Navigate to the `Phase1` directory.

### 2. Install dependencies

```bash
python -m pip install -r requirements.txt
```

### 3. Prepare the dataset

Download the original Instacart dataset from Kaggle, extract the five required CSV files, and place them inside `Phase1/data/raw/`:

- `orders.csv`
- `order_products__prior.csv`
- `products.csv`
- `aisles.csv`
- `departments.csv`

The `order_products__train.csv` file is not required by the Phase 1 pipeline.

### 4. Run the preprocessing and analysis pipeline

```bash
python -m scripts.run_phase1 --max-orders 30000
```

This generates processed data, EDA visualizations, and analysis reports.

### 5. Execute the notebooks

Open the notebooks in the `notebooks/` directory and execute the cells using a Python environment with the required dependencies installed.

### 6. Run the tests

```bash
python -m pytest tests -v
```

## Outputs

The Phase 1 implementation provides:

- Cleaned and validated transaction data
- Processed product catalog
- Shopping baskets prepared for association analysis
- Data quality reports
- Seven EDA visualizations
- Written findings and statistical summaries
- Reproducible Python scripts and Jupyter notebooks

Processed CSV files are generated locally by the pipeline and are excluded from Git. The cleaning report, EDA visualizations, and findings are maintained as repository outputs.

## Next Phase

The processed transaction baskets will support association-rule mining using Apriori and FP-Growth, followed by basket-based product recommendations and system integration.
