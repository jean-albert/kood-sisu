package sprint

func FindDividend(from, to, divisor int) int {
	for i := from; i < to; i++ {
		if i%divisor == 0 {
			return i
		}
	}
	return -1
}
