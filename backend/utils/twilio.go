package utils

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/NdoleStudio/httpsms-go"
)

func SendSMS(to string, body string) error {
	apiKey := os.Getenv("HTTPSMS_API_KEY")
	if apiKey == "" {
		return fmt.Errorf("HTTPSMS_API_KEY environment variable not set")
	}

	from := os.Getenv("HTTPSMS_PHONE_NUMBER")
	if from == "" {
		return fmt.Errorf("HTTPSMS_PHONE_NUMBER environment variable not set")
	}

	client := httpsms.New(httpsms.WithAPIKey(apiKey))

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, _, err := client.Messages.Send(ctx, &httpsms.MessageSendParams{
		From:    from,
		To:      to,
		Content: body,
	})

	if err != nil {
		return fmt.Errorf("failed to send SMS via httpSMS: %w", err)
	}

	return nil
}
