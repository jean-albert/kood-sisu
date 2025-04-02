package sprint

func FactorialRecursive(n int) int {
	if n < 0 {
		return 0
	}

	if n == 0 {
		return 1
	}

	result := n * FactorialRecursive(n-1)

	if result < 0 {
		return 0
	}

	return result
}
