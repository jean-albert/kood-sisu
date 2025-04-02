package sprint

import (
	"math"
	"strings"
)

func ConvertAnyToDec(s string, base string) int {
	if len(base) < 2 || strings.ContainsAny(base, "+-") {
		return 0
	}

	baseMap := make(map[byte]int)
	for i := 0; i < len(base); i++ {
		baseMap[base[i]] = i
	}

	result := 0
	for i := len(s) - 1; i >= 0; i-- {
		digit := baseMap[s[i]]
		if digit >= len(base) {
			return 0
		}
		result += digit * int(math.Pow(float64(len(base)), float64(len(s)-1-i)))
	}

	return result
}
