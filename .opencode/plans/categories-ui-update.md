# Categories Page UI Update Plan

## Current State
The Categories page uses an outdated light theme with:
- White backgrounds (`bg-white`)
- Gray borders (`border-gray-200`)
- Teal accent colors (`bg-teal-600`, `text-teal-600`, `border-teal-300`)
- Rounded corners (`rounded-xl`, `rounded-lg`)
- Standard typography

## Target Design (matching Suppliers/Inventory/Customers pages)
- Dark backgrounds: `bg-[#111111]`, `bg-[#0A0A0A]`
- Dark borders: `border-[#1A1A1A]`, `border-[#303030]`
- Red accent: `#DA291C` (primary), `#B01E0A` (hover)
- Sharp corners: `rounded-[2px]`
- Typography: uppercase tracking, bold fonts, specific sizes

## Changes Required

### 1. Import Changes
- Replace `MoreVertical` with `MoreHorizontal` icon

### 2. Loading Skeleton Section (lines 71-90)
- Add eyebrow label: `<p className="text-[11px] text-[#555555] uppercase tracking-[1.5px] mb-1">Warehouse</p>`
- Change heading: `text-[24px] font-bold text-white tracking-tight`
- Update skeleton container: `bg-[#111111] border border-[#1A1A1A] rounded-[2px]`

### 3. Error State (lines 92-101)
- Change error text color: `text-[#DA291C]`
- Change secondary text: `text-[#888888]`
- Add icon and styling matching Suppliers error state

### 4. Header Section (lines 103-129)
- Layout: `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`
- Add eyebrow: `text-[11px] text-[#555555] uppercase tracking-[1.5px] mb-1` with text "Warehouse"
- Heading: `text-[22px] font-medium text-white tracking-tight`
- Button: `h-9 px-4 rounded-[2px] bg-white text-black text-[11px] font-bold uppercase tracking-[1px] hover:bg-[#EEEEEE]`
- Spacing: `space-y-6 pb-24 lg:pb-8`

### 5. Offline Banner (lines 131-144)
- Container: `border border-[#DA291C]/30 bg-[#DA291C]/5 rounded-[2px] p-4`
- Icon: `text-[#DA291C]`
- Title: `text-[12px] font-bold text-white uppercase tracking-[1px]`
- Description: `text-[11px] text-[#DA291C] uppercase tracking-[0.5px]`

### 6. Category Cards Grid (lines 146-197)
- Card container: `bg-[#111111] rounded-[2px] border border-[#1A1A1A] hover:border-[#303030]`
- Icon container: `h-10 w-10 rounded-[2px] bg-[#0A0A0A] border border-[#303030]`
- Icon: `text-[#DA291C]`
- Category name: `font-bold text-[14px] text-white uppercase tracking-tight group-hover:text-[#DA291C]`
- Description: `text-[11px] text-[#888888]`
- Dropdown trigger: `h-7 w-7 rounded-[2px] border border-[#1A1A1A] bg-[#0A0A0A]`
- Replace `MoreVertical` with `MoreHorizontal`
- Dropdown content: `bg-[#0A0A0A] border-[#1A1A1A] rounded-[2px]`
- Dropdown items: `text-[11px] font-bold uppercase tracking-[0.5px]`
- Delete item: `text-[#DA291C] focus:bg-[#DA291C]/10`

### 7. Empty State (lines 198-212)
- Container: `bg-[#111111] rounded-[2px] border border-[#1A1A1A] p-16`
- Icon container: `h-14 w-14 rounded-[2px] bg-[#0A0A0A] border border-[#1A1A1A]`
- Icon: `text-[#1A1A1A]`
- Heading: `text-[13px] font-bold text-white uppercase tracking-[1px]`
- Description: `text-[11px] text-[#555555] uppercase tracking-[0.5px]`
- Button: `h-10 px-6 rounded-[2px] bg-white text-black text-[11px] font-bold uppercase tracking-[1px] hover:bg-[#EEEEEE]`

### 8. Delete Confirmation Dialog (lines 215-234)
- Content: `bg-[#0A0A0A] border-[#1A1A1A] rounded-[2px] max-w-md`
- Title: `text-[16px] font-bold text-white uppercase tracking-[1px]`
- Description: `text-[12px] text-[#888888] leading-relaxed`
- Cancel button: `bg-transparent border-[#1A1A1A] hover:bg-[#1A1A1A] text-white text-[10px] uppercase font-black tracking-widest h-10 rounded-[2px]`
- Delete button: `bg-[#DA291C] hover:bg-[#B01E0A] text-white text-[10px] uppercase font-black tracking-widest h-10 rounded-[2px]`

## File to Modify
- `frontend/src/pages/Categories.tsx`
