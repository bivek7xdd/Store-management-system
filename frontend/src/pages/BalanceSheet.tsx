import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wallet, Package, Users, CreditCard, TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import api from "@/services/api";

const COLORS = ["#10b981", "#DA291C", "#f59e0b"];

export default function BalanceSheet() {
    const [dateRange, setDateRange] = useState("month");

    const { data: netProfitData, isLoading: profitLoading } = useQuery({
        queryKey: ["netProfit", dateRange],
        queryFn: async () => {
            const response = await api.get(`/reports/net-profit?range=${dateRange}`);
            return response.data.data;
        },
    });

    const { data: balanceSheetData, isLoading: balanceLoading } = useQuery({
        queryKey: ["balanceSheet"],
        queryFn: async () => {
            const [assets, liabilities] = await Promise.all([
                api.get("/reports/balance-sheet/assets"),
                api.get("/reports/balance-sheet/liabilities"),
            ]);
            return {
                assets: assets.data.data,
                liabilities: liabilities.data.data,
            };
        },
    });

    if (profitLoading || balanceLoading) {
        return (
            <div className="space-y-6 pb-24 lg:pb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <p className="text-[11px] text-[#555555] uppercase tracking-[1.5px] mb-1">Finance</p>
                        <h1 className="text-[22px] font-medium text-white tracking-tight">Balance Sheet</h1>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 bg-[#111111] rounded-[2px]" />)}
                </div>
            </div>
        );
    }

    const profit = netProfitData || {};
    const balance = balanceSheetData || { assets: {}, liabilities: {} };

    const totalRevenue = Number(profit.total_revenue) || 0;
    const totalCOGS = Number(profit.total_cogs) || 0;
    const totalExpenses = Number(profit.total_expenses) || 0;
    const totalRefunds = Number(profit.total_refunds) || 0;
    const netProfit = Number(profit.net_profit) || 0;

    const accountsReceivable = Number(balance.assets?.accounts_receivable) || 0;
    const inventoryValue = Number(balance.assets?.inventory_value) || 0;
    const accountsPayable = Number(balance.liabilities?.accounts_payable) || 0;

    const assetData = [
        { name: "Receivables", value: accountsReceivable },
        { name: "Inventory", value: inventoryValue },
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-6 pb-24 lg:pb-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <p className="text-[11px] text-[#555555] uppercase tracking-[1.5px] mb-1">Finance</p>
                    <h1 className="text-[22px] font-medium text-white tracking-tight">Balance Sheet</h1>
                </div>
                <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-28 h-9 text-[11px] rounded-[2px] bg-[#111111] border-[#1A1A1A] text-[#8F8F8F] uppercase tracking-[0.5px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-[2px] border-[#303030] bg-[#111111]">
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">Week</SelectItem>
                        <SelectItem value="month">Month</SelectItem>
                        <SelectItem value="year">Year</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* P&L Summary */}
            <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px]">
                <div className="px-5 py-4 border-b border-[#1A1A1A]">
                    <span className="text-[12px] text-[#8F8F8F] uppercase tracking-[1px]">Profit & Loss Summary</span>
                </div>
                <div className="p-6 space-y-3">
                    {[
                        { label: "Total Revenue", value: totalRevenue, cls: "text-white" },
                        { label: "Cost of Goods Sold", value: totalCOGS, cls: "text-[#DA291C]" },
                        { label: "Operating Expenses", value: totalExpenses, cls: "text-amber-400" },
                        { label: "Refunds", value: totalRefunds, cls: "text-amber-400" },
                    ].map(({ label, value, cls }) => (
                        <div key={label} className="flex items-center justify-between border border-[#1A1A1A] rounded-[2px] px-4 py-3">
                            <span className="text-[12px] text-[#8F8F8F]">{label}</span>
                            <span className={`text-[14px] font-bold ${cls}`}>रू {value.toLocaleString()}</span>
                        </div>
                    ))}
                    <div className="flex items-center justify-between border-2 border-[#303030] rounded-[2px] px-4 py-4 mt-4">
                        <span className="text-[14px] font-bold text-white uppercase tracking-[1px]">Net Profit</span>
                        <span className={`text-2xl font-bold ${netProfit >= 0 ? "text-emerald-400" : "text-[#DA291C]"}`}>
                            रू {netProfit.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Assets & Liabilities */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Assets */}
                <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px]">
                    <div className="px-5 py-4 border-b border-[#1A1A1A] flex items-center gap-3">
                        <div className="h-7 w-7 rounded-[2px] bg-emerald-900/30 flex items-center justify-center">
                            <Wallet className="h-4 w-4 text-emerald-400" />
                        </div>
                        <span className="text-[12px] text-[#8F8F8F] uppercase tracking-[1px]">Assets</span>
                    </div>
                    <div className="p-6 space-y-3">
                        <div className="flex items-center justify-between border border-[#1A1A1A] rounded-[2px] px-4 py-3">
                            <div className="flex items-center gap-3">
                                <Users className="h-4 w-4 text-[#888888]" />
                                <span className="text-[12px] text-[#8F8F8F]">Accounts Receivable</span>
                            </div>
                            <span className="text-[14px] font-bold text-white">रू {accountsReceivable.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between border border-[#1A1A1A] rounded-[2px] px-4 py-3">
                            <div className="flex items-center gap-3">
                                <Package className="h-4 w-4 text-[#888888]" />
                                <span className="text-[12px] text-[#8F8F8F]">Inventory Value</span>
                            </div>
                            <span className="text-[14px] font-bold text-white">रू {inventoryValue.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between border-2 border-[#303030] rounded-[2px] px-4 py-3 mt-2">
                            <span className="text-[12px] font-bold text-white uppercase tracking-[1px]">Total Assets</span>
                            <span className="text-[16px] font-bold text-emerald-400">रू {(accountsReceivable + inventoryValue).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Liabilities */}
                <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px]">
                    <div className="px-5 py-4 border-b border-[#1A1A1A] flex items-center gap-3">
                        <div className="h-7 w-7 rounded-[2px] bg-[#DA291C]/10 flex items-center justify-center">
                            <CreditCard className="h-4 w-4 text-[#DA291C]" />
                        </div>
                        <span className="text-[12px] text-[#8F8F8F] uppercase tracking-[1px]">Liabilities</span>
                    </div>
                    <div className="p-6 space-y-3">
                        <div className="flex items-center justify-between border border-[#1A1A1A] rounded-[2px] px-4 py-3">
                            <div className="flex items-center gap-3">
                                <TrendingUp className="h-4 w-4 text-[#888888]" />
                                <span className="text-[12px] text-[#8F8F8F]">Accounts Payable</span>
                            </div>
                            <span className="text-[14px] font-bold text-[#DA291C]">रू {accountsPayable.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between border-2 border-[#303030] rounded-[2px] px-4 py-3 mt-2">
                            <span className="text-[12px] font-bold text-white uppercase tracking-[1px]">Total Liabilities</span>
                            <span className="text-[16px] font-bold text-[#DA291C]">रू {accountsPayable.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Asset Composition Chart */}
            {assetData.length > 0 && (
                <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px]">
                    <div className="px-5 py-4 border-b border-[#1A1A1A] flex items-center gap-3">
                        <div className="h-7 w-7 rounded-[2px] bg-[#DA291C]/10 flex items-center justify-center">
                            <PieChartIcon className="h-4 w-4 text-[#DA291C]" />
                        </div>
                        <span className="text-[12px] text-[#8F8F8F] uppercase tracking-[1px]">Asset Composition</span>
                    </div>
                    <div className="p-5 h-64 flex items-center">
                        <div className="w-1/2">
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={assetData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                                        {assetData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ borderRadius: '2px', border: '1px solid #303030', backgroundColor: '#111111', color: '#CCCCCC' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-1/2 space-y-3">
                            {assetData.map((d, i) => (
                                <div key={d.name} className="flex items-center gap-3">
                                    <div className="h-3 w-3 rounded-[2px]" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <span className="text-[12px] text-[#8F8F8F]">{d.name}</span>
                                    <span className="text-[12px] text-white font-bold ml-auto">रू {d.value.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
