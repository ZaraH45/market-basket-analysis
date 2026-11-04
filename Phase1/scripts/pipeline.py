"""Phase 1 only: read, audit, clean, generate baskets and EDA-ready tables.

Real mode reads original Instacart tables. A deterministic sample of *orders*
is selected before scanning the large prior-items file in chunks, so a laptop
can handle the 578MB original file without loading it entirely into RAM.
"""
from pathlib import Path
import argparse, json
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = ['orders.csv','order_products__prior.csv','products.csv','aisles.csv','departments.csv']
INTEGER_KEYS={'order_id','product_id','user_id','aisle_id','department_id'}

def load_data(data_dir, max_orders=30000, seed=42):
    data_dir=Path(data_dir)
    missing=[f for f in REQUIRED if not (data_dir/f).exists()]
    if missing: raise FileNotFoundError(f"Missing {missing} in {data_dir}. Download original Instacart CSVs from Kaggle or use included real order-level sample.")
    orders=pd.read_csv(data_dir/'orders.csv')
    products=pd.read_csv(data_dir/'products.csv')
    aisles=pd.read_csv(data_dir/'aisles.csv')
    departments=pd.read_csv(data_dir/'departments.csv')
    prior_order_ids=orders.loc[orders['eval_set'].eq('prior'),'order_id'].dropna().drop_duplicates()
    if max_orders and len(prior_order_ids)>max_orders:
        sampled=prior_order_ids.sample(n=max_orders,random_state=seed)
    else: sampled=prior_order_ids
    chosen=set(sampled.astype('int64').tolist())
    orders=orders[orders['order_id'].isin(chosen)].copy()
    chunks=[]
    for chunk in pd.read_csv(data_dir/'order_products__prior.csv',chunksize=250000):
        subset=chunk.loc[chunk['order_id'].isin(chosen)]
        if not subset.empty:chunks.append(subset)
    prior=pd.concat(chunks,ignore_index=True) if chunks else pd.DataFrame(columns=['order_id','product_id','add_to_cart_order','reordered'])
    return {'orders':orders,'order_products':prior,'products':products,'aisles':aisles,'departments':departments},len(prior_order_ids)

def audit(df):
    return {'rows':int(len(df)),'columns':list(df.columns),'missing_by_column':{k:int(v) for k,v in df.isna().sum().items()},'exact_duplicates':int(df.duplicated().sum())}

def clean_and_build(tables):
    o=tables['orders'].copy();line=tables['order_products'].copy()
    p=tables['products'].copy();a=tables['aisles'].copy();d=tables['departments'].copy()
    before={name:audit(df) for name,df in tables.items()}
    # No attempt to impute unknown shopping behavior or assign invented values.
    # Original days_since_prior_order missing for each customer's first order is structural.
    frames=[(o,['order_id']), (line,['order_id','product_id']), (p,['product_id']), (a,['aisle_id']), (d,['department_id'])]
    removed={}
    for df, keys in frames:
        n=len(df);df.drop_duplicates(inplace=True);df.dropna(subset=keys,inplace=True)
        for k in keys: df[k]=pd.to_numeric(df[k],errors='coerce')
        df.dropna(subset=keys,inplace=True)
        df.drop_duplicates(subset=keys,keep='first',inplace=True)
        removed[','.join(keys)]=n-len(df)
    # Drop impossible day/hour/order values, do not cap genuine large basket sizes.
    valid=(o['order_dow'].between(0,6)&o['order_hour_of_day'].between(0,23)&(o['order_number']>=1))
    invalid_orders=int((~valid).sum());o=o.loc[valid].copy()
    o['days_since_prior_order']=pd.to_numeric(o['days_since_prior_order'],errors='coerce')
    o.loc[~o['days_since_prior_order'].between(0,30),'days_since_prior_order']=np.nan
    # First-order missing interval is expected. No mean/zero imputation.
    for col in ['add_to_cart_order','reordered']:line[col]=pd.to_numeric(line[col],errors='coerce')
    valid_line=(line['add_to_cart_order']>=1)&line['reordered'].isin([0,1])
    invalid_lines=int((~valid_line).sum());line=line.loc[valid_line].copy()
    p['product_name']=p['product_name'].astype('string').str.strip()
    p=p[p['product_name'].notna() & p['product_name'].ne('')]
    a['aisle']=a['aisle'].astype('string').str.strip()
    d['department']=d['department'].astype('string').str.strip()
    catalog=p.merge(a,on='aisle_id',how='left',validate='many_to_one').merge(d,on='department_id',how='left',validate='many_to_one')
    # Reject broken foreign key records instead of hallucinating products/categories.
    catalog=catalog.dropna(subset=['aisle','department'])
    line=line.merge(o[['order_id','user_id','order_dow','order_hour_of_day','days_since_prior_order']],on='order_id',how='inner',validate='many_to_one')
    line=line.merge(catalog,on='product_id',how='inner',validate='many_to_one')
    line=line.sort_values(['order_id','add_to_cart_order','product_id']).reset_index(drop=True)
    # Repeated product/order rows are removed upstream; orders without valid lines have no basket.
    baskets=line.groupby('order_id',sort=True).agg(user_id=('user_id','first'),basket_size=('product_id','nunique'),product_ids=('product_id',lambda s:'|'.join(map(str,sorted(s.unique())))),product_names=('product_name',lambda s:' | '.join(sorted(map(str,s.unique())))),order_dow=('order_dow','first'),order_hour_of_day=('order_hour_of_day','first')).reset_index()
    stats={'audit_before':before,'cleaning':{'removed_duplicate_or_null_key_rows':removed,'invalid_order_time_rows_removed':invalid_orders,'invalid_line_flags_or_positions_removed':invalid_lines,'first_order_missing_days_since_prior_order':'kept as NA (expected structural missingness)','outlier_policy':'invalid hours/days/positions excluded; true high basket sizes retained; 0..30 days valid interval','scaling':'Not applied: categorical product IDs are identifiers and Apriori/FP-Growth consume binary basket presence, not continuous features.'},'after':{'orders':len(o),'order_product_rows':len(line),'products_catalog':len(catalog),'nonempty_baskets':len(baskets)}}
    return {'orders':o,'order_products_clean':line,'product_catalog':catalog,'baskets':baskets},stats

def run(data_dir,output_dir,max_orders=30000,seed=42):
    output_dir=Path(output_dir);output_dir.mkdir(parents=True,exist_ok=True)
    tables,total_prior_orders=load_data(data_dir,max_orders,seed)
    out,report=clean_and_build(tables)
    report.update({'data_mode':'real','dataset_source':'Instacart Kaggle: complete 30,000-order reproducible prior-order sample (source tables bundled)','total_prior_orders_in_source':total_prior_orders,'selected_prior_orders':len(tables['orders']),'sampling_method':f'deterministic random sample of prior order IDs with seed {seed}; item lines filtered in chunks; not a time series split','max_orders_requested':max_orders})
    for name,df in out.items(): df.to_csv(output_dir/f'{name}.csv',index=False)
    (output_dir/'cleaning_report.json').write_text(json.dumps(report,indent=2,default=str),encoding='utf-8')
    print(json.dumps({'mode':'real','output':str(output_dir),'rows':report['after']},indent=2))
    return out,report

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--max-orders',type=int,default=30000,help='Number of prior orders to analyze; 0 for all available')
    parser.add_argument('--seed',type=int,default=42)
    args=parser.parse_args()
    run(ROOT/'data/raw', ROOT/'data/processed', args.max_orders, args.seed)
if __name__=='__main__':main()
