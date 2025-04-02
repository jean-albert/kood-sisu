package sprint

func FilterBySum(arr [][]int, limit int) [][]int {
	result := [][]int{}

	for _, subarray := range arr {
		sum := 0
		for _, num := range subarray {
			sum += num
		}

		if sum >= limit {
			result = append(result, append([]int{}, subarray...))
		}
	}
	return result
}
