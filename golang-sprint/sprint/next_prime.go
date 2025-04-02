package sprint

func IsPrime(num int) bool {
	if num <= 1 {
		return false
	}

	for i := 2; i*i <= num; i++ {
		if num%i == 0 {
			return false
		}
	}
	return true
}

func NextPrime(n int) int {
	if n <= 1 {
		return 2
	}

	for i := n; ; i++ {
		if IsPrime(i) {
			return i
		}
	}
}
