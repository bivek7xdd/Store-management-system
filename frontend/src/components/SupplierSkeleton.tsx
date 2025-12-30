import { Skeleton } from "@/components/ui/skeleton";

export function SupplierSkeleton() {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    {/* Icon placeholder */}
                    <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                    {/* Name placeholder */}
                    <Skeleton className="h-5 w-32" />
                </div>
                {/* Chevron placeholder */}
                <Skeleton className="h-5 w-5 rounded-full" />
            </div>
            <div className="space-y-2">
                {/* Address placeholder */}
                <Skeleton className="h-4 w-full" />
                {/* Phone placeholder */}
                <div className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-3.5 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                </div>
                {/* Email placeholder */}
                <div className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-3.5 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
        </div>
    );
}
