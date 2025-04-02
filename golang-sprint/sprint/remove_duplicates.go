package sprint

func RemoveDuplicates(arr []int) []int {
	seen := make(map[int]bool)
	result := []int{}

	for _, num := range arr {
		if !seen[num] {
			result = append(result, num)
			seen[num] = true
		}
	}
	return result
}
