package sprint

func ReverseAlphabet(step int) string {
	if step <= 0 {
		step = 1
	}

	alphabet := "abcdefghijklmnopqrstuvwxyz"
	result := ""

	for i := 25; i >= 0; i -= step {
		result += string(alphabet[i])
	}
	return result
}
