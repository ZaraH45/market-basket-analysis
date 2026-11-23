
"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import DataTable, {
  type TableColumn,
  type TableValue,
} from "@/components/analytics/data-table";

type Algorithm = "apriori" | "fpgrowth";

type Itemset = {
  product_ids: string;
  product_names: string;
  itemset_length: number;
  support: number;
};

type ItemsetsResponse = {
  algorithm: Algorithm;
  data: Itemset[];
  pagination: {
    page: number;
    page_size: number;
    total_records: number;
    total_pages: number;
  };
};

const columns: TableColumn[] = [
  { key: "product_names", label: "Products" },
  { key: "product_ids", label: "Product IDs" },
  { key: "itemset_length", label: "Itemset Length" },
  { key: "support", label: "Support" },
];

export default function ItemsetsPage()
{
  const [algorithm, setAlgorithm] = useState<Algorithm>("fpgrowth");
  const [search, setSearch] = useState("");
  const [itemsetLength, setItemsetLength] = useState("all");
  const [pageSize, setPageSize] = useState("10");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<ItemsetsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() =>
  {
    let cancelled = false;

    async function loadItemsets()
    {
      setLoading(true);
      setError("");

      try
      {
        const params = new URLSearchParams();

        params.set("algorithm", algorithm);
        params.set("page", String(page));
        params.set("page_size", pageSize);

        if (itemsetLength !== "all")
        {
          params.set("itemset_length", itemsetLength);
        }

        if (search.trim())
        {
          params.set("search", search.trim());
        }

        const result = await apiGet<ItemsetsResponse>(`/analytics/itemsets?${params.toString()}`);

        if (!cancelled)
        {
          setData(result);
        }
      }
      catch (err)
      {
        if (!cancelled)
        {
          setError(err instanceof Error ? err.message : "Unable to load frequent itemsets.");
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
      loadItemsets();
    }, search.trim() ? 300 : 0);

    return () =>
    {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [algorithm, page, pageSize, itemsetLength, search, retry]);

  function changeAlgorithm(value: Algorithm)
  {
    setAlgorithm(value);
    setPage(1);
  }

  function changeItemsetLength(value: string)
  {
    setItemsetLength(value);
    setPage(1);
  }

  function changePageSize(value: string)
  {
    setPageSize(value);
    setPage(1);
  }

  const rows: Record<string, TableValue>[] =
    data?.data.map((item) => ({
      product_names: item.product_names,
      product_ids: item.product_ids,
      itemset_length: item.itemset_length,
      support: `${(item.support * 100).toFixed(2)}%`,
    })) ?? [];

  const totalRecords = data?.pagination.total_records ?? 0;
  const totalPages = data?.pagination.total_pages ?? 0;

  const firstRecord = totalRecords === 0 ? 0 : (page - 1) * Number(pageSize) + 1;

  const lastRecord = Math.min(page * Number(pageSize), totalRecords);

  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-semibold text-[#679071]">
          BASKETLY / ANALYTICS / ITEMSETS
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#244c38]">
          Frequent Itemsets
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
          Explore products and combinations that frequently appear together in customer transactions.
        </p>
      </div>

      <section className="rounded-2xl border border-[#e9ede7] bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-[#244c38]">
              Mining Algorithm
            </h2>
            <p className="mt-1 text-xs text-gray-400">
              Choose which algorithm&apos;s frequent itemsets to explore.
            </p>
          </div>

          <div className="flex rounded-xl bg-[#f3f6f1] p-1">
            <button onClick={() => changeAlgorithm("apriori")} className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                algorithm === "apriori" ? "bg-[#246b45] text-white shadow-sm" : "text-gray-600 hover:text-[#246b45]"}`}>
              Apriori
            </button>

            <button onClick={() => changeAlgorithm("fpgrowth")} className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
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
            Narrow down the results by product or itemset size.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <label htmlFor="itemset-search" className="mb-2 block text-xs font-semibold text-gray-600">
              Search Products
            </label>

            <input id="itemset-search" type="text" value={search} onChange={(event) =>
              {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Enter product name or ID..."
              className="w-full rounded-xl border border-[#e1e8df] bg-[#fcfdfb] px-4 py-3 text-sm text-[#26352c] outline-none transition placeholder:text-gray-400 focus:border-[#6c9b75] focus:ring-2 focus:ring-[#246b45]/10"/>
          </div>

          <div>
            <label htmlFor="itemset-length" className="mb-2 block text-xs font-semibold text-gray-600">
              Itemset Length
            </label>

            <select id="itemset-length" value={itemsetLength} onChange={(event) => changeItemsetLength(event.target.value)}
              className="w-full rounded-xl border border-[#e1e8df] bg-[#fcfdfb] px-4 py-3 text-sm text-[#26352c] outline-none focus:border-[#6c9b75]">
              <option value="all">All Lengths</option>
              <option value="1">1 Product</option>
              <option value="2">2 Products</option>
              <option value="3">3 Products</option>
            </select>
          </div>

          <div>
            <label htmlFor="page-size" className="mb-2 block text-xs font-semibold text-gray-600">
              Records Per Page
            </label>

            <select id="page-size" value={pageSize} onChange={(event) => changePageSize(event.target.value)}
              className="w-full rounded-xl border border-[#e1e8df] bg-[#fcfdfb] px-4 py-3 text-sm text-[#26352c] outline-none focus:border-[#6c9b75]">
              <option value="10">10 Records</option>
              <option value="25">25 Records</option>
              <option value="50">50 Records</option>
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#244c38]">
              Itemset Results
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Results generated using {algorithm === "apriori" ? "Apriori" : "FP-Growth"}.
            </p>
          </div>

          {!loading && !error && data && (
            <span className="text-xs font-medium text-[#718477]">
              {formatResultCount(totalRecords)} itemsets found
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center rounded-2xl border border-[#e9ede7] bg-white">
            <div className="text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[#dce9dc] border-t-[#246b45]" />
              <p className="mt-4 text-sm text-gray-500">
                Loading frequent itemsets...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
            <h3 className="font-bold text-[#244c38]">
              Unable to load itemsets
            </h3>
            <p className="mt-2 text-sm text-red-600">{error}</p>
            <button onClick={() => setRetry((current) => current + 1)}
              className="mt-5 rounded-xl bg-[#246b45] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d5839]">
              Try Again
            </button>
          </div>
        ) : (
          <>
            <DataTable columns={columns} rows={rows} emptyMessage="No itemsets match your search and filter settings."/>
            {totalRecords > 0 && (
              <div className="flex flex-col gap-4 rounded-2xl border border-[#e9ede7] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  Showing{" "}
                  <span className="font-semibold text-[#244c38]">
                    {formatResultCount(firstRecord)}–{formatResultCount(lastRecord)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-[#244c38]">
                    {formatResultCount(totalRecords)}
                  </span>{" "}
                  itemsets
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

      <div className="rounded-xl border border-[#dce9dc] bg-[#f5f8f3] p-4">
        <p className="text-sm font-semibold text-[#246b45]">
          Understanding Support
        </p>
        <p className="mt-1 text-sm leading-6 text-[#5e7163]">
          Support represents the proportion of transactions containing an itemset. For example, a support of 14.37% means that the
          itemset appears in approximately 14.37% of all transactions considered during mining.
        </p>
      </div>
    </div>
  );
}

function formatResultCount(value: number)
{
  return new Intl.NumberFormat("en-US").format(value);
}
