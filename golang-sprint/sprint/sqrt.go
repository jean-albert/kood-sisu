package sprint

func Sqrt(n int) int {
	i := 1
	for i*i < n {
		i++
	}

	if i*i == n {
		return i
	}
	return 0
}
