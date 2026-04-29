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
    <div className="space-y-4 p-5 bg-[#0A0A0A] border border-[#1A1A1A] rounded-[2px]">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-medium uppercase tracking-[1.5px] text-[#8F8F8F]">Variant Options</h4>
      </div>

      <div className="space-y-4">
        {dimensions.map((dim, i) => (
          <div key={i} className="bg-[#111111] border border-[#1A1A1A] p-4 flex flex-col sm:flex-row gap-4 rounded-[2px] hover:border-[#303030] transition-colors">
            <div className="sm:w-1/3 flex items-start justify-between">
              <Label className="text-[11px] font-bold uppercase tracking-[1px] text-[#CCCCCC]">{dim.name}</Label>
              <button 
                type="button" 
                onClick={() => removeDimension(i)} 
                className="h-6 w-6 text-[#555555] hover:text-[#DA291C] transition-colors flex items-center justify-center"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap gap-2">
                {dim.values.map((v, vIndex) => (
                  <div key={vIndex} className="flex gap-2 items-center px-2 py-1 bg-[#0A0A0A] border border-[#1A1A1A] text-[#CCCCCC] text-[12px] rounded-[2px] group">
                    {v}
                    <button type="button" onClick={() => removeValue(i, vIndex)} className="text-[#555555] hover:text-white transition-colors">
                        <X className="h-3 w-3"/>
                    </button>
                  </div>
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
                  className="h-9 bg-[#0A0A0A] border-[#1A1A1A] text-white rounded-[2px] text-[13px] placeholder:text-[#555555] focus-visible:ring-0 focus-visible:border-[#303030]"
                />
                <button 
                  type="button" 
                  onClick={() => addValue(i)} 
                  className="px-4 h-9 bg-[#1A1A1A] text-white text-[11px] uppercase tracking-[1px] rounded-[2px] hover:bg-[#303030] transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {dimensions.length < 3 && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-[#1A1A1A]">
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
            className="h-10 bg-[#111111] border-[#1A1A1A] text-white rounded-[2px] text-[13px] placeholder:text-[#555555] focus-visible:ring-0 focus-visible:border-[#303030]"
          />
          <button 
            type="button" 
            onClick={addDimension} 
            className="flex items-center gap-2 px-4 h-10 border border-[#1A1A1A] text-[#8F8F8F] hover:text-white hover:bg-[#1A1A1A] text-[11px] uppercase tracking-[1px] rounded-[2px] transition-all whitespace-nowrap"
          >
              <Plus className="h-3.5 w-3.5"/>
              Add Option
          </button>
        </div>
      )}
    </div>
  );
}
