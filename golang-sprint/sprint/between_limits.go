package sprint

func BetweenLimits(from, to rune) string {
	if from > to {
		from, to = to, from
	}
	var result string
	for r := from + 1; r < to; r++ {
		result += string(r)
	}
	return result
}
