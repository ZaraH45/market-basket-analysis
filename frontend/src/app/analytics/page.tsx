
"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import MetricCard from "@/components/analytics/metric-card";

type MiningStats = {
  transactions: number;
  products_before_filtering: number;
  products_after_filtering: number;
  minimum_basket_count: number;
  frequent_itemset_count: number;
  association_rule_count: number;
  min_support: number;
  min_confidence: number;
  min_lift: number;
  max_len: number;
};

type EvaluationMetric = {
  method: string;
  k: number;
  precision_at_k: number;
  recall_at_k: number;
  hit_rate_at_k: number;
};

type OverviewData = {
  dataset: {
    transactions: number;
    products_before_filtering: number;
    products_after_filtering: number;
  };
  mining: {
    apriori: MiningStats;
    fpgrowth: MiningStats;
  };
  rule_evaluation: {
    training_baskets: number;
    test_baskets: number;
    test_users: number;
    rules_mined: number;
    test_users_with_at_least_one_activated_rule: number;
    test_coverage: number;
    rule_success_rate: number;
    consequent_item_precision: number;
  };
  hybrid_evaluation: {
    training_baskets: number;
    test_baskets: number;
    test_users: number;
    rules_mined: number;
    users_with_activated_rules: number;
    users_with_rule_recommendations: number;
    users_with_hybrid_recommendations: number;
    rule_activation_coverage: number;
    rule_recommendation_coverage: number;
    hybrid_recommendation_coverage: number;
    recommendation_method: string;
    metrics: EvaluationMetric[];
  };
};

function formatNumber(value: number)
{
  return new Intl.NumberFormat("en-US").format(value);
}

function formatPercent(value: number)
{
  return `${(value * 100).toFixed(2)}%`;
}

function formatDecimal(value: number)
{
  return value.toFixed(4);
}

function getMetric(metrics: EvaluationMetric[], method: string, k: number)
{
  return metrics.find(
    (metric) => metric.method === method && metric.k === k
  );
}

function MetricComparison({label, value,}: {
  label: string;
  value: string;
})
{
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#edf0e9] py-3 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-[#244c38]">{value}</span>
    </div>
  );
}

export default function AnalyticsPage()
{
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadOverview()
    {
      setLoading(true);
      setError("");

      try
      {
        const result = await apiGet<OverviewData>("/analytics/overview");

        if (!cancelled)
        {
          setData(result);
        }
      }
      catch (err)
      {
        if (!cancelled)
        {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load analytics data."
          );
        }
      }
      finally
      {
        if (!cancelled)
        {
          setLoading(false);
        }
      }
    }

    loadOverview();

    return () => {
      cancelled = true;
    };
  }, [retry]);

  if (loading)
  {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[#dce9dc] border-t-[#246b45]" />
          <p className="mt-4 text-sm text-gray-500">
            Loading analytics data...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data)
  {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
        <h2 className="text-lg font-bold text-[#244c38]">
          Unable to load analytics
        </h2>
        <p className="mt-2 text-sm text-red-600">
          {error || "No analytics data was returned by the server."}
        </p>
        <button onClick={() => setRetry((current) => current + 1)}
          className="mt-5 rounded-xl bg-[#246b45] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d5839]">
          Try Again
        </button>
      </div>
    );
  }

  const apriori = data.mining.apriori;
  const fpgrowth = data.mining.fpgrowth;
  const ruleEvaluation = data.rule_evaluation;
  const hybrid = data.hybrid_evaluation;

  const popularityAt5 = getMetric(hybrid.metrics, "popularity", 5);
  const rulesAt5 = getMetric(hybrid.metrics, "association_rules", 5);
  const hybridAt5 = getMetric(hybrid.metrics, "hybrid", 5);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold text-[#679071]">
          BASKETLY / ANALYTICS
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#244c38]">
          Analytics Overview
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
          Explore the dataset, compare frequent pattern mining algorithms, and evaluate association-rule-based recommendations.
        </p>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#244c38]">
            Dataset Summary
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Overview of the transaction data used for mining.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard title="Transactions" value={formatNumber(data.dataset.transactions)} description="Total shopping baskets in the dataset"/>
          <MetricCard title="Products Before Filtering" value={formatNumber(data.dataset.products_before_filtering)}
            description="Unique products in the original data"/>
          <MetricCard title="Products After Filtering" value={formatNumber(data.dataset.products_after_filtering)} description="Products retained for association mining"/>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#244c38]">
            Frequent Pattern Mining
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Apriori and FP-Growth results using the configured mining parameters.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {[
            { name: "Apriori", stats: apriori },
            { name: "FP-Growth", stats: fpgrowth },
          ].map((algorithm) => (
            <div key={algorithm.name} className="rounded-2xl border border-[#e9ede7] bg-white p-5">
              <h3 className="text-base font-bold text-[#246b45]">
                {algorithm.name}
              </h3>

              <div className="mt-3">
                <MetricComparison label="Frequent itemsets" value={formatNumber(algorithm.stats.frequent_itemset_count)}/>
                <MetricComparison label="Association rules" value={formatNumber(algorithm.stats.association_rule_count)}/>
                <MetricComparison label="Minimum basket count" value={formatNumber(algorithm.stats.minimum_basket_count)}/>
              </div>

              <div className="mt-4 rounded-xl bg-[#f5f8f3] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#718477]">
                  Mining Parameters
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">Min Support</p>
                    <p className="mt-1 font-semibold text-[#244c38]">
                      {algorithm.stats.min_support}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Min Confidence</p>
                    <p className="mt-1 font-semibold text-[#244c38]">
                      {algorithm.stats.min_confidence}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Min Lift</p>
                    <p className="mt-1 font-semibold text-[#244c38]">
                      {algorithm.stats.min_lift}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Maximum Length</p>
                    <p className="mt-1 font-semibold text-[#244c38]">
                      {algorithm.stats.max_len}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-[#dce9dc] bg-[#f5f8f3] p-4">
          <p className="text-sm font-semibold text-[#246b45]">
            Algorithm result comparison
          </p>
          <p className="mt-1 text-sm leading-6 text-[#5e7163]">
            Apriori and FP-Growth produced{" "}
            {formatNumber(apriori.frequent_itemset_count)} frequent itemsets and {formatNumber(apriori.association_rule_count)} association
            rules each under the reported baseline parameters.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#244c38]">
            Association Rule Evaluation
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Performance of mined rules on the held-out test baskets.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Training Baskets" value={formatNumber(ruleEvaluation.training_baskets)} description="Baskets used to mine association rules"/>
          <MetricCard title="Test Baskets" value={formatNumber(ruleEvaluation.test_baskets)} description="Held-out baskets used for evaluation"/>
          <MetricCard title="Mined Rules" value={formatNumber(ruleEvaluation.rules_mined)} description="Rules evaluated on the test set"/>
          <MetricCard title="Rule Activation Coverage" value={formatPercent(ruleEvaluation.test_coverage)}
            description={`${formatNumber(ruleEvaluation.test_users_with_at_least_one_activated_rule)} test users activated at least one rule`}/>
        </div>

        <div className="rounded-2xl border border-[#e9ede7] bg-white p-5">
          <h3 className="font-bold text-[#244c38]">
            Rule Prediction Results
          </h3>
          <div className="mt-3">
            <MetricComparison label="Rule success rate" value={formatPercent(ruleEvaluation.rule_success_rate)}/>
            <MetricComparison label="Consequent item precision" value={formatPercent(ruleEvaluation.consequent_item_precision)}/>
            <MetricComparison label="Test users" value={formatNumber(ruleEvaluation.test_users)}/>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#244c38]">
            Recommendation Evaluation
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Comparison of popularity, association-rule, and hybrid recommendation methods.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard title="Rule Recommendation Coverage" value={formatPercent(hybrid.rule_recommendation_coverage)}
            description={`${formatNumber(hybrid.users_with_rule_recommendations)} users received rule-based recommendations`}/>
          <MetricCard title="Hybrid Recommendation Coverage" value={formatPercent(hybrid.hybrid_recommendation_coverage)}
            description={`${formatNumber(hybrid.users_with_hybrid_recommendations)} users received hybrid recommendations`}/>
          <MetricCard title="Rule Activation Coverage" value={formatPercent(hybrid.rule_activation_coverage)}
            description={`${formatNumber(hybrid.users_with_activated_rules)} users activated at least one rule`}/>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#e9ede7] bg-white">
          <div className="border-b border-[#edf0e9] p-5">
            <h3 className="font-bold text-[#244c38]">
              Top-5 Recommendation Performance
            </h3>
            <p className="mt-1 text-xs text-gray-400">
              Precision, recall, and hit rate at K = 5
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f5f8f3] text-xs uppercase tracking-wide text-[#627568]">
                <tr>
                  <th className="px-5 py-4">Method</th>
                  <th className="px-5 py-4">Precision@5</th>
                  <th className="px-5 py-4">Recall@5</th>
                  <th className="px-5 py-4">Hit Rate@5</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf0e9]">
                {[
                  { label: "Popularity", metric: popularityAt5 },
                  { label: "Association Rules", metric: rulesAt5 },
                  { label: "Hybrid", metric: hybridAt5 },
                ].map((item) => (
                  <tr key={item.label}>
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-[#244c38]">
                      {item.label}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {item.metric ? formatPercent(item.metric.precision_at_k) : "—"}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {item.metric ? formatPercent(item.metric.recall_at_k) : "—"}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {item.metric ? formatPercent(item.metric.hit_rate_at_k) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {hybridAt5 && popularityAt5 && (
          <div className="rounded-xl border border-[#dce9dc] bg-[#f5f8f3] p-4">
            <p className="text-sm font-semibold text-[#246b45]">
              Hybrid vs Popularity at K = 5
            </p>
            <p className="mt-1 text-sm leading-6 text-[#5e7163]">
              Hybrid precision is{" "}
              {formatPercent(hybridAt5.precision_at_k)}, compared with{" "}
              {formatPercent(popularityAt5.precision_at_k)} for popularity.
              The difference is{" "}
              {formatDecimal(hybridAt5.precision_at_k - popularityAt5.precision_at_k)}{" "} in absolute precision.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
