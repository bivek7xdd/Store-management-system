import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ProductSkeleton() {
    return (
        <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        {/* Icon placeholder */}
                        <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                        <div>
                            {/* Title placeholder */}
                            <Skeleton className="h-5 w-32 mb-2" />
                            {/* Status placeholder */}
                            <Skeleton className="h-3 w-16" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        {/* Badge placeholder */}
                        <Skeleton className="h-5 w-12 rounded-full" />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Info rows */}
                    <div className="space-y-2">
                        <div className="flex justify-between py-2">
                            <Skeleton className="h-4 w-12" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                        <div className="flex justify-between py-2">
                            <Skeleton className="h-4 w-12" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                        <div className="flex justify-between py-2">
                            <Skeleton className="h-4 w-12" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        <Skeleton className="h-9 w-full rounded-lg" />
                        <Skeleton className="h-9 w-full rounded-lg" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
