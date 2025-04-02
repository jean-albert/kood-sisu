package sprint

func Payout(amount int, denominations []int) []int {
	result := []int{}

	// Custom sorting mechanism - loop through the denominations and arrange them in descending order
	for i := 0; i < len(denominations)-1; i++ {
		for j := i + 1; j < len(denominations); j++ {
			if denominations[i] < denominations[j] {
				// Swap values to arrange in descending order
				denominations[i], denominations[j] = denominations[j], denominations[i]
			}
		}
	}

	// Greedy algorithm to find denominations
	for _, denom := range denominations {
		for amount >= denom {
			// Use as many denominations as possible
			result = append(result, denom)
			amount -= denom
		}
	}

	// If the amount is fully paid, return the result; otherwise, return an empty array
	if amount == 0 {
		return result
	} else {
		return []int{}
	}
}
