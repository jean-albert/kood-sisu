package sprint

func Countdown(n int) string {
	var result string

	for i := n; i > 0; i -= 2 {
		result += string('0' + byte(i))
		if i > 0 {
			result += ", "
		}
	}
	result += "0!"

	return result
}
