// Mirrors TaskTable's wrapper/table/column widths exactly so swapping the
// skeleton for real rows produces no layout jump.
const COLUMNS = [
  { label: "Title", width: "w-[28%]" },
  { label: "Customer", width: "w-[18%]" },
  { label: "Priority", width: "w-[12%]" },
  { label: "Status", width: "w-[14%]" },
  { label: "Due Date", width: "w-[14%]" },
  { label: "Assignee", width: "w-[14%]" },
] as const;

const SKELETON_ROW_COUNT = 10;

function SkeletonBar({ className = "" }: { className?: string }) {
  return (
    <span
      className={`bg-muted block rounded motion-safe:animate-pulse ${className}`}
    />
  );
}

export function TaskTableSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading tasks"
      className="border-border bg-surface max-h-[70vh] overflow-auto rounded-lg border"
    >
      <table className="w-full min-w-[720px] table-fixed border-collapse text-left text-sm">
        <thead className="border-border bg-muted sticky top-0 z-10 border-b">
          <tr>
            {COLUMNS.map((column) => (
              <th
                key={column.label}
                scope="col"
                className={`text-muted-foreground px-4 py-3 text-xs font-semibold tracking-wide uppercase ${column.width}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
            <tr key={index} className="border-border border-b">
              <td className="border-l-4 border-l-transparent px-4 py-3">
                <SkeletonBar className="h-4 w-3/4" />
              </td>
              <td className="px-4 py-3">
                <SkeletonBar className="h-4 w-2/3" />
                <SkeletonBar className="mt-1.5 h-3 w-1/3" />
              </td>
              <td className="px-4 py-3">
                <SkeletonBar className="h-5 w-16 rounded-full" />
              </td>
              <td className="px-4 py-3">
                <SkeletonBar className="h-5 w-20 rounded-full" />
              </td>
              <td className="px-4 py-3">
                <SkeletonBar className="h-4 w-24" />
              </td>
              <td className="px-4 py-3">
                <SkeletonBar className="h-4 w-3/4" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
