import pandas as pd
from scripts.pipeline import ROOT, load_data, clean_and_build

def test_real_input_sample_integrity():
    data, n = load_data(ROOT/'data/raw', max_orders=25, seed=42)
    assert n == 3214874
    clean, report = clean_and_build(data)
    assert len(clean['baskets']) > 0
    assert clean['baskets'].basket_size.min() >= 1
    assert clean['order_products_clean'].product_id.notna().all()
    assert report['after']['nonempty_baskets'] <= 25
