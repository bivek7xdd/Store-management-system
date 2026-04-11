# Find Suppliers Page - Quick Guide

## 📍 Location
Access the new page from:
- **Navigation**: Inventory → Find Suppliers (in the sidebar)
- **Direct URL**: `/find-suppliers`

## ✨ Features

### Simple & Clean
- **ONLY uses Serper API** - no complex category matching
- No Geoapify API dependency
- Straightforward search interface
- Beautiful supplier cards with ratings and reviews

### How It Works

1. **Search**
   - Enter product category (e.g., "shirt", "electronics", "groceries")
   - Set location (defaults to "Nepal")
   - Click "Search Suppliers"

2. **Browse Results**
   - View supplier cards with:
     - Business name
     - Address with map pin icon
     - Phone number
     - Star ratings and review count
     - Category badge
     - Website link (opens in new tab)

3. **Use a Supplier**
   - Click "Use This Supplier" button
   - Automatically redirects to Suppliers page
   - Opens the Add Supplier dialog
   - Form is pre-filled with supplier details
   - Just add email and submit!

## 🎯 Example Searches

| Product | Location | Results |
|---------|----------|---------|
| shirt | Kathmandu | Clothing wholesalers in Kathmandu |
| electronics | Nepal | Electronics suppliers nationwide |
| groceries | Pokhara | Grocery suppliers in Pokhara |
| hardware | Lalitpur | Hardware stores in Lalitpur |

## 🔄 Workflow

```
Find Suppliers Page
        ↓
   Search with Serper API
        ↓
   Browse Results
        ↓
   Click "Use This Supplier"
        ↓
   Redirect to /inventory/suppliers
        ↓
   Add Supplier Dialog Opens (pre-filled)
        ↓
   Add email & submit
        ↓
   Supplier saved to database ✓
```

## 💡 Tips for Best Results

### Search Queries
✅ **Good**:
- "shirt"
- "electronics wholesale"
- "groceries"
- "hardware supplies"

❌ **Avoid**:
- Too specific: "red cotton shirt size M"
- Brand names: "Nike shoes"
- Very generic: "stuff", "things"

### Locations
✅ **Good**:
- City names: "Kathmandu", "Pokhara", "Lalitpur"
- Regions: "Bagmati", "Gandaki"
- Country: "Nepal"

## 🆚 Comparison: Find Suppliers vs Market Discovery

| Feature | Find Suppliers | Market Discovery |
|---------|----------------|------------------|
| **API** | Serper ONLY | Geoapify (complex) |
| **Simplicity** | ⭐⭐⭐⭐⭐ Very Simple | ⭐⭐ Complex |
| **Setup** | Works out of the box | Needs Geoapify API key |
| **Category Matching** | Not needed | Required (causes errors) |
| **Results** | Real businesses with ratings | Mixed quality |
| **Best For** | Quick supplier discovery | Detailed market research |

## 🛠️ Technical Details

### Backend Endpoint
```
GET /api/market/suppliers?q=<query>&location=<location>
```

### Frontend Service
```typescript
import { inventoryService } from '@/services/inventory';

const suppliers = await inventoryService.findSuppliers('shirt', 'Kathmandu');
```

### Response Format
```typescript
interface DiscoveredSupplier {
    name: string;
    address: string;
    phone: string;
    website: string;
    rating: number;      // 0-5 stars
    reviews: number;     // Number of reviews
    category: string;    // Business category
    place_id: string;    // Google Place ID
    latitude: number;
    longitude: number;
}
```

## 🎨 UI Components

### Search Card
- Product/category input
- Location input
- Search button with loading state

### Results Grid
- Responsive grid (1/2/3 columns)
- Supplier cards with hover effects
- Rating badges
- Action buttons

### Empty States
- Initial state with instructions
- No results state with tips
- Loading skeletons

## 🔧 Configuration

### Required
- Backend: `SERPER_API_KEY` in `.env`
- Frontend: No configuration needed!

### Optional
- Change default location in the search form
- Modify search radius in backend handler

## 🐛 Troubleshooting

### "No suppliers found"
- Try different keywords (more generic)
- Change location to a bigger city
- Try "Nepal" as location for broader search

### "Failed to search suppliers"
- Check if backend is running
- Verify SERPER_API_KEY is set
- Check browser console for errors

### Form not pre-filling
- Make sure you clicked "Use This Supplier"
- Check if popup blocker is enabled
- Try refreshing and searching again

## 🚀 Future Enhancements

Potential improvements:
- [ ] Save favorite searches
- [ ] Export supplier list to CSV
- [ ] Compare multiple suppliers
- [ ] Map view of supplier locations
- [ ] Filter by rating/distance
- [ ] Contact supplier directly
- [ ] Request quotes

## 📝 Files Modified/Created

### New Files
- `/frontend/src/pages/FindSuppliers.tsx` - Main page component

### Modified Files
- `/frontend/src/App.tsx` - Added route
- `/frontend/src/components/InventorySidebarItem.tsx` - Added navigation link
- `/frontend/src/components/CreateInventoryDialogs.tsx` - Added prefill listener

### Backend (Already Done)
- `/backend/handlers/market.handler.go` - FindSuppliers handler
- `/backend/main.go` - Route registration
- `/frontend/src/services/inventory.ts` - findSuppliers service method

## ✅ Testing Checklist

- [x] Page loads without errors
- [x] Search form works
- [x] Results display correctly
- [x] Supplier cards show all info
- [x] "Use This Supplier" redirects
- [x] Form pre-fills correctly
- [x] Can submit pre-filled form
- [x] Mobile responsive
- [x] Loading states work
- [x] Empty states show
- [x] Error handling works

## 🎉 Success!

You now have a **simple, clean supplier discovery page** that uses ONLY the Serper API - no complex category matching, no Geoapify dependencies, just straightforward search!
