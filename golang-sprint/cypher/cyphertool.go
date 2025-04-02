package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

// Main, envoking other functions and giving result
func main() {
	fmt.Println("Welcome to the Cypher Tool!")

	toEncrypt, encoding, message := getInput()

	var result string
	switch encoding {
	case "1":
		if toEncrypt {
			result = encrypt_rot13(message)
		} else {
			result = decrypt_rot13(message)
		}
	case "2":
		if toEncrypt {
			result = encrypt_reverse(message)
		} else {
			result = decrypt_reverse(message)
		}
	case "3":
		if toEncrypt {
			result = encrypt_rot5(message)
		} else {
			result = decrypt_rot5(message)
		}
	default:
		fmt.Println("Invalid cypher selection.")
	}
	fmt.Printf("%s message using %s:\n%s\n", getEncryptDecrypt(toEncrypt), getEncodingName(encoding), result)
}

// Get the input data required for the operation
func getInput() (toEncrypt bool, encoding string, message string) {
	scanner := bufio.NewScanner(os.Stdin)

	// Select encryption or decryption
	for {
		fmt.Println("Select operation (1/2):")
		fmt.Println("1. Encrypt.")
		fmt.Println("2. Decrypt.")
		scanner.Scan()
		operation := strings.TrimSpace(scanner.Text())

		if operation == "1" || operation == "2" {
			toEncrypt = operation == "1"
			break
		} else {
			fmt.Println("Invalid input.Please enter 1 or 2:")
		}
	}

	// Selection encryption/decryption method
	for {
		fmt.Println("Select cypher (1/2/3):")
		fmt.Println("1. ROT13.")
		fmt.Println("2. Reverse.")
		fmt.Println("3. ROT5.")
		scanner.Scan()
		encoding = strings.TrimSpace(scanner.Text())

		if encoding == "1" || encoding == "2" || encoding == "3" {
			break
		} else {
			fmt.Println("Invalid input. Please enter 1, 2 or 3:")
		}
	}

	// Entering of the message
	for {
		fmt.Println("Entre the message:")
		scanner.Scan()
		message = strings.TrimSpace(scanner.Text())

		if len(message) > 0 {
			break
		} else {
			fmt.Println("Invalid mesage. Please enter a non-empty message.")
		}
	}

	return toEncrypt, encoding, message
}

// Encrypt the message with rot13
func encrypt_rot13(s string) string {
	result := ""
	for _, char := range s {
		if char >= 'a' && char <= 'z' {
			result += string((char-'a'+13)%26 + 'a')
		} else if char >= 'A' && char <= 'Z' {
			result += string((char-'A'+13)%26 + 'A')
		} else {
			result += string(char)
		}
	}
	return result
}

// Encrypt the message with reverse
func encrypt_reverse(s string) string {
	result := ""
	for _, char := range s {
		if char >= 'a' && char <= 'z' {
			result += string('z' - (char - 'a'))
		} else if char >= 'A' && char <= 'Z' {
			result += string('Z' - (char - 'A'))
		} else {
			result += string(char)
		}
	}
	return result
}

// Encrypt the message with rot5
func encrypt_rot5(s string) string {
	result := ""
	for _, char := range s {
		if char >= 'a' && char <= 'z' {
			result += string((char-'a'+5)%26 + 'a')
		} else if char >= 'A' && char <= 'Z' {
			result += string((char-'A'+5)%26 + 'A')
		} else {
			result += string(char)
		}
	}
	return result
}

// Decrypt the message with rot13
func decrypt_rot13(s string) string {
	return encrypt_rot13(s)
}

// Decrypt the message with reverse
func decrypt_reverse(s string) string {
	return encrypt_reverse(s)
}

// Decrypt the message with rot5
func decrypt_rot5(s string) string {
	result := ""
	for _, char := range s {
		if char >= 'a' && char <= 'z' {
			result += string((char-'a'+21)%26 + 'a')
		} else if char >= 'A' && char <= 'Z' {
			result += string((char-'A'+21)%26 + 'A')
		} else {
			result += string(char)
		}
	}
	return result
}

// Name of encoding method used
func getEncodingName(encoding string) string {
	switch encoding {
	case "1":
		return "ROT13"
	case "2":
		return "Reverse"
	case "3":
		return "ROT5"
	default:
		return "Unknown"
	}
}

// Encryption or decryption
func getEncryptDecrypt(toEncrypt bool) string {
	if toEncrypt == true {
		return "Encrypted"
	} else {
		return "Decrypted"
	}
}
