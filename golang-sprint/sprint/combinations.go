package sprint

import "fmt"

func Combinations() string {
	var result string

	for i := 0; i <= 7; i++ {
		for j := i + 1; j <= 8; j++ {
			for k := j + 1; k <= 9; k++ {
				result += fmt.Sprintf("%d%d%d, ", i, j, k)
			}
		}
	}
	result = result[:len(result)-2]

	return result
}
