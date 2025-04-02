package sprint

func StrSplitBy(s, sep string) []string {
	if s == "" {
		return []string{}
	}

	if sep == "" {
		return []string{s}
	}

	var substrings []string
	currentSubstring := ""

	sepLen := len(sep)
	sLen := len(s)

	for i := 0; i < sLen; i++ {
		if i+sepLen <= sLen && s[i:i+sepLen] == sep {
			if currentSubstring != "" {
				substrings = append(substrings, currentSubstring)
			}
			currentSubstring = ""
			i += sepLen - 1
		} else {
			currentSubstring += string(s[i])
		}
	}

	if currentSubstring != "" {
		substrings = append(substrings, currentSubstring)
	}
	return substrings
}
