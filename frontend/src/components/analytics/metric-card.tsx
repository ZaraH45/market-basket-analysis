
type MetricCardProps = {
  title: string;
  value: string;
  description: string;
};

export default function MetricCard({ title, value, description,}: MetricCardProps)
{
  return (
    <article className="rounded-2xl border border-[#e9ede7] bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>

      <p className="mt-3 text-3xl font-bold tracking-tight text-[#244c38]">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 text-gray-400">{description}</p>
    </article>
  );
}
