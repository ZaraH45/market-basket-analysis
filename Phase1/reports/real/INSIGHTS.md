# REAL INSTACART SAMPLE — PHASE 1 FINDINGS

- 30,000 non-empty prior baskets were analyzed.
- Mean basket size: 10.08 unique products; median: 8.
- Most frequent product: Banana (4,310 order lines).
- Most frequently represented department: produce (87,854 order lines).
- Most common encoded day: 0; peak order hour: 10:00.
- Reordered flag prevalence across cleaned order lines: 59.2%. This is not a classification target for Phase 1.

## Visualization explanations

- **01_top_products.png**: Products with the largest number of observed purchased order lines; occurrence does not measure revenue.
- **02_basket_sizes.png**: Shows whether typical orders contain few or many unique items; high values may be genuine, not errors.
- **03_order_day.png**: Shows ordering frequency by dataset day code 0–6; original data does not explicitly define calendar weekday names.
- **04_order_hour.png**: Shows peak ordering hours in the chosen sample, useful for browsing trends.
- **05_departments.png**: Higher counts indicate more frequently purchased items from a department, not necessarily more spending.
- **06_basket_boxplot.png**: Points beyond whiskers are potentially interesting large baskets; do not automatically remove them.
- **07_numeric_correlations.png**: Exploratory linear correlations only; order rows repeat across items and this does not imply causal relationships.

## Modeling readiness (Phase 2)

- Use cleaned `baskets.csv` and item ID fields for basket-based association mining.
- Do not scale IDs. If evaluating recommendations, split data without leaking held-out baskets.
- Category frequencies are imbalanced; report top-heavy product popularity and evaluate across popularity tiers.
- These are descriptive results; no prediction or association-rule mining occurs in Phase 1.
