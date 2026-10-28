import type { ApiMeta } from "@/lib/api";

type Props = {
  meta: ApiMeta;
  onChange: (page: number) => void;
};

export function Pagination({ meta, onChange }: Props) {
  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 text-sm text-gray-600 sm:flex-row">
      <p>
        Total {meta.total} data, halaman {meta.page} dari {Math.max(meta.total_pages, 1)}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onChange(meta.page - 1)}
          disabled={meta.page <= 1}
          className="rounded border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40"
        >
          Sebelumnya
        </button>
        <button
          onClick={() => onChange(meta.page + 1)}
          disabled={meta.page >= meta.total_pages}
          className="rounded border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40"
        >
          Berikutnya
        </button>
      </div>
    </div>
  );
}