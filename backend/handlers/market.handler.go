package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"regexp"
	"sort"
	"storemanagement/utils"
	"strings"

	"github.com/gin-gonic/gin"
)

type SerperResponse struct {
	Organic []struct {
		Title      string            `json:"title"`
		Link       string            `json:"link"`
		Snippet    string            `json:"snippet"`
		ImageUrl   string            `json:"imageUrl"`
		Attributes map[string]string `json:"attributes"`
	} `json:"organic"`
}

type MarketPriceItem struct {
	Title   string `json:"title"`
	Link    string `json:"link"`
	Price   string `json:"price"`
	Source  string `json:"source"`
	Image   string `json:"image"`
	Snippet string `json:"snippet"`
}

func GetMarketPrices(c *gin.Context) {
	query := c.Query("q")
	if query == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Query parameter 'q' is required", nil)
		return
	}

	apiKey := os.Getenv("SERPER_API_KEY")
	if apiKey == "" {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Serper API key not configured", fmt.Errorf("SERPER_API_KEY not set"))
		return
	}

	// Construct search query for specific sites
	// Add "price" keyword to encourage snippets with pricing info
	searchQuery := fmt.Sprintf("%s price site:daraz.com.np", query)

	payload := map[string]interface{}{
		"q": searchQuery,
	}
	payloadBytes, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://google.serper.dev/search", bytes.NewBuffer(payloadBytes))
	req.Header.Add("X-API-KEY", apiKey)
	req.Header.Add("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch market data", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errorBody map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&errorBody)
		utils.ErrorResponse(c, resp.StatusCode, "Serper API returned an error", fmt.Errorf("status: %d, body: %v", resp.StatusCode, errorBody))
		return
	}

	var serperResp SerperResponse
	if err := json.NewDecoder(resp.Body).Decode(&serperResp); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to parse market data", err)
		return
	}

	var results []MarketPriceItem
	for _, item := range serperResp.Organic {
		// Filter out accessories
		lowerTitle := strings.ToLower(item.Title)
		if strings.Contains(lowerTitle, "case") ||
			strings.Contains(lowerTitle, "cover") ||
			strings.Contains(lowerTitle, "glass") ||
			strings.Contains(lowerTitle, "protector") ||
			strings.Contains(lowerTitle, "holder") ||
			strings.Contains(lowerTitle, "guard") {
			continue
		}

		source := "Unknown"
		if strings.Contains(item.Link, "daraz.com.np") {
			source = "Daraz"
		} else if strings.Contains(item.Link, "hamrobazar.com") {
			source = "Hamrobazar"
		} else if strings.Contains(item.Link, "okdam.com") {
			source = "OkDam"
		} else {
			// If it's not from our primary sites, skip it to keep results clean
			continue
		}
		fmt.Println(item)
		price := extractSerperPrice(item.Title, item.Snippet, item.Attributes)
		cleanedTitle := cleanMarketTitle(item.Title, source)

		results = append(results, MarketPriceItem{
			Title:   cleanedTitle,
			Link:    item.Link,
			Price:   price,
			Source:  source,
			Image:   item.ImageUrl,
			Snippet: item.Snippet,
		})
	}

	// Sort results: Valid prices first, then "Check Link"
	// This ensures that if any result has a price, it shows up at the top
	sort.SliceStable(results, func(i, j int) bool {
		// If i has a price and j doesn't, i comes first
		if results[i].Price != "Check Link" && results[j].Price == "Check Link" {
			return true
		}
		// If j has a price and i doesn't, j comes first
		if results[i].Price == "Check Link" && results[j].Price != "Check Link" {
			return false
		}
		// Otherwise maintain original order (relevance)
		return i < j
	})

	utils.SuccessResponse(c, "Market prices fetched successfully", results)
}

func extractSerperPrice(title string, snippet string, attributes map[string]string) string {
	// 1. Try Serper attributes (structured data)
	priceKeys := []string{"Price", "price", "Current Price", "Offer Price", "List Price", "Sale Price"}
	for _, k := range priceKeys {
		if val, ok := attributes[k]; ok && val != "" {
			return val
		}
	}

	// 2. Combination of title and snippet for search
	combined := title + " " + snippet
	// Replace non-breaking spaces and normalize
	combined = strings.ReplaceAll(combined, "\u00a0", " ")
	combined = strings.ReplaceAll(combined, ",", "")

	// 3. Regex patterns for Nepali currency
	// We use multiple patterns to catch various ways prices are listed
	patterns := []struct {
		re    *regexp.Regexp
		index int
	}{
		// Updated to allow optional dot after NPR, Rs, etc.
		{regexp.MustCompile(`(?i)(?:Rs\.?|रू|₨|NPR\.?)\s*(\d+(?:\.\d+)?)`), 1},
		{regexp.MustCompile(`(?i)Price[:\s]*(\d+(?:\.\d+)?)`), 1},
		{regexp.MustCompile(`(?i)Price[\.:\s]*(\d+(?:\.\d+)?)`), 1},
		{regexp.MustCompile(`\b(\d{3,10})\s*(?:/-|NPR|Rs\.?)`), 1},
	}

	for _, p := range patterns {
		matches := p.re.FindStringSubmatch(combined)
		if len(matches) > p.index {
			// Format the price to remove trailing .00
			rawPrice := matches[p.index]
			rawPrice = strings.TrimSuffix(rawPrice, ".00")
			return "Rs. " + rawPrice
		}
	}

	// 4. Proximity search: Look for currency symbols followed by large numbers anywhere (up to 30 chars away)
	proximityRe := regexp.MustCompile(`(?i)(?:Rs|NPR|रू|₨).{0,30}?(\d{3,10})`)
	proxMatches := proximityRe.FindStringSubmatch(combined)
	if len(proxMatches) > 1 {
		return "Rs. " + proxMatches[1]
	}

	return "Check Link"
}

func cleanMarketTitle(title string, source string) string {
	cleaned := title

	// Remove common SEO prefixes/suffixes
	seoPatterns := []string{
		`(?i)Buy\s+`,
		`(?i)Online\s+at\s+Best\s+Price\s+in\s+Nepal`,
		`(?i)at\s+Best\s+Price\s+in\s+Nepal`,
		`(?i)Price\s+in\s+Nepal`,
		`(?i)- Hamrobazar`,
		`(?i)\| Daraz\.com\.np`,
		`(?i)\| Daraz`,
		`(?i)Nepal - Daraz`,
		`(?i)- OkDam\.com`,
		`(?i)OkDam`,
	}

	for _, pattern := range seoPatterns {
		re := regexp.MustCompile(pattern)
		cleaned = re.ReplaceAllString(cleaned, "")
	}

	// Remove multiple spaces and trim
	reSpace := regexp.MustCompile(`\s+`)
	cleaned = reSpace.ReplaceAllString(cleaned, " ")
	cleaned = strings.TrimSpace(cleaned)

	// If title becomes empty or too short after cleaning, fall back to original
	if len(cleaned) < 5 {
		return title
	}

	return cleaned
}
