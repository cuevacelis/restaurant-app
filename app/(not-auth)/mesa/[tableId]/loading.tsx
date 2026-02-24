import { Skeleton } from "@/components/ui/skeleton";

export default function MesaLoading() {
  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      <Skeleton className="h-16 w-full rounded-xl" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
