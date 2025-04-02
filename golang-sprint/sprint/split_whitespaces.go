package sprint

func SplitWhitespaces(s string) []string {
	var words []string
	currentWord := ""
	inWord := false

	for _, char := range s {
		if char == ' ' || char == '\t' || char == '\n' {
			if inWord {
				words = append(words, trim(currentWord))
				currentWord = ""
				inWord = false
			}
		} else {
			currentWord += string(char)
			inWord = true
		}
	}

	if inWord {
		words = append(words, trim(currentWord))
	}
	return words
}

func trim(s string) string {
	for len(s) > 0 && (s[0] == ' ' || s[0] == '\t' || s[0] == '\n') {
		s = s[1:]
	}
	for len(s) > 0 && (s[len(s)-1] == ' ' || s[len(s)-1] == '\t' || s[len(s)-1] == '\n') {
		s = s[:len(s)-1]
	}
	return s
}
