import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface VariantDimension {
  name: string; // e.g. "Size", "Color"
  values: string[]; // e.g. ["S", "M", "L"]
}

interface VariantBuilderProps {
  dimensions: VariantDimension[];
  onChange: (dimensions: VariantDimension[]) => void;
}

export function VariantBuilder({ dimensions, onChange }: VariantBuilderProps) {
  const [newDimName, setNewDimName] = useState("");
  const [newVal, setNewVal] = useState("");
  const [activeDimIndex, setActiveDimIndex] = useState<number | null>(null);

  const addDimension = () => {
    if (!newDimName.trim()) return;
    if (dimensions.some((d) => d.name.toLowerCase() === newDimName.toLowerCase())) return;
    
    onChange([...dimensions, { name: newDimName.trim(), values: [] }]);
    setNewDimName("");
  };

  const removeDimension = (index: number) => {
    const newDims = [...dimensions];
    newDims.splice(index, 1);
    onChange(newDims);
  };

  const addValue = (dimIndex: number) => {
    if (!newVal.trim()) return;
    if (dimensions[dimIndex].values.includes(newVal.trim())) return;

    const newDims = [...dimensions];
    newDims[dimIndex].values.push(newVal.trim());
    onChange(newDims);
    setNewVal("");
  };

  const removeValue = (dimIndex: number, valIndex: number) => {
    const newDims = [...dimensions];
    newDims[dimIndex].values.splice(valIndex, 1);
    onChange(newDims);
  };

  return (
    <div className="space-y-4 p-4 border border-black rounded-sm bg-zinc-50">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm tracking-tight text-black">Variant Options</h4>
      </div>

      <div className="space-y-4">
        {dimensions.map((dim, i) => (
          <div key={i} className="border border-black p-3 flex flex-col sm:flex-row gap-4 bg-white rounded-sm">
            <div className="sm:w-1/3 flex items-start justify-between">
              <Label className="text-sm font-bold uppercase tracking-wider">{dim.name}</Label>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeDimension(i)} className="h-6 w-6 text-red-600 hover:bg-neutral-100 rounded-sm">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap gap-2">
                {dim.values.map((v, vIndex) => (
                  <Badge key={vIndex} className="flex gap-1 items-center px-2 py-1 bg-black text-white hover:bg-black rounded-sm">
                    {v}
                    <button type="button" onClick={() => removeValue(i, vIndex)} className="ml-1 text-zinc-400 hover:text-white transition-colors">
                        <X className="h-3 w-3"/>
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input 
                  placeholder={`Add ${dim.name} option...`}
                  value={activeDimIndex === i ? newVal : ""}
                  onChange={(e) => {
                    setActiveDimIndex(i);
                    setNewVal(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addValue(i);
                    }
                  }}
                  className="h-9 rounded-sm border-black focus-visible:ring-black"
                />
                <Button type="button" size="sm" onClick={() => addValue(i)} className="rounded-sm bg-black text-white hover:bg-black/90">Add</Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {dimensions.length < 3 && (
        <div className="flex gap-2 mt-4">
          <Input 
            placeholder="E.g. Size, Color, Flow..." 
            value={newDimName}
            onChange={(e) => setNewDimName(e.target.value)}
            onKeyDown={(e) => {
              if(e.key === "Enter") {
                e.preventDefault();
                addDimension();
              }
            }}
            className="rounded-sm border-black focus-visible:ring-black h-9"
          />
          <Button type="button" variant="outline" onClick={addDimension} className="rounded-sm border-black hover:bg-black hover:text-white transition-colors h-9">
              <Plus className="h-4 w-4 mr-1"/>Option
          </Button>
        </div>
      )}
    </div>
  );
}
