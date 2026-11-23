
"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import DataTable, {
  type TableColumn,
  type TableValue,
} from "@/components/analytics/data-table";

type Algorithm = "apriori" | "fpgrowth";

type AssociationRule = {
  antecedent_ids: string;
  antecedent_names: string;
  consequent_ids: number | string;
  consequent_names: string;
  support: number;
  confidence: number;
  lift: number;
  leverage: number;
  conviction: number;
};

type RulesResponse = {
  algorithm: Algorithm;
  data: AssociationRule[];
  pagination: {
    page: number;
    page_size: number;
    total_records: number;
    total_pages: number;
  };
};

const columns: TableColumn[] = [
  { key: "antecedent", label: "If Customer Buys" },
  { key: "consequent", label: "Then Also Buys" },
  { key: "support", label: "Support" },
  { key: "confidence", label: "Confidence" },
  { key: "lift", label: "Lift" },
  { key: "leverage", label: "Leverage" },
  { key: "conviction", label: "Conviction" },
];

function formatCount(value: number)
{
  return new Intl.NumberFormat("en-US").format(value);
}

function formatPercent(value: number)
{
  return `${(value * 100).toFixed(2)}%`;
}

function formatDecimal(value: number)
{
  return value.toFixed(3);
}

export default function RulesPage()
{
  const [algorithm, setAlgorithm] = useState<Algorithm>("fpgrowth");
  const [search, setSearch] = useState("");
  const [minConfidence, setMinConfidence] = useState("0.2");
  const [minLift, setMinLift] = useState("1");
  const [pageSize, setPageSize] = useState("10");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<RulesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() =>
  {
    let cancelled = false;

    async function loadRules()
    {
      setLoading(true);
      setError("");

      try
      {
        const params = new URLSearchParams();

        params.set("algorithm", algorithm);
        params.set("page", String(page));
        params.set("page_size", pageSize);
        params.set("min_confidence", minConfidence);
        params.set("min_lift", minLift);

        if (search.trim())
        {
          params.set("search", search.trim());
        }

        const result = await apiGet<RulesResponse>( `/analytics/rules?${params.toString()}`);

        if (!cancelled)
        {
          setData(result);
        }
      }
      catch (err)
      {
        if (!cancelled)
        {
          setError(err instanceof Error ? err.message : "Unable to load association rules.");
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

    const timer = setTimeout(() =>
    {
      loadRules();
    }, search.trim() ? 300 : 0);

    return () =>
    {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [algorithm, page, pageSize, minConfidence, minLift, search, retry,]);

  function changeAlgorithm(value: Algorithm)
  {
    setAlgorithm(value);
    setPage(1);
  }

  function changeConfidence(value: string)
  {
    setMinConfidence(value);
    setPage(1);
  }

  function changeLift(value: string)
  {
    setMinLift(value);
    setPage(1);
  }

  function changePageSize(value: string)
  {
    setPageSize(value);
    setPage(1);
  }

  const rows: Record<string, TableValue>[] =
    data?.data.map((rule) => ({
      antecedent: `${rule.antecedent_names} (${rule.antecedent_ids})`,
      consequent: `${rule.consequent_names} (${rule.consequent_ids})`,
      support: formatPercent(rule.support),
      confidence: formatPercent(rule.confidence),
      lift: formatDecimal(rule.lift),
      leverage: formatDecimal(rule.leverage),
      conviction: formatDecimal(rule.conviction),
    })) ?? [];

  const totalRecords = data?.pagination.total_records ?? 0;
  const totalPages = data?.pagination.total_pages ?? 0;

  const firstRecord = totalRecords === 0 ? 0 : (page - 1) * Number(pageSize) + 1;

  const lastRecord = Math.min(page * Number(pageSize), totalRecords);

  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-semibold text-[#679071]">
          BASKETLY / ANALYTICS / RULES
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#244c38]">
          Association Rules
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
          Discover relationships between products frequently purchased together and explore the strength of those associations.
        </p>
      </div>

      <section className="rounded-2xl border border-[#e9ede7] bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-[#244c38]">
              Mining Algorithm
            </h2>
            <p className="mt-1 text-xs text-gray-400">
              Select the algorithm used to generate the rules.
            </p>
          </div>

          <div className="flex rounded-xl bg-[#f3f6f1] p-1">
            <button onClick={() => changeAlgorithm("apriori")}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                algorithm === "apriori" ? "bg-[#246b45] text-white shadow-sm" : "text-gray-600 hover:text-[#246b45]"}`}>
              Apriori
            </button>

            <button onClick={() => changeAlgorithm("fpgrowth")}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                algorithm === "fpgrowth" ? "bg-[#246b45] text-white shadow-sm" : "text-gray-600 hover:text-[#246b45]"}`}>
              FP-Growth
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e9ede7] bg-white p-5">
        <div className="mb-4">
          <h2 className="font-bold text-[#244c38]">
            Search and Filters
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            Adjust the rule thresholds to focus on stronger associations.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="xl:col-span-2">
            <label htmlFor="rule-search" className="mb-2 block text-xs font-semibold text-gray-600">
              Search Products
            </label>

            <input id="rule-search" type="text" value={search}
              onChange={(event) =>
              {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search antecedent or consequent..."
              className="w-full rounded-xl border border-[#e1e8df] bg-[#fcfdfb] px-4 py-3 text-sm text-[#26352c] outline-none transition placeholder:text-gray-400 focus:border-[#6c9b75] focus:ring-2 focus:ring-[#246b45]/10"/>
          </div>

          <div>
            <label htmlFor="min-confidence" className="mb-2 block text-xs font-semibold text-gray-600">
              Minimum Confidence
            </label>

            <input id="min-confidence" type="number" min="0" max="1" step="0.05" value={minConfidence}
              onChange={(event) => changeConfidence(event.target.value)}
              className="w-full rounded-xl border border-[#e1e8df] bg-[#fcfdfb] px-4 py-3 text-sm text-[#26352c] outline-none focus:border-[#6c9b75]"/>
            <p className="mt-1 text-xs text-gray-400">
              Range: 0 to 1
            </p>
          </div>

          <div>
            <label htmlFor="min-lift" className="mb-2 block text-xs font-semibold text-gray-600">
              Minimum Lift
            </label>

            <input id="min-lift" type="number" min="0" step="0.1" value={minLift}
              onChange={(event) => changeLift(event.target.value)}
              className="w-full rounded-xl border border-[#e1e8df] bg-[#fcfdfb] px-4 py-3 text-sm text-[#26352c] outline-none focus:border-[#6c9b75]"/>
            <p className="mt-1 text-xs text-gray-400">
              Values above 1 indicate positive association
            </p>
          </div>
        </div>

        <div className="mt-4 max-w-xs">
          <label htmlFor="rule-page-size" className="mb-2 block text-xs font-semibold text-gray-600">
            Records Per Page
          </label>

          <select id="rule-page-size" value={pageSize} onChange={(event) => changePageSize(event.target.value)}
            className="w-full rounded-xl border border-[#e1e8df] bg-[#fcfdfb] px-4 py-3 text-sm text-[#26352c] outline-none focus:border-[#6c9b75]">
            <option value="10">10 Records</option>
            <option value="25">25 Records</option>
            <option value="50">50 Records</option>
          </select>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#244c38]">
              Rule Results
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Rules generated using{" "}
              {algorithm === "apriori" ? "Apriori" : "FP-Growth"}.
            </p>
          </div>

          {!loading && !error && data && (
            <span className="text-xs font-medium text-[#718477]">
              {formatCount(totalRecords)} rules found
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center rounded-2xl border border-[#e9ede7] bg-white">
            <div className="text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[#dce9dc] border-t-[#246b45]" />
              <p className="mt-4 text-sm text-gray-500">
                Loading association rules...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
            <h3 className="font-bold text-[#244c38]">
              Unable to load association rules
            </h3>
            <p className="mt-2 text-sm text-red-600">{error}</p>
            <button onClick={() => setRetry((current) => current + 1)}
              className="mt-5 rounded-xl bg-[#246b45] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d5839]">
              Try Again
            </button>
          </div>
        ) : (
          <>
            <DataTable columns={columns} rows={rows}
              emptyMessage="No rules match your search and filter settings. Try lowering the minimum confidence or lift."/>

            {totalRecords > 0 && (
              <div className="flex flex-col gap-4 rounded-2xl border border-[#e9ede7] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Showing{" "}
                  <span className="font-semibold text-[#244c38]">
                    {formatCount(firstRecord)}–{formatCount(lastRecord)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-[#244c38]">
                    {formatCount(totalRecords)}
                  </span>{" "}
                  rules
                </p>

                <div className="flex items-center gap-3">
                  <button onClick={() => setPage((current) => current - 1)} disabled={page <= 1}
                    className="rounded-lg border border-[#dfe7dc] px-4 py-2 text-sm font-semibold text-[#405247] transition hover:bg-[#f5f8f3] disabled:cursor-not-allowed disabled:opacity-40">
                    Previous
                  </button>

                  <span className="whitespace-nowrap text-sm font-medium text-[#526458]">
                    Page {page} of {totalPages}
                  </span>

                  <button onClick={() => setPage((current) => current + 1)} disabled={page >= totalPages}
                    className="rounded-lg border border-[#dfe7dc] px-4 py-2 text-sm font-semibold text-[#405247] transition hover:bg-[#f5f8f3] disabled:cursor-not-allowed disabled:opacity-40">
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <section className="rounded-2xl border border-[#dce9dc] bg-[#f5f8f3] p-5">
        <h2 className="font-bold text-[#246b45]">
          Understanding Association Rule Metrics
        </h2>

        <div className="mt-3 space-y-3 text-sm leading-6 text-[#5e7163]">
          <p>
            <strong>Support:</strong> How frequently the antecedent and consequent occur together in all transactions.
          </p>
          <p>
            <strong>Confidence:</strong> How often the consequent is purchased when the antecedent is purchased.
          </p>
          <p>
            <strong>Lift:</strong> How much more likely the consequent is purchased with the antecedent compared with its overall
            purchase frequency. Lift above 1 indicates positive association.
          </p>
          <p>
            <strong>Leverage:</strong> The difference between the observed joint occurrence and the occurrence expected if the products
            were independent.
          </p>
          <p>
            <strong>Conviction:</strong> A measure of the strength of the implication from antecedent to consequent.
          </p>
        </div>
      </section>
    </div>
  );
}
