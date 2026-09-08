import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

const ProfileCardSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <div className="mb-4 flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
      <div className="mb-3 flex flex-wrap gap-1">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="mb-3 h-4 w-3/4" />
      <Skeleton className="h-4 w-28" />
    </CardContent>
  </Card>
);

const DashboardSkeletons = ({ count = 6 }: { count?: number }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <ProfileCardSkeleton key={i} />
    ))}
  </div>
);

export default DashboardSkeletons;
