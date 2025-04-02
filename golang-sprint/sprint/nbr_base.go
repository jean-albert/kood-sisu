package sprint

func isValidBase(base string) bool {
	if len(base) < 2 {
		return false
	}

	for i := 0; i < len(base); i++ {
		char := base[i]
		if char == '+' || char == '-' {
			return false
		}
		for j := i + 1; j < len(base); j++ {
			if char == base[j] {
				return false
			}
		}
	}
	return true
}

func NbrBase(n int, base string) string {
	if !isValidBase(base) {
		return "NV"
	}

	isNegative := false
	if n < 0 {
		isNegative = true
		n = -n
	}

	if n == 0 {
		return string(base[0])
	}

	result := ""
	for n > 0 {
		remainder := n % len(base)
		result = string(base[remainder]) + result
		n = n / len(base)
	}

	if isNegative {
		result = "-" + result
	}

	return result
}
