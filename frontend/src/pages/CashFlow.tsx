import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
    BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip,
    LineChart, Line, ComposedChart, CartesianGrid
} from "recharts";
import api from "@/services/api";

interface CashFlowDay {
    date: string;
    sales_inflow: number;
    expense_outflow: number;
    refund_outflow: number;
    supplier_payment_outflow: number;
    net_flow: number;
}

export default function CashFlow() {
    const [dateRange, setDateRange] = useState("month");

    const { data: cashFlowData, isLoading } = useQuery({
        queryKey: ["cashFlow", dateRange],
        queryFn: async () => {
            const response = await api.get(`/reports/cashflow?range=${dateRange}`);
            return response.data.data as CashFlowDay[];
        },
    });

    const data = cashFlowData || [];

    const totalInflow = data.reduce((sum, d) => sum + Number(d.sales_inflow), 0);
    const totalOutflow = data.reduce((sum, d) => sum + Number(d.expense_outflow) + Number(d.refund_outflow) + Number(d.supplier_payment_outflow), 0);
    const netFlow = totalInflow - totalOutflow;

    const chartData = data.map(d => ({
        date: d.date,
        inflow: Number(d.sales_inflow),
        outflow: Number(d.expense_outflow) + Number(d.refund_outflow) + Number(d.supplier_payment_outflow),
        net: Number(d.net_flow),
    }));

    // Calculate running balance
    let runningBalance = 0;
    const balanceData = chartData.map(d => {
        runningBalance += d.net;
        return { ...d, balance: runningBalance };
    });

    if (isLoading) {
        return (
            <div className="space-y-6 pb-24 lg:pb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <p className="text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">Finance</p>
                        <h1 className="text-[24px] font-bold text-white tracking-tight">Cash Flow</h1>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 bg-[#111111] rounded-[2px]" />)}
                </div>
                <Skeleton className="h-72 bg-[#111111] rounded-[2px]" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-24 lg:pb-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <p className="text-[11px] text-[#888888] uppercase tracking-[1.5px] mb-1">Finance</p>
                    <h1 className="text-[24px] font-bold text-white tracking-tight">Cash Flow</h1>
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

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#111111] border border-[#1A1A1A] p-6 rounded-[2px]">
                    <p className="text-[10px] text-[#888888] uppercase tracking-widest font-black mb-2">Total Inflow</p>
                    <div className="flex items-end justify-between">
                        <h2 className="text-3xl font-bold text-emerald-400">रू {totalInflow.toLocaleString()}</h2>
                        <ArrowUpRight className="h-5 w-5 text-emerald-400" />
                    </div>
                </div>
                <div className="bg-[#111111] border border-[#1A1A1A] p-6 rounded-[2px]">
                    <p className="text-[10px] text-[#888888] uppercase tracking-widest font-black mb-2">Total Outflow</p>
                    <div className="flex items-end justify-between">
                        <h2 className="text-3xl font-bold text-[#DA291C]">रू {totalOutflow.toLocaleString()}</h2>
                        <ArrowDownRight className="h-5 w-5 text-[#DA291C]" />
                    </div>
                </div>
                <div className="bg-[#111111] border border-[#1A1A1A] p-6 rounded-[2px]">
                    <p className="text-[10px] text-[#888888] uppercase tracking-widest font-black mb-2">Net Cash Flow</p>
                    <div className="flex items-end justify-between">
                        <h2 className={`text-3xl font-bold ${netFlow >= 0 ? "text-emerald-400" : "text-[#DA291C]"}`}>
                            रू {netFlow.toLocaleString()}
                        </h2>
                        {netFlow >= 0 ? <TrendingUp className="h-5 w-5 text-emerald-400" /> : <TrendingDown className="h-5 w-5 text-[#DA291C]" />}
                    </div>
                </div>
            </div>

            {/* Net Flow Chart */}
            <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px]">
                <div className="px-5 py-4 border-b border-[#1A1A1A]">
                    <span className="text-[12px] text-[#8F8F8F] uppercase tracking-[1px]">Daily Net Cash Flow</span>
                </div>
                <div className="p-5 h-72">
                    {balanceData.length === 0 ? (
                        <p className="text-[13px] text-[#888888] text-center py-8">No cash flow data</p>
                    ) : (
                        <ResponsiveContainer>
                            <ComposedChart data={balanceData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A1A1A" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#555555' }} tickFormatter={(v) => new Date(v).toLocaleDateString([], { day: 'numeric', month: 'short' })} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#555555' }} tickFormatter={(v) => `रू${(v/1000).toFixed(0)}k`} />
                                <RechartsTooltip contentStyle={{ borderRadius: '2px', border: '1px solid #303030', backgroundColor: '#111111', color: '#CCCCCC' }} />
                                <Bar dataKey="inflow" fill="#10b981" radius={[2, 2, 0, 0]} opacity={0.3} />
                                <Bar dataKey="outflow" fill="#DA291C" radius={[2, 2, 0, 0]} opacity={0.3} />
                                <Line type="monotone" dataKey="net" stroke="#ffffff" strokeWidth={2} dot={{ r: 3, fill: '#ffffff', strokeWidth: 0 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Running Balance */}
            <div className="bg-[#111111] border border-[#1A1A1A] rounded-[2px]">
                <div className="px-5 py-4 border-b border-[#1A1A1A]">
                    <span className="text-[12px] text-[#8F8F8F] uppercase tracking-[1px]">Running Balance</span>
                </div>
                <div className="p-5 h-56">
                    {balanceData.length === 0 ? (
                        <p className="text-[13px] text-[#888888] text-center py-8">No balance data</p>
                    ) : (
                        <ResponsiveContainer>
                            <LineChart data={balanceData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A1A1A" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#555555' }} tickFormatter={(v) => new Date(v).toLocaleDateString([], { day: 'numeric', month: 'short' })} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#555555' }} tickFormatter={(v) => `रू${(v/1000).toFixed(0)}k`} />
                                <RechartsTooltip contentStyle={{ borderRadius: '2px', border: '1px solid #303030', backgroundColor: '#111111', color: '#CCCCCC' }} />
                                <Line type="monotone" dataKey="balance" stroke="#DA291C" strokeWidth={2} dot={{ r: 2, fill: '#DA291C', strokeWidth: 0 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Breakdown Table */}
            <div className="border border-[#1A1A1A] rounded-[2px] bg-[#0A0A0A] overflow-hidden">
                <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-4 bg-[#111111] border-b border-[#1A1A1A]">
                    {["Date", "Sales Inflow", "Expenses", "Refunds", "Net Flow"].map(h => (
                        <span key={h} className="text-[10px] font-black uppercase tracking-widest text-[#888888]">{h}</span>
                    ))}
                </div>
                <div className="divide-y divide-[#1A1A1A]">
                    {balanceData.length === 0 ? (
                        <div className="py-20 text-center">
                            <Wallet className="h-12 w-12 text-[#1A1A1A] mx-auto" />
                            <p className="text-[10px] font-black uppercase tracking-[2px] text-[#888888] mt-4">No Data Available</p>
                        </div>
                    ) : (
                        balanceData.map((d, i) => (
                            <div key={i} className="p-6 grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_1fr_1fr] gap-4 items-center">
                                <span className="text-[12px] text-[#888888]">{new Date(d.date).toLocaleDateString()}</span>
                                <span className="text-[13px] text-emerald-400">रू {d.inflow.toLocaleString()}</span>
                                <span className="text-[13px] text-[#DA291C]">रू {d.outflow.toLocaleString()}</span>
                                <span className="text-[13px] text-amber-400">रू {data[i]?.refund_outflow ? Number(data[i].refund_outflow).toLocaleString() : "0"}</span>
                                <span className={`text-[13px] font-bold ${d.net >= 0 ? "text-emerald-400" : "text-[#DA291C]"}`}>
                                    रू {d.net.toLocaleString()}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
