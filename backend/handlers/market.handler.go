package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"regexp"
	"storemanagement/utils"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type SerperShoppingResponse struct {
	Shopping []struct {
		Title     string `json:"title"`
		Source    string `json:"source"`
		Link      string `json:"link"`
		Price     string `json:"price"`
		Thumbnail string `json:"thumbnail"`
	} `json:"shopping"`
}

type SerperOrganicResponse struct {
	Organic []struct {
		Title      string            `json:"title"`
		Link       string            `json:"link"`
		Snippet    string            `json:"snippet"`
		ImageUrl   string            `json:"imageUrl"`
		Attributes map[string]string `json:"attributes"`
	} `json:"organic"`
}

type MarketPriceItem struct {
	Title  string `json:"title"`
	Link   string `json:"link"`
	Price  string `json:"price"`
	Source string `json:"source"`
	Image  string `json:"image"`
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

	// Initialize results to an empty slice to avoid 'null' in JSON response
	results := []MarketPriceItem{}

	// --- STEP 1: Try Google Shopping (Structured) ---
	searchQuery := fmt.Sprintf("%s site:daraz.com.np", query)
	payload := map[string]interface{}{
		"q":  searchQuery,
		"gl": "np",
	}
	payloadBytes, _ := json.Marshal(payload)

	req, _ := http.NewRequest("POST", "https://google.serper.dev/shopping", bytes.NewBuffer(payloadBytes))
	req.Header.Add("X-API-KEY", apiKey)
	req.Header.Add("Content-Type", "application/json")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err == nil {
		defer resp.Body.Close()
		if resp.StatusCode == http.StatusOK {
			var serperResp SerperShoppingResponse
			if err := json.NewDecoder(resp.Body).Decode(&serperResp); err == nil {
				for _, item := range serperResp.Shopping {
					// Focus on results that mention Daraz
					if strings.Contains(strings.ToLower(item.Source), "daraz") || strings.Contains(item.Link, "daraz.com.np") {
						results = append(results, MarketPriceItem{
							Title:  item.Title,
							Link:   item.Link,
							Price:  item.Price,
							Source: "Daraz",
							Image:  item.Thumbnail,
						})
					}
				}
			}
		}
	}

	// --- STEP 2: Fallback to Organic Search if no shopping results ---
	if len(results) == 0 {
		fallbackQuery := fmt.Sprintf("%s price site:daraz.com.np", query)
		payloadFallback := map[string]interface{}{
			"q": fallbackQuery,
		}
		fallbackBytes, _ := json.Marshal(payloadFallback)

		reqF, _ := http.NewRequest("POST", "https://google.serper.dev/search", bytes.NewBuffer(fallbackBytes))
		reqF.Header.Add("X-API-KEY", apiKey)
		reqF.Header.Add("Content-Type", "application/json")

		respF, err := client.Do(reqF)
		if err == nil {
			defer respF.Body.Close()
			if respF.StatusCode == http.StatusOK {
				var organicResp SerperOrganicResponse
				if err := json.NewDecoder(respF.Body).Decode(&organicResp); err == nil {
					for _, item := range organicResp.Organic {
						if strings.Contains(item.Link, "daraz.com.np") {
							price := extractSerperPrice(item.Title, item.Snippet, item.Attributes)
							results = append(results, MarketPriceItem{
								Title:  cleanMarketTitle(item.Title, "Daraz"),
								Link:   item.Link,
								Price:  price,
								Source: "Daraz",
								Image:  item.ImageUrl,
							})
						}
					}
				}
			}
		}
	}

	utils.SuccessResponse(c, "Market prices fetched successfully", results)
}

func extractSerperPrice(title string, snippet string, attributes map[string]string) string {
	combined := title + " " + snippet
	combined = strings.ReplaceAll(combined, "\u00a0", " ")
	combined = strings.ReplaceAll(combined, ",", "")

	re := regexp.MustCompile(`(?i)(?:Rs\.?|रू|₨|NPR\.?)\s*(\d+(?:\.\d+)?)`)
	matches := re.FindStringSubmatch(combined)
	if len(matches) > 1 {
		return "Rs. " + strings.TrimSuffix(matches[1], ".00")
	}

	for _, k := range []string{"Price", "price", "Current Price"} {
		if val, ok := attributes[k]; ok && val != "" {
			return val
		}
	}

	return "Check Link"
}

func cleanMarketTitle(title string, source string) string {
	cleaned := title
	re := regexp.MustCompile(`(?i)(?:Buy\s+|Online\s+at\s+Best\s+Price\s+in\s+Nepal|at\s+Best\s+Price\s+in\s+Nepal|Price\s+in\s+Nepal|\| Daraz\.com\.np|\| Daraz|Nepal - Daraz)`)
	cleaned = re.ReplaceAllString(cleaned, "")
	return strings.TrimSpace(cleaned)
}
