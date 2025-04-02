package sprint

func ReverseAlphabetValue(ch rune) rune {
	result := 'a' + ('z' - ch)
	return result
}
