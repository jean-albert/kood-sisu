package sprint

func Overlap(arr1, arr2 []int) []int {
	countMap := make(map[int]int)
	for _, num := range arr1 {
		countMap[num]++
	}

	var commonElements []int
	for _, num := range arr2 {
		if countMap[num] > 0 {
			commonElements = append(commonElements, num)
			countMap[num]--
		}
	}

	if len(commonElements) == 0 {
		return []int{}
	}

	for i := 0; i < len(commonElements); i++ {
		for j := i + 1; j < len(commonElements); j++ {
			if commonElements[i] > commonElements[j] {
				commonElements[i], commonElements[j] = commonElements[j], commonElements[i]
			}
		}
	}

	return commonElements
}
