package sprint

func ToUpperCase(s string) string {
	result := ""
	for _, char := range s {
		if char >= 'a' && char <= 'z' {
			result += string(char - 32)
		} else {
			result += string(char)
		}
	}
	return result
}
