package sprint

func LongestClimb(arr []int) []int {
	if len(arr) == 0 {
		return nil
	}

	start, end := 0, 0
	currentStart, currentEnd := 0, 0

	for i := 1; i < len(arr); i++ {
		if arr[i] > arr[i-1] {
			currentEnd = i
		} else {
			currentStart = i
		}

		if currentEnd-currentStart > end-start {
			start, end = currentStart, currentEnd
		}
	}

	return arr[start : end+1]
}
