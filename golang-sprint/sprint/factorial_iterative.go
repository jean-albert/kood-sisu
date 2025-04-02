package sprint

func FactorialIterative(n int) int {
	if n < 0 {
		return 0
	}

	if n > 12 {
		return 0
	}

	result := 1
	for i := 1; i <= n; i++ {
		result *= i
	}
	return result
}
