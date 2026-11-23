
export type TableValue = string | number | null;

export type TableColumn = {
  key: string;
  label: string;
};

type DataTableProps = {
  columns: TableColumn[];
  rows: Record<string, TableValue>[];
  emptyMessage?: string;
};

export default function DataTable({ columns, rows, emptyMessage = "No records found.",}: DataTableProps)
{
  if (rows.length === 0)
  {
    return (
      <div className="rounded-2xl border border-dashed border-[#dce5dc] bg-white px-6 py-12 text-center">
        <p className="text-sm font-medium text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e9ede7] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-[#f5f8f3] text-xs uppercase tracking-wide text-[#627568]">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="whitespace-nowrap px-5 py-4 font-semibold">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#edf0e9]">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="transition hover:bg-[#fafcf9]">
                {columns.map((column) => (
                  <td key={column.key} className="whitespace-nowrap px-5 py-4 text-[#405247]">
                    {row[column.key] === null || row[column.key] === undefined ? "—" : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
