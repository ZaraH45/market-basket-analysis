
"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

type EvaluationMetric = {
  method: string;
  k: number;
  precision_at_k: number;
  recall_at_k: number;
  hit_rate_at_k: number;
};

type EvaluationSummary = {
  training_baskets: number;
  test_baskets: number;
  test_users: number;
  rules_mined: number;
  test_users_with_at_least_one_activated_rule?: number;
  users_with_activated_rules?: number;
  users_with_rule_recommendations?: number;
  users_with_hybrid_recommendations?: number;
  test_coverage?: number;
  rule_activation_coverage?: number;
  rule_recommendation_coverage?: number;
  hybrid_recommendation_coverage?: number;
  rule_success_rate?: number;
  consequent_item_precision?: number;
  metrics: EvaluationMetric[];
  [key: string]: unknown;
};

type SensitivityRow = Record<string, string | number | null>;

type EvaluationData = {
  rule_evaluation: EvaluationSummary;
  hybrid_comparison: EvaluationSummary;
  parameter_sensitivity: SensitivityRow[];
};

const methodLabels: Record<string, string> = {
  popularity: "Popularity",
  association_rules: "Association Rules",
  hybrid: "Hybrid",
};

const methodDescriptions: Record<string, string> = {
  popularity: "Most frequently purchased products",
  association_rules: "Recommendations generated from association rules",
  hybrid: "Rule-based recommendations with popularity fallback",
};

const methodOrder = ["popularity", "association_rules", "hybrid"];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

function formatRuntime(value: number) {
  return `${value.toFixed(4)} s`;
}

function getMetric(metrics: EvaluationMetric[], method: string, k: number)
{
  return metrics.find((metric) => metric.method === method && metric.k === k);
}

function getCoverage(summary: EvaluationSummary, primaryKey: string, fallbackKey?: string)
{
  const primary = summary[primaryKey];
  const fallback = fallbackKey ? summary[fallbackKey] : undefined;

  if (typeof primary === "number") return primary;
  if (typeof fallback === "number") return fallback;

  return 0;
}

function getCount(summary: EvaluationSummary, primaryKey: string, fallbackKey?: string)
{
  const primary = summary[primaryKey];
  const fallback = fallbackKey ? summary[fallbackKey] : undefined;

  if (typeof primary === "number") return primary;
  if (typeof fallback === "number") return fallback;

  return 0;
}

function getField(row: SensitivityRow, candidates: string[]): string | number | null
{
  for (const candidate of candidates)
  {
    const value = row[candidate];

    if (value !== undefined && value !== null)
    {
      return value;
    }
  }

  return null;
}

function formatSensitivityValue(value: string | number | null, key: string)
{
  if (value === null) return "—";

  if (typeof value === "number")
  {
    if (key.includes("time") || key.includes("runtime"))
    {
      return formatRuntime(value);
    }

    if (key.includes("support") || key.includes("confidence"))
    {
      return value.toFixed(3);
    }

    return Number.isInteger(value) ? formatNumber(value) : value.toFixed(4);
  }

  return value;
}

function MetricBar({label, value, maxValue,}: {
  label: string;
  value: number;
  maxValue: number;
})
{
  const width = maxValue > 0 ? Math.max((value / maxValue) * 100, 1) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-[#405247]">{label}</span>
        <span className="font-semibold text-[#244c38]">
          {formatPercent(value)}
        </span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-[#edf2eb]">
        <div className="h-full rounded-full bg-[#39845a] transition-all" style={{ width: `${width}%` }}/>
      </div>
    </div>
  );
}

function ComparisonPanel({title, description, metrics, metricKey,}: {
  title: string;
  description: string;
  metrics: EvaluationMetric[];
  metricKey: "precision_at_k" | "recall_at_k" | "hit_rate_at_k";
})
{
  const values = methodOrder.map((method) => {return metrics.filter((metric) => metric.method === method);});

  const allValues = values.flat().map((metric) => metric[metricKey]);
  const maxValue = Math.max(...allValues, 0.0001);

  return (
    <section className="rounded-2xl border border-[#e9ede7] bg-white p-5">
      <h3 className="font-bold text-[#244c38]">{title}</h3>
      <p className="mt-1 text-xs text-gray-400">{description}</p>

      <div className="mt-5 space-y-6">
        {methodOrder.map((method, index) => (
          <div key={method}>
            <div className="mb-3">
              <p className="text-sm font-semibold text-[#405247]">
                {methodLabels[method]}
              </p>
              <p className="text-xs text-gray-400">
                {methodDescriptions[method]}
              </p>
            </div>

            <div className="space-y-3">
              {values[index].map((metric) => (
                <MetricBar key={`${method}-${metric.k}`} label={`K = ${metric.k}`} value={metric[metricKey]} maxValue={maxValue}/>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CoverageCard({ title, value, count, description,}: {
  title: string;
  value: number;
  count: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e9ede7] bg-white p-5">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-[#244c38]">
        {formatPercent(value)}
      </p>
      <p className="mt-2 text-sm font-semibold text-[#526458]">
        {formatNumber(count)} users
      </p>
      <p className="mt-1 text-xs leading-5 text-gray-400">
        {description}
      </p>
    </div>
  );
}

export default function EvaluationPage()
{
  const [data, setData] = useState<EvaluationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadEvaluation()
    {
      setLoading(true);
      setError("");

      try
      {
        const result = await apiGet<EvaluationData>("/analytics/evaluation");

        if (!cancelled)
        {
          setData(result);
        }
      }
      catch (err)
      {
        if (!cancelled)
        {
          setError(err instanceof Error ? err.message : "Unable to load evaluation data.");
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

    loadEvaluation();

    return () => {
      cancelled = true;
    };
  }, [retry]);

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[#dce9dc] border-t-[#246b45]" />
          <p className="mt-4 text-sm text-gray-500">
            Loading evaluation results...
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
          Unable to load evaluation
        </h2>
        <p className="mt-2 text-sm text-red-600">
          {error || "No evaluation data was returned."}
        </p>
        <button onClick={() => setRetry((current) => current + 1)}
          className="mt-5 rounded-xl bg-[#246b45] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d5839]">
          Try Again
        </button>
      </div>
    );
  }

  const ruleEvaluation = data.rule_evaluation;
  const hybrid = data.hybrid_comparison;
  const metrics = hybrid.metrics || [];

  const ruleActivationCoverage = getCoverage(hybrid, "rule_activation_coverage", "test_coverage");
  const ruleRecommendationCoverage = getCoverage(hybrid, "rule_recommendation_coverage");
  const hybridRecommendationCoverage = getCoverage(hybrid, "hybrid_recommendation_coverage");
  const activatedUsers = getCount(hybrid, "users_with_activated_rules", "test_users_with_at_least_one_activated_rule");
  const ruleRecommendationUsers = getCount(hybrid, "users_with_rule_recommendations");
  const hybridRecommendationUsers = getCount(hybrid, "users_with_hybrid_recommendations");

  const popularityAt5 = getMetric(metrics, "popularity", 5);
  const hybridAt5 = getMetric(metrics, "hybrid", 5);

  const sensitivityColumns = [
    {
        key: "experiment",
        label: "Experiment",
        aliases: ["experiment", "experiment_id", "setting"],
    },
    {
        key: "algorithm",
        label: "Algorithm",
        aliases: ["algorithm"],
    },
    {
        key: "min_support",
        label: "Min Support",
        aliases: ["min_support", "support"],
    },
    {
        key: "min_confidence",
        label: "Min Confidence",
        aliases: ["min_confidence", "confidence"],
    },
    {
        key: "products_retained",
        label: "Products Retained",
        aliases: ["products_retained"],
    },
    {
        key: "minimum_basket_count",
        label: "Min Basket Count",
        aliases: ["minimum_basket_count", "min_basket_count"],
    },
    {
        key: "frequent_itemsets",
        label: "Frequent Itemsets",
        aliases: ["frequent_itemsets"],
    },
    {
        key: "association_rules",
        label: "Association Rules",
        aliases: ["association_rules"],
    },
    {
        key: "runtime",
        label: "Execution Time",
        aliases: [
        "runtime_seconds",
        "execution_time_seconds",
        "execution_time",
        "runtime",
        "elapsed_seconds",
        ],
    },
    ];

  const sensitivityRows = data.parameter_sensitivity || [];

  const sortedSensitivity = [...sensitivityRows].sort((a, b) => {
    const aExperiment = Number( getField(a, ["experiment", "experiment_id", "setting"]) ?? 0);
    const bExperiment = Number(getField(b, ["experiment", "experiment_id", "setting"]) ?? 0);

    if (aExperiment !== bExperiment)
    {
      return aExperiment - bExperiment;
    }

    return String(a.algorithm ?? "").localeCompare( String(b.algorithm ?? ""));
  });

  const sensitivityRuntimeValues = sortedSensitivity.map((row) =>
    getField(row, [
      "execution_time_seconds",
      "execution_time",
      "runtime_seconds",
      "runtime",
      "elapsed_seconds",
    ])
  );

  const numericRuntimes = sensitivityRuntimeValues.filter((value): value is number => typeof value === "number");

  const fastestRuntime = numericRuntimes.length > 0 ? Math.min(...numericRuntimes) : null;
  const slowestRuntime = numericRuntimes.length > 0 ? Math.max(...numericRuntimes) : null;

  return (
    <div className="space-y-8">

      <div>
        <p className="text-sm font-semibold text-[#679071]">
          BASKETLY / ANALYTICS / EVALUATION
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#244c38]">
          Model Evaluation
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
          Evaluate recommendation quality, compare recommendation strategies, and examine the effect of mining parameters.
        </p>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#244c38]">
            Evaluation Setup
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Dataset split and evaluation scope.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#e9ede7] bg-white p-5">
            <p className="text-sm text-gray-500">Training Baskets</p>
            <p className="mt-3 text-3xl font-bold text-[#244c38]">
              {formatNumber(hybrid.training_baskets)}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e9ede7] bg-white p-5">
            <p className="text-sm text-gray-500">Test Baskets</p>
            <p className="mt-3 text-3xl font-bold text-[#244c38]">
              {formatNumber(hybrid.test_baskets)}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e9ede7] bg-white p-5">
            <p className="text-sm text-gray-500">Test Users</p>
            <p className="mt-3 text-3xl font-bold text-[#244c38]">
              {formatNumber(hybrid.test_users)}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#244c38]">
            Recommendation Coverage
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            How many test users could be served by each recommendation stage.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <CoverageCard title="Rule Activation" value={ruleActivationCoverage} count={activatedUsers}
            description="Users whose baskets activated at least one association rule"/>
          <CoverageCard title="Rule Recommendations" value={ruleRecommendationCoverage} count={ruleRecommendationUsers}
            description="Users who received at least one rule-based recommendation"/>
          <CoverageCard title="Hybrid Recommendations" value={hybridRecommendationCoverage} count={hybridRecommendationUsers}
            description="Users who received recommendations from the hybrid approach"/>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#244c38]">
            Recommendation Quality
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Compare popularity, association-rule, and hybrid methods at different recommendation list sizes.
          </p>
        </div>

        <ComparisonPanel title="Precision@K" description="Proportion of recommended products that were relevant."
          metrics={metrics} metricKey="precision_at_k"/>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ComparisonPanel title="Recall@K" description="Proportion of relevant products retrieved."
            metrics={metrics} metricKey="recall_at_k" />
          <ComparisonPanel title="Hit Rate@K" description="Proportion of test users receiving at least one relevant recommendation."
            metrics={metrics} metricKey="hit_rate_at_k"/>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#244c38]">
            Top-5 Method Comparison
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Direct comparison of all three methods at K = 5.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#e9ede7] bg-white">
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
                {methodOrder.map((method) => {
                  const metric = getMetric(metrics, method, 5);

                  return (
                    <tr key={method}>
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-[#244c38]">
                        {methodLabels[method]}
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {metric ? formatPercent(metric.precision_at_k) : "—"}
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {metric ? formatPercent(metric.recall_at_k) : "—"}
                      </td>
                      <td className="px-5 py-4 text-gray-600">
                        {metric ? formatPercent(metric.hit_rate_at_k) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {popularityAt5 && hybridAt5 && (
          <div className="rounded-xl border border-[#dce9dc] bg-[#f5f8f3] p-4">
            <p className="text-sm font-semibold text-[#246b45]">
              Hybrid vs Popularity
            </p>
            <p className="mt-1 text-sm leading-6 text-[#5e7163]">
              At K = 5, hybrid precision is{" "}
              {formatPercent(hybridAt5.precision_at_k)}, compared with{" "}
              {formatPercent(popularityAt5.precision_at_k)} for popularity.
              The absolute difference is{" "}
              {formatPercent(Math.abs( hybridAt5.precision_at_k - popularityAt5.precision_at_k))}.
            </p>
            <p className="mt-2 text-xs leading-5 text-[#718477]">
              This is a modest improvement; the result should not be interpreted as a large performance gain.
            </p>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#244c38]">
            Association Rule Evaluation
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Rule activation and prediction performance on held-out baskets.
          </p>
        </div>

        <div className="rounded-2xl border border-[#e9ede7] bg-white p-5">
          <div className="flex items-center justify-between gap-4 border-b border-[#edf0e9] pb-3">
            <span className="text-sm text-gray-500">Rules evaluated</span>
            <span className="font-semibold text-[#244c38]">
              {formatNumber(ruleEvaluation.rules_mined)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 border-b border-[#edf0e9] py-3">
            <span className="text-sm text-gray-500">Rule success rate</span>
            <span className="font-semibold text-[#244c38]">
              {typeof ruleEvaluation.rule_success_rate === "number" ? formatPercent(ruleEvaluation.rule_success_rate) : "—"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 pt-3">
            <span className="text-sm text-gray-500">
              Consequent item precision
            </span>
            <span className="font-semibold text-[#244c38]">
              {typeof ruleEvaluation.consequent_item_precision === "number" ? formatPercent(ruleEvaluation.consequent_item_precision) : "—"}
            </span>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#244c38]">
            Parameter Sensitivity Analysis
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Examine how support and confidence thresholds affect the number of retained products, itemsets, rules, and execution time.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#e9ede7] bg-white p-5">
            <p className="text-sm text-gray-500">Experiments</p>
            <p className="mt-2 text-2xl font-bold text-[#244c38]">
              {formatNumber(new Set(sortedSensitivity.map((row) => String(getField(row, [ "experiment", "experiment_id", "setting",]) ?? ""))).size)}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e9ede7] bg-white p-5">
            <p className="text-sm text-gray-500">Algorithm Runs</p>
            <p className="mt-2 text-2xl font-bold text-[#244c38]">
              {formatNumber(sortedSensitivity.length)}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e9ede7] bg-white p-5">
            <p className="text-sm text-gray-500">Fastest Recorded Run</p>
            <p className="mt-2 text-2xl font-bold text-[#244c38]">
              {fastestRuntime === null ? "—" : formatRuntime(fastestRuntime)}
            </p>
            {slowestRuntime !== null && (
              <p className="mt-1 text-xs text-gray-400">
                Slowest: {formatRuntime(slowestRuntime)}
              </p>
            )}
          </div>
        </div>

        {sortedSensitivity.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#dce5dc] bg-white px-6 py-12 text-center">
            <p className="text-sm text-gray-500">
              No parameter sensitivity results are available.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#e9ede7] bg-white">
            <div className="border-b border-[#edf0e9] p-5">
              <h3 className="font-bold text-[#244c38]">
                Experiment Results
              </h3>
              <p className="mt-1 text-xs text-gray-400">
                Apriori and FP-Growth results for each parameter setting.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f5f8f3] text-xs uppercase tracking-wide text-[#627568]">
                  <tr>
                    {sensitivityColumns.map((column) => (
                      <th key={column.key} className="whitespace-nowrap px-4 py-4 font-semibold">
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#edf0e9]">
                  {sortedSensitivity.map((row, index) => (
                    <tr key={`${String(row.experiment ?? row.experiment_id ?? index)}-${String(row.algorithm ?? "")}-${index}`}
                      className="hover:bg-[#fafcf9]">
                      {sensitivityColumns.map((column) => { const value = getField(row, column.aliases);

                        return (
                          <td key={column.key} className="whitespace-nowrap px-4 py-4 text-[#405247]">
                            {formatSensitivityValue(value, column.key)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-[#dce9dc] bg-[#f5f8f3] p-5">
        <h2 className="font-bold text-[#246b45]">
          Interpreting the Evaluation
        </h2>

        <div className="mt-3 space-y-3 text-sm leading-6 text-[#5e7163]">
          <p>
            <strong>Precision@K:</strong> Measures the proportion of the top K recommendations that were relevant.
          </p>
          <p>
            <strong>Recall@K:</strong> Measures how many relevant products were retrieved among the top K recommendations.
          </p>
          <p>
            <strong>Hit Rate@K:</strong> Measures the proportion of test users for whom at least one recommendation was relevant.
          </p>
          <p>
            <strong>Coverage:</strong> Measures the proportion of test users who received recommendations or activated rules.
          </p>
          <p>
            <strong>Parameter Sensitivity:</strong> Shows how changing minimum support and confidence affects mining output and execution time.
          </p>
        </div>
      </section>
    </div>
  );
}
