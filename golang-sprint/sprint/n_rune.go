package sprint

func NRune(s string, i int) rune {
	if len(s) > i && i >= 0 {
		return []rune(s)[i]
	}
	return 0
}
