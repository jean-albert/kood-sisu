package sprint

func StrLength(s string) []int {
	runeCount := 0
	byteLength := 0

	for _, char := range s {
		runeCount++
		byteLength += len(string(char))
	}
	return []int{runeCount, byteLength}
}
