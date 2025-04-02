package sprint

func AlphabetMastery(n int) string {
	if n <= 0 {
		return ""
	}
	alphabet := "abcdefghijklmnopqrstuvwxyz"
	return alphabet[:n]
}
