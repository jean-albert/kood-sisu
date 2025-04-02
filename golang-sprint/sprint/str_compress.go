package sprint

import "fmt"

func StrCompress(input string) string {
	if len(input) <= 1 {
		return input
	}

	compressed := ""
	count := 1

	for i := 1; i < len(input); i++ {
		if input[i] == input[i-1] {
			count++
		} else {
			compressed += encode(count, input[i-1])
			count = 1
		}
	}

	compressed += encode(count, input[len(input)-1])

	return compressed
}

func encode(count int, char byte) string {
	if count > 1 {
		return fmt.Sprintf("%d%s", count, string(char))
	}
	return string(char)
}
