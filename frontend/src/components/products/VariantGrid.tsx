import { Input } from "@/components/ui/input";
import { ProductVariant } from "@/types";

interface VariantGridProps {
  combinations: Partial<ProductVariant>[];
  onChange: (combinations: Partial<ProductVariant>[]) => void;
  basePrice?: number;
  baseCostPrice?: number;
}

export function VariantGrid({ combinations, onChange, basePrice, baseCostPrice }: VariantGridProps) {
  if (combinations.length === 0) return null;

  const updateCombination = (index: number, field: keyof ProductVariant, value: any) => {
    const newCombs = [...combinations];
    newCombs[index] = { ...newCombs[index], [field]: value };
    onChange(newCombs);
  };

  // Get dynamic headers from first combination attributes
  const headers = Object.keys(combinations[0].attributes || {});

  return (
    <div className="border border-black rounded-sm overflow-x-auto w-full mt-6 bg-white shrink-0">
      <table className="w-full text-sm text-left border-collapse">
        <thead className="bg-black text-white font-semibold">
          <tr>
            <th className="py-3 px-4 min-w-[80px] border-b border-black">Variant</th>
            <th className="py-3 px-4 min-w-[150px] border-b border-black">SKU</th>
            <th className="py-3 px-4 min-w-[120px] border-b border-black">Cost Price</th>
            <th className="py-3 px-4 min-w-[120px] border-b border-black">Selling Price</th>
            <th className="py-3 px-4 min-w-[100px] border-b border-black">Stock</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/10">
          {combinations.map((c, i) => {
            const variantTitle = headers.map(h => c.attributes![h]).join(" / ");
            return (
              <tr key={i} className="hover:bg-zinc-50 transition-colors">
                <td className="py-2 px-4 font-medium whitespace-nowrap text-zinc-900">{variantTitle}</td>
                <td className="py-2 px-3">
                  <Input 
                    required
                    placeholder="Auto-gen or Enter" 
                    value={c.sku || ""} 
                    onChange={e => updateCombination(i, "sku", e.target.value)} 
                    className="h-8 max-w-[180px] rounded-sm border-zinc-300 focus-visible:ring-black focus-visible:border-black"
                  />
                </td>
                <td className="py-2 px-3">
                  <Input 
                    type="number" 
                    min="0"
                    step="0.01"
                    required
                    value={c.cost_price ?? baseCostPrice ?? ""} 
                    onChange={e => updateCombination(i, "cost_price", parseFloat(e.target.value) || 0)} 
                    className="h-8 max-w-[120px] rounded-sm border-zinc-300 focus-visible:ring-black focus-visible:border-black"
                  />
                </td>
                <td className="py-2 px-3">
                  <Input 
                    type="number" 
                    min="0"
                    step="0.01"
                    required
                    value={c.selling_price ?? basePrice ?? ""} 
                    onChange={e => updateCombination(i, "selling_price", parseFloat(e.target.value) || 0)} 
                    className="h-8 max-w-[120px] rounded-sm border-zinc-300 focus-visible:ring-black focus-visible:border-black"
                  />
                </td>
                <td className="py-2 px-3">
                  <Input 
                    type="number" 
                    min="0"
                    required
                    value={c.stock_level ?? ""} 
                    onChange={e => updateCombination(i, "stock_level", parseInt(e.target.value) || 0)} 
                    className="h-8 max-w-[100px] rounded-sm border-zinc-300 focus-visible:ring-black focus-visible:border-black"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function generateCartesianProduct(dimensions: {name: string, values: string[]}[]): Record<string, string>[] {
  const activeDims = dimensions.filter(d => d.values.length > 0);
  if (activeDims.length === 0) return [];

  const reduceCartesian = (arrays: string[][]): string[][] => {
    return arrays.reduce<string[][]>((acc, curr) => {
      if (acc.length === 0) return curr.map(item => [item]);
      return curr.flatMap(item => acc.map(combo => [...combo, item]));
    }, []);
  };

  const valuesArrays = activeDims.map(d => d.values);
  const products = reduceCartesian(valuesArrays);

  return products.map(product => {
    const attr: Record<string, string> = {};
    activeDims.forEach((dim, idx) => {
      attr[dim.name] = product[idx];
    });
    return attr;
  });
}
