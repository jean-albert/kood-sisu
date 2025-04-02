package sprint

func CombN(n int) []string {
	var result []string
	cap := factorial(n)
	result = make([]string, 0, cap)
	generateCombinations(n, 0, "", &result)
	return result
}

func generateCombinations(n, start int, current string, result *[]string) {
	if n == 0 {
		*result = append(*result, current)
		return
	}

	for i := start; i <= 9; i++ {
		newCombination := current + string('0'+i)
		generateCombinations(n-1, i+1, newCombination, result)
	}
}

func factorial(n int) int {
	fact := 1
	for i := 2; i <= n; i++ {
		fact *= i
	}
	return fact
}
