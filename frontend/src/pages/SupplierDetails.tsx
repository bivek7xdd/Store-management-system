import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventory";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SupplierDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: supplier, isLoading } = useQuery({
        queryKey: ["supplier", id],
        queryFn: () => inventoryService.getSupplier(id!),
        enabled: !!id,
    });

    if (isLoading) return <div className="p-8">Loading...</div>;
    if (!supplier) return <div className="p-8">Supplier not found</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold">Supplier Details</h1>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Truck className="h-6 w-6 text-blue-700" />
                    </div>
                    <div>
                        <CardTitle className="text-xl">{supplier.name}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Email</h3>
                            <p className="mt-1">{supplier.email}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                            <p className="mt-1">{supplier.phone_number}</p>
                        </div>
                        <div className="md:col-span-2">
                            <h3 className="text-sm font-medium text-gray-500">Address</h3>
                            <p className="mt-1">{supplier.address}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
