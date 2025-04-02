package sprint

import "math"

func Casting(n float64) int {
	result := int(math.Round(n))
	return result
}
