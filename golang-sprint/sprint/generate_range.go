package sprint

func GenerateRange(min, max int) []int {
	if min >= max {
		return nil
	}

	size := max - min

	var result []int

	for i := 0; i < size; i++ {
		result = append(result, min+i)
	}
	return result
}
