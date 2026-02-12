package handlers

import (
	"testing"
)

func TestExtractSerperPrice(t *testing.T) {
	tests := []struct {
		name       string
		title      string
		snippet    string
		attributes map[string]string
		expected   string
	}{
		{
			name:     "Standard Price",
			title:    "iPhone 13 Price in Nepal",
			snippet:  "The price of iPhone 13 in Nepal is Rs. 150000.",
			expected: "Rs. 150000",
		},
		{
			name:     "Comma Separated Price",
			title:    "iPhone 13",
			snippet:  "Price: Rs. 1,50,000",
			expected: "Rs. 150000",
		},
		{
			name:    "Daraz Format 1",
			title:   "Apple iPhone 16 - EvoStore | Daraz.com.np",
			snippet: "Buy Apple iPhone 16 - EvoStore at best price in Nepal from Daraz.com.np. Genuine Products, Warranty, Fast Delivery.",
			attributes: map[string]string{
				"Price": "Rs. 250000",
			},
			expected: "Rs. 250000",
		},
		{
			name:     "Daraz Format 2 (No Attributes)",
			title:    "Apple iPhone 16 - EvoStore | Daraz.com.np",
			snippet:  "Rs. 250,000.00 - In stock. Buy Apple iPhone 16 - EvoStore at best price in Nepal.",
			expected: "Rs. 250000",
		},
		{
			name:     "NPR with dot",
			title:    "Laptop",
			snippet:  "NPR. 120000 is the price",
			expected: "Rs. 120000",
		},
		{
			name:     "Price with trailing zeros",
			title:    "Phone",
			snippet:  "Rs. 25000.00",
			expected: "Rs. 25000",
		},
		{
			name:     "Price with dot separator",
			title:    "Item",
			snippet:  "Price. 5000",
			expected: "Rs. 5000",
		},
		{
			name:     "Price with NPR",
			title:    "Laptop Price",
			snippet:  "NPR 120000 is the price.",
			expected: "Rs. 120000",
		},
		{
			name:     "Price with रू",
			title:    "Mobile",
			snippet:  "Price: रू 25000",
			expected: "Rs. 25000",
		},
		{
			name:     "Complex Snippet",
			title:    "Some Product",
			snippet:  "Compare prices. Best deal Rs. 99,999 only today.",
			expected: "Rs. 99999",
		},
		{
			name:     "Daraz Snippet Hidden Price",
			title:    "iPhone 16 - Daraz",
			snippet:  "Daraz.com.np: Online shopping for iPhone 16 in Nepal. Price starts from Rs. 1,55,000.",
			expected: "Rs. 155000",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := extractSerperPrice(tt.title, tt.snippet, tt.attributes)
			if got != tt.expected && got != "Check Link" {
				// We allow "Check Link" if it fails, but we want to assert it PASSES for valid cases
				// But for ANY match, we want to see what it returns.
			}

			// For this test, we want exact matches to verify our improvements
			if got != tt.expected {
				t.Errorf("extractSerperPrice() = %v, want %v", got, tt.expected)
			}
		})
	}
}
