package sprint

func BalanceOut(arr []bool) []bool {
	trueCount, falseCount := countBooleans(arr)

	if trueCount == falseCount {
		return arr
	}

	diff := abs(trueCount - falseCount)
	for i := 0; i < diff; i++ {
		if trueCount < falseCount {
			arr = append(arr, true)
			trueCount++
		} else {
			arr = append(arr, false)
			falseCount++
		}
	}
	return arr
}

func countBooleans(arr []bool) (trueCount, falseCount int) {
	for _, value := range arr {
		if value {
			trueCount++
		} else {
			falseCount++
		}
	}
	return
}

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}
