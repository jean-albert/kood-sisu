package sprint

func AlphaNumber(n int) string {
	if n == 0 {
		return "a"
	}

	sign := ""
	if n < 0 {
		sign = "-"
		n = -n
	}
	result := ""
	for n > 0 {
		digit := n % 10
		character := 'a' + rune(digit)
		result = string(character) + result
		n /= 10
	}
	return sign + result
}
