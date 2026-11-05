import pandas as pd
from scripts.pipeline import clean_and_build


def create_test_data():

    orders = pd.DataFrame({
        'order_id': [101, 102, 103],
        'user_id': [1, 2, 3],
        'order_number': [1, 2, 1],
        'order_dow': [0, 2, 4],
        'order_hour_of_day': [10, 14, 18],
        'days_since_prior_order': [None, 5.0, None]
    })

    order_products = pd.DataFrame({
        'order_id': [101, 101, 102, 103, 101],
        'product_id': [1, 2, 2, 3, 1],
        'add_to_cart_order': [1, 2, 1, 1, 3],
        'reordered': [0, 1, 0, 0, 1]
    })

    products = pd.DataFrame({
        'product_id': [1, 2, 3],
        'product_name': ['Banana', 'Milk', 'Bread'],
        'aisle_id': [10, 10, 11],
        'department_id': [20, 20, 21]
    })

    aisles = pd.DataFrame({
        'aisle_id': [10, 11],
        'aisle': ['fresh fruits', 'bakery']
    })

    departments = pd.DataFrame({
        'department_id': [20, 21],
        'department': ['produce', 'bakery']
    })

    return {
        'orders': orders,
        'order_products': order_products,
        'products': products,
        'aisles': aisles,
        'departments': departments
    }


def test_basket_construction_and_integrity():

    data = create_test_data()

    cleaned, report = clean_and_build(data)

    baskets = cleaned['baskets']
    lines = cleaned['order_products_clean']
    catalog = cleaned['product_catalog']

    # All three orders should produce non-empty baskets.
    assert len(baskets) == 3

    # Every order should have exactly one basket.
    assert baskets['order_id'].is_unique

    # Every basket must contain at least one product.
    assert (baskets['basket_size'] >= 1).all()

    # Basket contents and size must match the cleaned purchase lines.
    for basket in baskets.itertuples(index=False):

        product_ids = set(str(basket.product_ids).split('|'))

        order_lines = lines.loc[
            lines['order_id'] == basket.order_id,
            'product_id'
        ]

        line_product_ids = set(order_lines.astype(str))

        assert product_ids == line_product_ids
        assert basket.basket_size == len(line_product_ids)

    # An order-product pair must not occur more than once.
    assert not lines.duplicated(subset=['order_id', 'product_id']).any()

    assert report['cleaning']['removed_duplicate_or_invalid_key_rows']['order_products'] == 1
    # Every purchased product must exist in the product catalog.
    catalog_ids = set(catalog['product_id'])

    for product_id in lines['product_id']:
        assert product_id in catalog_ids

    # Reorder flags must be binary.
    assert lines['reordered'].isin([0, 1]).all()

    # Cart positions must be positive.
    assert (lines['add_to_cart_order'] >= 1).all()

    # First-order missing intervals should remain missing.
    first_order = cleaned['orders'].loc[
        cleaned['orders']['order_id'] == 101,
        'days_since_prior_order'
    ]

    assert first_order.isna().all()

    # Reported counts must match the actual output.
    assert report['after']['orders'] == len(cleaned['orders'])
    assert report['after']['order_product_rows'] == len(lines)
    assert report['after']['products_catalog'] == len(catalog)
    assert report['after']['nonempty_baskets'] == len(baskets)


def test_invalid_order_lines_are_removed():

    data = create_test_data()

    # Add a line with an invalid cart position.
    invalid_line = pd.DataFrame({
        'order_id': [101],
        'product_id': [3],
        'add_to_cart_order': [0],
        'reordered': [0]
    })

    # Add a line with an invalid reorder flag.
    invalid_flag = pd.DataFrame({
        'order_id': [102],
        'product_id': [3],
        'add_to_cart_order': [2],
        'reordered': [2]
    })

    data['order_products'] = pd.concat(
        [data['order_products'], invalid_line, invalid_flag],
        ignore_index=True
    )

    cleaned, report = clean_and_build(data)

    # Both invalid lines should be removed.
    assert report['cleaning']['invalid_line_flags_or_positions_removed'] == 2

    assert not (
        (cleaned['order_products_clean']['add_to_cart_order'] < 1)
    ).any()

    assert cleaned['order_products_clean']['reordered'].isin([0, 1]).all()
