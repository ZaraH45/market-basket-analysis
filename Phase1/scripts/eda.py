"""Descriptive EDA + visual explanations (no ML / association rule mining)."""
import argparse, json
from pathlib import Path
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from scripts.pipeline import ROOT
sns.set_theme(style='whitegrid')

def make_charts(processed,image_dir,report_dir,mode='real'):
    processed=Path(processed);image_dir=Path(image_dir);report_dir=Path(report_dir)
    image_dir.mkdir(parents=True,exist_ok=True);report_dir.mkdir(parents=True,exist_ok=True)
    line=pd.read_csv(processed/'order_products_clean.csv');baskets=pd.read_csv(processed/'baskets.csv');orders=pd.read_csv(processed/'orders.csv')

    if line.empty or baskets.empty: raise ValueError('No cleaned order lines; check input data.')
    charts=[]

    def save(name,title,meaning):
        plt.title(title);plt.tight_layout();plt.savefig(image_dir/f'{name}.png',dpi=150,bbox_inches='tight');plt.close()
        charts.append({'filename':f'{name}.png','interpretation':meaning})

    top=line['product_name'].value_counts().head(12)
    plt.figure(figsize=(10,5));sns.barplot(x=top.values,y=top.index,color='steelblue');plt.xlabel('Order line occurrences');plt.ylabel('Product')

    save('01_top_products','Top 12 frequently purchased products','Products with the largest number of observed purchased order lines; occurrence does not measure revenue.')
    plt.figure(figsize=(9,5));sns.histplot(baskets['basket_size'],bins=min(30,max(5,int(baskets['basket_size'].max()))),color='steelblue');plt.xlabel('Unique products per basket');plt.ylabel('Orders')

    save('02_basket_sizes','Basket size distribution','Shows whether typical orders contain few or many unique items; high values may be genuine, not errors.')
    dow=baskets['order_dow'].value_counts().reindex(range(7),fill_value=0)
    plt.figure(figsize=(8,4));sns.barplot(x=dow.index,y=dow.values,color='steelblue');plt.xlabel('Encoded day of week (0–6; weekday names unverified)');plt.ylabel('Non-empty baskets')
    save('03_order_day','Orders by encoded day of week','Shows ordering frequency by dataset day code 0–6; original data does not explicitly define calendar weekday names.')
    hours=baskets['order_hour_of_day'].value_counts().reindex(range(24),fill_value=0)
    plt.figure(figsize=(10,4));sns.barplot(x=hours.index,y=hours.values,color='steelblue');plt.xlabel('Hour of day (0–23)');plt.ylabel('Non-empty baskets')
    save('04_order_hour','Orders by hour','Shows peak ordering hours in the chosen sample, useful for browsing trends.')
    dept=line['department'].value_counts().head(12)
    plt.figure(figsize=(9,5));sns.barplot(x=dept.values,y=dept.index,color='steelblue');plt.xlabel('Purchased order lines');plt.ylabel('Department')
    save('05_departments','Top departments by purchase lines','Higher counts indicate more frequently purchased items from a department, not necessarily more spending.')
    plt.figure(figsize=(7,4));sns.boxplot(x=baskets['basket_size'],color='lightblue');plt.xlabel('Unique items per order')
    save('06_basket_boxplot','Basket-size boxplot','Points beyond whiskers are potentially interesting large baskets; do not automatically remove them.')
    # This matrix is descriptive; product ids are categorical and must not be correlated as numbers.
    numeric=line[['add_to_cart_order','reordered','order_hour_of_day','order_dow','days_since_prior_order']]
    corr=numeric.corr(numeric_only=True)

    plt.figure(figsize=(8,6));sns.heatmap(corr,annot=True,cmap='coolwarm',vmin=-1,vmax=1,fmt='.2f');plt.title('Descriptive numeric correlations');plt.tight_layout();plt.savefig(image_dir/'07_numeric_correlations.png',dpi=150,bbox_inches='tight');plt.close()
    charts.append({'filename':'07_numeric_correlations.png','interpretation':'Exploratory linear correlations only; order rows repeat across items and this does not imply causal relationships.'})
    n_orders=len(baskets);mean_size=float(baskets['basket_size'].mean());med_size=float(baskets['basket_size'].median())
    reorder=float(line['reordered'].mean()) if line['reordered'].notna().any() else 0
    peak_hour=int(hours.idxmax());peak_day=int(dow.idxmax());top_product=str(top.index[0]);top_department=str(dept.index[0])
    findings=[f'{n_orders:,} non-empty prior baskets were analyzed.',f'Mean basket size: {mean_size:.2f} unique products; median: {med_size:.0f}.',f'Most frequent product: {top_product} ({int(top.iloc[0]):,} order lines).',f'Most frequently represented department: {top_department} ({int(dept.iloc[0]):,} order lines).',f'Most common encoded day: {peak_day}; peak order hour: {peak_hour}:00.',f'Reorder flag prevalence across cleaned product purchase lines: {reorder:.1%}. This is not a classification target for Phase 1.']
    title='SYNTHETIC DEMO — NOT SUBMISSION FINDINGS' if mode=='demo' else 'REAL INSTACART SAMPLE — PHASE 1 FINDINGS'
    summary='# '+title+'\n\n'+'\n'.join('- '+x for x in findings)+'\n\n## Visualization explanations\n\n'+'\n'.join(f'- **{c["filename"]}**: {c["interpretation"]}' for c in charts)+'\n\n## Modeling readiness (Phase 2)\n\n- Use cleaned `baskets.csv` and item ID fields for basket-based association mining.\n- Do not scale IDs. If evaluating recommendations, split data without leaking held-out baskets.\n- Category frequencies are imbalanced; report top-heavy product popularity and evaluate across popularity tiers.\n- These are descriptive results; no prediction or association-rule mining occurs in Phase 1.\n'
    (report_dir/'INSIGHTS.md').write_text(summary,encoding='utf-8')
    metrics={'mode':mode,'analyzed_baskets':n_orders,'mean_basket_size':mean_size,'median_basket_size':med_size,'reordered_rate':reorder,'reorder_rate_basis':'Cleaned product purchase lines','top_product':top_product,'top_department':top_department,'peak_hour':peak_hour,'peak_encoded_day':peak_day,'charts':charts}
    (report_dir/'eda_metrics.json').write_text(json.dumps(metrics,indent=2),encoding='utf-8')

    print('Saved 7 charts to',image_dir,'and insights to',report_dir)
    return metrics

def main():
    p=argparse.ArgumentParser();p.add_argument('--demo',action='store_true');args=p.parse_args()
    if args.demo:make_charts(ROOT/'data/demo_processed',ROOT/'images/demo',ROOT/'reports/demo','demo')
    else:make_charts(ROOT/'data/processed',ROOT/'images/real',ROOT/'reports/real','real')

if __name__=='__main__':main()
