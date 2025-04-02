package sprint

func DigitalRoot(n int) int {
	// Base case: If the number is already a single-digit, return it
	if n < 10 {
		return n
	}

	// Calculate the sum of digits
	sum := 0
	for n > 0 {
		sum += n % 10
		n /= 10
	}

	// Recursively call DigitalRoot on the sum
	return DigitalRoot(sum)
}
