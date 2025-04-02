package sprint

func RemoveElementsInRange(arr []float64, from, to int) []float64 {
	// Ensure indices are within the array bounds

	if to > len(arr) {
		to = len(arr)
	}
	if from > len(arr) {
		from = len(arr)

	}
	if from < 0 {
		from = 0
	}
	if to < 0 {
		to = 0
	}

	// Swap indices if they are in the wrong order
	if from > to {
		from, to = to, from
	}

	arr = append(arr[:from], arr[to:]...)
	return arr
}
