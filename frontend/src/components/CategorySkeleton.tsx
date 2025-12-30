import { Skeleton } from "@/components/ui/skeleton";

export function CategorySkeleton() {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    {/* Icon placeholder */}
                    <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                    <div>
                        {/* Name placeholder */}
                        <Skeleton className="h-5 w-24 mb-1" />
                        {/* Description placeholder */}
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                {/* Chevron placeholder */}
                <Skeleton className="h-5 w-5 rounded-full" />
            </div>
        </div>
    );
}
