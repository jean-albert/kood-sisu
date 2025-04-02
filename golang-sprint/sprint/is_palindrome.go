package sprint

func IsPalindrome(s string) bool {
	s = normalizeString(s)

	for i, j := 0, len(s)-1; i < j; i, j = i+1, j-1 {
		if s[i] != s[j] {
			return false
		}
	}
	return true
}

func normalizeString(s string) string {
	result := ""
	for _, char := range s {
		if (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') && char != ' ' {
			result += string(char)
		}
	}
	return result
}
