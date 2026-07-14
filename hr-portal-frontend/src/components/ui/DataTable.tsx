import { ChevronLeft, ChevronRight } from "lucide-react";

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (item: T) => string;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  emptyMessage?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  page,
  totalPages,
  onPageChange,
  emptyMessage = "No records found.",
}: DataTableProps<T>) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div
        style={{
          overflowX: "auto",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "1rem",
          backdropFilter: "blur(12px)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.875rem",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  style={{
                    padding: "0.875rem 1rem",
                    textAlign: "left",
                    color: "var(--color-text-muted, #94a3b8)",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "var(--color-text-muted, #94a3b8)",
                  }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                >
                  {columns.map((col, idx) => (
                    <td
                      key={idx}
                      style={{ padding: "0.875rem 1rem", whiteSpace: "nowrap" }}
                    >
                      {col.cell
                        ? col.cell(item)
                        : col.accessorKey
                          ? String(item[col.accessorKey])
                          : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {page !== undefined && totalPages !== undefined && totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 0.5rem",
          }}
        >
          <span
            style={{
              fontSize: "0.875rem",
              color: "var(--color-text-muted, #94a3b8)",
            }}
          >
            Page {page} of {totalPages}
          </span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.4rem",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "0.5rem",
                color: page <= 1 ? "var(--color-text-muted, #94a3b8)" : "white",
                cursor: page <= 1 ? "not-allowed" : "pointer",
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.4rem",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "0.5rem",
                color:
                  page >= totalPages
                    ? "var(--color-text-muted, #94a3b8)"
                    : "white",
                cursor: page >= totalPages ? "not-allowed" : "pointer",
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
