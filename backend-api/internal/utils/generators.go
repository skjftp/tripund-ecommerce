package utils

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"math/rand"
	"time"
)

func GenerateID() string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

func GenerateOrderNumber() string {
	return fmt.Sprintf("%06d", time.Now().UnixNano()%1000000)
}

func FormatCurrency(amount float64) string {
	return fmt.Sprintf("%.2f", amount)
}

func GenerateID(prefix string) string {
	bytes := make([]byte, 8)
	rand.Read(bytes)
	return fmt.Sprintf("%s_%s", prefix, hex.EncodeToString(bytes))
}

func GenerateOTP(length int) string {
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	otp := ""
	for i := 0; i < length; i++ {
		otp += fmt.Sprintf("%d", rng.Intn(10))
	}
	return otp
}