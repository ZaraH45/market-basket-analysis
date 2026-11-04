"""Run Phase 1 cleaning and EDA on bundled REAL Instacart sample."""
import argparse
from scripts.pipeline import ROOT,run
from scripts.eda import make_charts

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--max-orders',type=int,default=30000)
    args=p.parse_args()
    run(ROOT/'data/raw', ROOT/'data/processed', args.max_orders)
    make_charts(ROOT/'data/processed', ROOT/'images/real', ROOT/'reports/real', mode='real')

if __name__=='__main__': main()
