
"""Phase 1 only: read, audit, clean, generate baskets and EDA-ready tables.

Real mode reads the original Instacart tables. A deterministic sample of prior
order IDs is selected before scanning the large prior-items file in chunks.
This allows the pipeline to process a reproducible sample without loading the
entire 578MB prior-items file into memory.
"""

from pathlib import Path
import argparse
import json

import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]

REQUIRED = [
    'orders.csv',
    'order_products__prior.csv',
    'products.csv',
    'aisles.csv',
    'departments.csv'
]


def load_data(data_dir, max_orders=30000, seed=42):
    data_dir = Path(data_dir)

    missing = []
    for filename in REQUIRED:
        if not (data_dir / filename).exists():
            missing.append(filename)

    if missing:
        raise FileNotFoundError(
            f"Missing files: {missing} in {data_dir}. "
            "Download the original Instacart CSV files from Kaggle "
            "and place them in the data/raw directory."
        )

    orders = pd.read_csv(data_dir / 'orders.csv')
    products = pd.read_csv(data_dir / 'products.csv')
    aisles = pd.read_csv(data_dir / 'aisles.csv')
    departments = pd.read_csv(data_dir / 'departments.csv')

    # Select only valid prior order IDs.
    numeric_ids = pd.to_numeric(orders['order_id'], errors='coerce')

    valid_ids = (
        numeric_ids.notna()
        & np.isfinite(numeric_ids)
        & numeric_ids.eq(np.floor(numeric_ids))
        & numeric_ids.gt(0)
        & orders['eval_set'].eq('prior')
    )

    prior_order_ids = (
        numeric_ids.loc[valid_ids]
        .astype('int64')
        .drop_duplicates()
    )

    total_prior_orders = len(prior_order_ids)

    if max_orders < 0:
        raise ValueError("max_orders must be zero or a positive integer.")

    if max_orders and total_prior_orders > max_orders:
        sampled = prior_order_ids.sample(
            n=max_orders,
            random_state=seed
        )
    else:
        sampled = prior_order_ids

    chosen = set(sampled.tolist())

    # Retain the complete order records for selected order IDs.
    orders = orders.loc[
        numeric_ids.isin(chosen)
    ].copy()

    # Read the large prior-items file in chunks.
    chunks = []

    for chunk in pd.read_csv(
        data_dir / 'order_products__prior.csv',
        chunksize=250000
    ):
        subset = chunk.loc[chunk['order_id'].isin(chosen)]

        if not subset.empty:
            chunks.append(subset)

    if chunks:
        prior = pd.concat(chunks, ignore_index=True)
    else:
        prior = pd.DataFrame(
            columns=[
                'order_id',
                'product_id',
                'add_to_cart_order',
                'reordered'
            ]
        )

    tables = {
        'orders': orders,
        'order_products': prior,
        'products': products,
        'aisles': aisles,
        'departments': departments
    }

    return tables, total_prior_orders


def audit(df):
    return {
        'rows': int(len(df)),
        'columns': list(df.columns),
        'missing_by_column': {
            column: int(count)
            for column, count in df.isna().sum().items()
        },
        'exact_duplicates': int(df.duplicated().sum())
    }


def clean_positive_integer_keys(df, keys):
    """Convert key columns to positive integers and remove invalid rows."""

    valid = pd.Series(True, index=df.index)

    for key in keys:
        numeric = pd.to_numeric(df[key], errors='coerce')

        column_valid = (
            numeric.notna()
            & np.isfinite(numeric)
            & numeric.eq(np.floor(numeric))
            & numeric.gt(0)
        )

        valid = valid & column_valid

    df = df.loc[valid].copy()

    for key in keys:
        numeric = pd.to_numeric(df[key], errors='coerce')
        df[key] = numeric.astype('int64')

    return df


def clean_and_build(tables):
    o = tables['orders'].copy()
    line = tables['order_products'].copy()
    p = tables['products'].copy()
    a = tables['aisles'].copy()
    d = tables['departments'].copy()

    before = {}

    before['orders'] = audit(o)
    before['order_products'] = audit(line)
    before['products'] = audit(p)
    before['aisles'] = audit(a)
    before['departments'] = audit(d)

    removed = {}

    # Remove exact duplicates first.
    frames = [
        ('orders', o, ['order_id']),
        ('order_products', line, ['order_id', 'product_id']),
        ('products', p, ['product_id']),
        ('aisles', a, ['aisle_id']),
        ('departments', d, ['department_id'])
    ]

    cleaned_frames = {}

    for name, df, keys in frames:
        original_count = len(df)

        df = df.drop_duplicates().copy()
        df = clean_positive_integer_keys(df, keys)

        # Each key combination should occur only once.
        df = df.drop_duplicates(subset=keys, keep='first').copy()

        removed[name] = original_count - len(df)
        cleaned_frames[name] = df

    o = cleaned_frames['orders']
    line = cleaned_frames['order_products']
    p = cleaned_frames['products']
    a = cleaned_frames['aisles']
    d = cleaned_frames['departments']

    # Validate user IDs separately because order_id is the unique order key.
    numeric_users = pd.to_numeric(o['user_id'], errors='coerce')

    valid_users = (
        numeric_users.notna()
        & np.isfinite(numeric_users)
        & numeric_users.eq(np.floor(numeric_users))
        & numeric_users.gt(0)
    )

    removed['orders_invalid_user_id'] = int((~valid_users).sum())

    o = o.loc[valid_users].copy()
    o['user_id'] = numeric_users.loc[valid_users].astype('int64')

    # Convert order-related numerical columns.
    for column in ['order_dow', 'order_hour_of_day', 'order_number']:
        o[column] = pd.to_numeric(o[column], errors='coerce')

    valid_order_values = (
        o['order_dow'].notna()
        & o['order_dow'].eq(np.floor(o['order_dow']))
        & o['order_dow'].between(0, 6)
        & o['order_hour_of_day'].notna()
        & o['order_hour_of_day'].eq(np.floor(o['order_hour_of_day']))
        & o['order_hour_of_day'].between(0, 23)
        & o['order_number'].notna()
        & o['order_number'].eq(np.floor(o['order_number']))
        & (o['order_number'] >= 1)
    )

    invalid_orders = int((~valid_order_values).sum())
    o = o.loc[valid_order_values].copy()

    o['order_dow'] = o['order_dow'].astype('int64')
    o['order_hour_of_day'] = o['order_hour_of_day'].astype('int64')
    o['order_number'] = o['order_number'].astype('int64')

    # Preserve expected missing values for first orders.
    o['days_since_prior_order'] = pd.to_numeric(
        o['days_since_prior_order'],
        errors='coerce'
    )

    o.loc[
        ~o['days_since_prior_order'].between(0, 30),
        'days_since_prior_order'
    ] = np.nan

    # Validate product positions and reorder flags.
    line['add_to_cart_order'] = pd.to_numeric(line['add_to_cart_order'], errors='coerce')
    line['reordered'] = pd.to_numeric(line['reordered'], errors='coerce')

    valid_positions = (
        line['add_to_cart_order'].notna()
        & np.isfinite(line['add_to_cart_order'])
        & line['add_to_cart_order'].eq(
            np.floor(line['add_to_cart_order'])
        )
        & (line['add_to_cart_order'] >= 1)
    )

    valid_reorder_flags = (line['reordered'].notna() & line['reordered'].isin([0, 1]))
    valid_lines = valid_positions & valid_reorder_flags

    invalid_lines = int((~valid_lines).sum())
    line = line.loc[valid_lines].copy()

    line['add_to_cart_order'] = line['add_to_cart_order'].astype('int64')
    line['reordered'] = line['reordered'].astype('int64')

    # Clean product and category names.
    p['product_name'] = p['product_name'].astype('string').str.strip()
    p = p[
        p['product_name'].notna()
        & p['product_name'].ne('')
    ].copy()

    a['aisle'] = a['aisle'].astype('string').str.strip()
    d['department'] = d['department'].astype('string').str.strip()

    a = a[a['aisle'].notna() & a['aisle'].ne('')].copy()
    d = d[d['department'].notna() & d['department'].ne('')].copy()

    # Construct the product catalog using validated category relationships.
    catalog = p.merge(a, on='aisle_id', how='left', validate='many_to_one')

    catalog = catalog.merge(d, on='department_id', how='left', validate='many_to_one')
    catalog_before_filter = len(catalog)
    catalog = catalog.dropna(subset=['aisle', 'department']).copy()

    invalid_catalog_rows = catalog_before_filter - len(catalog)

    # Join valid order information to the product purchase records.
    line_before_order_join = len(line)

    line = line.merge(
        o[
            [
                'order_id',
                'user_id',
                'order_dow',
                'order_hour_of_day',
                'days_since_prior_order'
            ]
        ],
        on='order_id',
        how='inner',
        validate='many_to_one'
    )

    line_after_order_join = len(line)

    # Attach product and category information.
    line = line.merge(
        catalog,
        on='product_id',
        how='inner',
        validate='many_to_one'
    )

    line_after_catalog_join = len(line)

    line = line.sort_values(['order_id', 'add_to_cart_order', 'product_id'] ).reset_index(drop=True)

    # Build one basket for every order with valid product lines.
    # Sort by product ID so product IDs and names remain aligned.

    basket_items = (
        line.drop_duplicates(subset=['order_id', 'product_id'])
        .sort_values(['order_id', 'product_id'])
        .copy()
    )

    baskets = basket_items.groupby(
        'order_id',
        sort=True
    ).agg(
        user_id=('user_id', 'first'),
        basket_size=('product_id', 'nunique'),
        product_ids=(
            'product_id',
            lambda values: '|'.join(map(str, values))
        ),
        product_names=(
            'product_name',
            lambda values: ' | '.join(map(str, values))
        ),
        order_dow=('order_dow', 'first'),
        order_hour_of_day=('order_hour_of_day', 'first')
    ).reset_index()

    # Verify basket integrity before exporting.
    if baskets['order_id'].duplicated().any():
        raise ValueError("Basket construction produced duplicate order IDs.")

    for basket in baskets.itertuples(index=False):
        product_ids = str(basket.product_ids).split('|')
        unique_product_ids = set(product_ids)

        if basket.basket_size != len(unique_product_ids):
            raise ValueError(
                f"Basket size mismatch for order {basket.order_id}."
            )

    stats = {
        'audit_before': before,
        'cleaning': {
            'removed_duplicate_or_invalid_key_rows': removed,
            'invalid_order_time_rows_removed': invalid_orders,
            'invalid_line_flags_or_positions_removed': invalid_lines,
            'invalid_catalog_rows_removed': invalid_catalog_rows,
            'first_order_missing_days_since_prior_order':
                'Kept as NA because it represents expected structural missingness.',
            'outlier_policy':
                'Invalid order times and cart positions are excluded. '
                'Genuine large baskets are retained. '
                'Days since prior order must be within 0 to 30.',
            'scaling':
                'Not applied: product IDs are categorical identifiers. '
                'Apriori and FP-Growth use item presence in baskets, '
                'not continuous product ID values.'
        },
        'joins': {
            'order_lines_before_order_join': line_before_order_join,
            'order_lines_after_order_join': line_after_order_join,
            'order_lines_after_catalog_join': line_after_catalog_join
        },
        'after': {
            'orders': len(o),
            'order_product_rows': len(line),
            'products_catalog': len(catalog),
            'nonempty_baskets': len(baskets)
        }
    }

    output = {
        'orders': o,
        'order_products_clean': line,
        'product_catalog': catalog,
        'baskets': baskets
    }

    return output, stats


def run(data_dir, output_dir, max_orders=30000, seed=42):
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    tables, total_prior_orders = load_data(data_dir, max_orders, seed)
    selected_prior_orders = len(tables['orders'])
    output, report = clean_and_build(tables)

    report.update({
        'data_mode': 'real',
        'dataset_source': (
            'Instacart Market Basket Analysis dataset from Kaggle. '
            'The original CSV files are downloaded separately and are '
            'not included in the GitHub repository.'
        ),
        'total_prior_orders_in_source': total_prior_orders,
        'selected_prior_orders': selected_prior_orders,
        'sampling_method': (
            f'Deterministic random sample of prior order IDs using seed '
            f'{seed}. Complete product lines for selected orders are '
            'filtered in chunks. This is not a chronological split.'
        ),
        'max_orders_requested': max_orders,
        'random_seed': seed
    })

    for name, df in output.items():
        df.to_csv(output_dir / f'{name}.csv', index=False)

    report_path = output_dir / 'cleaning_report.json'
    report_path.write_text(json.dumps(report, indent=2, default=str), encoding='utf-8')

    print(json.dumps({'mode': 'real', 'output': str(output_dir), 'rows': report['after']}, indent=2))

    return output, report


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--max-orders', type=int, default=30000, help='Number of prior orders to analyze; 0 for all available.')
    parser.add_argument('--seed', type=int, default=42)
    args = parser.parse_args()
    run(ROOT / 'data/raw', ROOT / 'data/processed', args.max_orders, args.seed)

if __name__ == '__main__':
    main()
