package utils

import (
	"crypto/rand"
	"fmt"
	"log"
	"math/big"
	"os"

	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
)

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
	from := mail.NewEmail("Store Management", "bivekshrestha239@gmail.com")
	subject := "Your OTP Verification Code"
	toEmail := mail.NewEmail("", to)
	plainTextContent := fmt.Sprintf("Your OTP code is: %s", otp)
	htmlContent := fmt.Sprintf("<strong>Your OTP code is: %s</strong>", otp)
	message := mail.NewSingleEmail(from, subject, toEmail, plainTextContent, htmlContent)
	client := sendgrid.NewSendClient(os.Getenv("SENDGRID_API_KEY"))
	// client.Request, _ = sendgrid.SetDataResidency(client.Request, "eu")
	// uncomment the above line if you are sending mail using a regional EU subuser
	response, err := client.Send(message)
	if err != nil {
		log.Println(err)
		return err
	}
	fmt.Println(response.StatusCode)
	fmt.Println(response.Body)
	fmt.Println(response.Headers)
	return nil
}
