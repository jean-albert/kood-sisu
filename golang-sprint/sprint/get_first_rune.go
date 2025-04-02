package sprint

func GetFirstRune(s string) rune {
	if len(s) > 0 {
		return []rune(s)[0]
	}
	return 0
}
