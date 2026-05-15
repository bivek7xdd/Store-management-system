import { Skeleton } from "@/components/ui/skeleton";

export function CategorySkeleton() {
    return (
        <div className="bg-[#111111] rounded-[2px] border border-[#1A1A1A] p-6">
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-[2px] shrink-0 bg-[#1A1A1A]" />
                <div>
                    <Skeleton className="h-4 w-24 mb-1 bg-[#1A1A1A]" />
                    <Skeleton className="h-3 w-32 bg-[#1A1A1A]" />
                </div>
            </div>
        </div>
    );
}
