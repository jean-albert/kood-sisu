package sprint

func ShiftBy(r rune, step int) rune {
	Position := int(r-'a'+rune(step)) % 26

	if Position < 0 {
		Position += 26
	}

	result := rune('a' + Position)
	return result
}
