import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventory";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CategoryDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: category, isLoading } = useQuery({
        queryKey: ["category", id],
        queryFn: () => inventoryService.getCategory(id!),
        enabled: !!id,
    });

    if (isLoading) return <div className="p-8">Loading...</div>;
    if (!category) return <div className="p-8">Category not found</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold">Category Details</h1>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                    <div className="h-12 w-12 bg-teal-100 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-teal-700" />
                    </div>
                    <div>
                        <CardTitle className="text-xl">{category.name}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Description</h3>
                        <p className="mt-1">{category.description}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">ID</h3>
                        <p className="mt-1 font-mono text-xs text-gray-400">{category.id}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
