# Supplier Discovery Feature

## Overview
This feature integrates the Serper Places API to help you discover wholesale suppliers near your location. Instead of manually entering supplier details, you can now search for suppliers and automatically populate the form.

## Backend API

### Endpoint
```
GET /api/market/suppliers?q=<query>&location=<location>
```

### Parameters
- `q` (required): Search query (e.g., "shirt", "electronics", "groceries")
- `location` (optional): Location for the search (default: "Nepal")

### Example Request
```bash
curl -X GET "http://localhost:8000/api/market/suppliers?q=shirt&location=Kathmandu" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Example Response
```json
{
  "message": "Suppliers found successfully",
  "data": [
    {
      "name": "ABC Wholesale Store",
      "address": "123 Main Street, Kathmandu",
      "phone": "+977-1-4567890",
      "website": "https://abcwholesale.com.np",
      "rating": 4.5,
      "reviews": 128,
      "category": "Wholesale clothing store",
      "place_id": "ChIJ...",
      "latitude": 27.7172,
      "longitude": 85.3240
    }
  ]
}
```

## Frontend Usage

### In the Supplier Dialog

1. Click "Add Supplier" button
2. The dialog opens with two tabs:
   - **Discover**: Search for suppliers using Serper Places API
   - **Manual Entry**: Traditional manual form entry

3. In the Discover tab:
   - Enter search terms (e.g., "shirt", "electronics", "groceries")
   - Specify location (defaults to "Nepal")
   - Click "Search"
   - Browse results with ratings, reviews, and contact info
   - Click "Use" on any supplier to auto-fill the manual form
   - Add email (not provided by API) and submit

### Programmatic Usage

```typescript
import { inventoryService } from '@/services/inventory';

// Search for suppliers
const suppliers = await inventoryService.findSuppliers('shirt', 'Kathmandu');

// Results are of type DiscoveredSupplier
interface DiscoveredSupplier {
    name: string;
    address: string;
    phone: string;
    website: string;
    rating: number;
    reviews: number;
    category: string;
    place_id: string;
    latitude: number;
    longitude: number;
}
```

## Configuration

### Environment Variables
Make sure you have the Serper API key in your backend `.env` file:

```env
SERPER_API_KEY=your_api_key_here
```

You mentioned using this API key: `0ed22385d6a6d56fe48c6a962ed1dfe3ad253ddd`

**⚠️ Important**: Never commit API keys to version control. Add this to your `.env` file.

## Search Tips

### Effective Search Queries
- Use product categories: "shirt", "electronics", "groceries"
- Be specific: "wholesale clothing", "electronics distributor"
- Include location in query if needed: "shirt wholesale Kathmandu"

### Location Format
- City names: "Kathmandu", "Pokhara", "Lalitpur"
- Full addresses: "Thamel, Kathmandu, Nepal"
- Country-level: "Nepal"

## How It Works

1. **User enters search query** in the Discover tab
2. **Backend calls Serper Places API** with the query and location
3. **Serper returns nearby businesses** matching the search
4. **Backend formats results** and returns to frontend
5. **User browses suppliers** with ratings, reviews, and contact info
6. **User selects a supplier** to auto-fill the creation form
7. **User adds missing info** (like email) and submits
8. **Supplier is saved** to the database

## Benefits

✅ **Save Time**: No need to manually research suppliers
✅ **Real Data**: Get actual business information from Google
✅ **Ratings & Reviews**: Make informed decisions
✅ **Location-Based**: Find suppliers near you
✅ **Easy Integration**: One-click to use discovered suppliers

## Error Handling

The feature handles various error scenarios:
- Missing API key
- Invalid search queries
- API rate limits
- No results found
- Network errors

All errors display user-friendly toast notifications.

## Example Use Cases

### Finding Shirt Suppliers in Kathmandu
1. Open Add Supplier dialog
2. Search: "shirt"
3. Location: "Kathmandu"
4. Review results and select the best match

### Finding Electronics Wholesalers
1. Open Add Supplier dialog
2. Search: "electronics wholesale"
3. Location: "Nepal"
4. Browse and compare multiple suppliers

### Finding Grocery Suppliers in Pokhara
1. Open Add Supplier dialog
2. Search: "groceries"
3. Location: "Pokhara"
4. Select local suppliers

## Next Steps

Potential enhancements:
- Save favorite suppliers from search
- Bulk import multiple suppliers
- Supplier verification system
- Map view of supplier locations
- Supplier performance tracking
