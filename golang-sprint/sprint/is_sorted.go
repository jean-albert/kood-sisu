package sprint

func IsSorted(f func(a, b string) int, arr []string) bool {
	n := len(arr)

	if n == 0 {
		return true
	}

	ascending := true
	if f(arr[0], arr[1]) > 0 {
		ascending = false
	}
	for i := 1; i < n; i++ {
		cmpResult := f(arr[i-1], arr[i])
		if (ascending && cmpResult > 0) || (!ascending && cmpResult < 0) {
			return false
		}
	}
	return true
}

func StrCompare(a, b string) int {
	if a > b {
		return 1
	} else if a < b {
		return -1
	} else {
		return 0
	}
}
