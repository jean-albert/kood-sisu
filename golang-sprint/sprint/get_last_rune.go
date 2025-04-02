package sprint

func GetLastRune(s string) rune {
	if len(s) > 0 {
		return []rune(s[len(s)-1:])[0]
	}
	return 0
}
