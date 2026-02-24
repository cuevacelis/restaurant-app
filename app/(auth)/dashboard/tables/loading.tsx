import { Skeleton } from "@/components/ui/skeleton";

export default function TablesLoading() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-32" />
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
