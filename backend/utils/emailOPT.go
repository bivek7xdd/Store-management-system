package utils

import (
	"bytes"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"net/smtp"
	"os"

	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
)

// IsDevMode returns true if running in development mode (no email service configured)
func IsDevMode() bool {
	return os.Getenv("DEV_MODE") == "true" ||
		(os.Getenv("SENDGRID_API_KEY") == "" &&
			os.Getenv("RESEND_API_KEY") == "" &&
			os.Getenv("GMAIL_APP_PASSWORD") == "")
}

func GenerateOTP() (string, error) {
	const otpLength = 6
	const digits = "0123456789"

	otp := make([]byte, otpLength)
	for i := 0; i < otpLength; i++ {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(digits))))
		if err != nil {
			return "", err
		}
		otp[i] = digits[num.Int64()]
	}
	return string(otp), nil
}

func SendOTPEmail(to, otp string) error {
	// Development mode: log OTP to console instead of sending email
	if IsDevMode() {
		log.Printf("\n========================================")
		log.Printf("📧 DEVELOPMENT MODE - OTP EMAIL")
		log.Printf("========================================")
		log.Printf("To: %s", to)
		log.Printf("OTP Code: %s", otp)
		log.Printf("========================================\n")
		log.Printf("Set RESEND_API_KEY or SENDGRID_API_KEY in .env to send real emails.\n")
		return nil
	}

	// Try Gmail SMTP first (sends to any email, no domain needed)
	if os.Getenv("GMAIL_APP_PASSWORD") != "" {
		return sendEmailWithGmail(to, otp)
	}

	// Try Resend (requires domain verification for arbitrary recipients)
	if os.Getenv("RESEND_API_KEY") != "" {
		return sendEmailWithResend(to, otp)
	}

	// Fallback to SendGrid
	return sendEmailWithSendGrid(to, otp)
}

// sendEmailWithResend sends OTP using Resend API (3,000 free emails/month)
func sendEmailWithResend(to, otp string) error {
	apiKey := os.Getenv("RESEND_API_KEY")
	fromEmail := os.Getenv("RESEND_FROM_EMAIL")
	if fromEmail == "" {
		fromEmail = "onboarding@resend.dev" // Resend's default test domain
	}

	payload := map[string]interface{}{
		"from":    fromEmail,
		"to":      []string{to},
		"subject": "Your StoreHub Password Reset Code",
		"html":    fmt.Sprintf("<h2>Password Reset Code</h2><p>Your OTP code is: <strong>%s</strong></p><p>This code expires in 10 minutes.</p>", otp),
		"text":    fmt.Sprintf("Your StoreHub password reset code is: %s. This code expires in 10 minutes.", otp),
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 && resp.StatusCode != 202 {
		var errResp map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&errResp)
		return fmt.Errorf("resend API error: %v", errResp)
	}

	return nil
}

// sendEmailWithGmail sends OTP using Gmail SMTP (500 emails/day free)
func sendEmailWithGmail(to, otp string) error {
	from := os.Getenv("GMAIL_ADDRESS")
	if from == "" {
		from = "your-email@gmail.com"
	}
	password := os.Getenv("GMAIL_APP_PASSWORD")

	smtpHost := "smtp.gmail.com"
	smtpPort := "587"

	subject := "Subject: Your StoreHub Password Reset Code\n"
	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"
	body := fmt.Sprintf(`<h2>Password Reset Code</h2>
<p>Your OTP code is: <strong>%s</strong></p>
<p>This code expires in 10 minutes.</p>
<p>If you didn't request this, please ignore this email.</p>`, otp)
	message := []byte(subject + mime + body)

	auth := smtp.PlainAuth("", from, password, smtpHost)
	err := smtp.SendMail(smtpHost+":"+smtpPort, auth, from, []string{to}, message)
	if err != nil {
		return fmt.Errorf("failed to send email via Gmail: %w", err)
	}

	return nil
}

// sendEmailWithSendGrid sends OTP using SendGrid API
func sendEmailWithSendGrid(to, otp string) error {
	from := mail.NewEmail("Store Management", "bivekshrestha239@gmail.com")
	subject := "Your OTP Verification Code"
	toEmail := mail.NewEmail("", to)
	plainTextContent := fmt.Sprintf("Your OTP code is: %s", otp)
	htmlContent := fmt.Sprintf("<strong>Your OTP code is: %s</strong>", otp)
	message := mail.NewSingleEmail(from, subject, toEmail, plainTextContent, htmlContent)
	client := sendgrid.NewSendClient(os.Getenv("SENDGRID_API_KEY"))

	response, err := client.Send(message)
	if err != nil {
		log.Println(err)
		return err
	}

	// Check if the email was actually sent successfully
	if response.StatusCode != 202 {
		return fmt.Errorf("failed to send email: %s (status: %d)", response.Body, response.StatusCode)
	}

	return nil
}

//TODO: need add function to delete the table row of the verified users
//TODO: need to add a limit for user to generate too much OTPs
