package sprint

func ArrMap(f func(int) bool, a []int) []bool {
	result := make([]bool, len(a))
	for i, val := range a {
		result[i] = f(val)
	}
	return result
}

func IsPrime(n int) bool {
	if n <= 1 {
		return false
	}

	for i := 2; i*i <= n; i++ {
		if n%i == 0 {
			return false
		}
	}
	return true
}

func IsNegative(n int) bool {
	return n < 0
}
