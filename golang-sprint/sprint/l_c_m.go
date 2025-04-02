package sprint

func GCD(a, b int) int {
	for b != 0 {
		a, b = b, a%b
	}
	return a
}

func LCM(a, b int) int {
	gcd := GCD(a, b)
	lcm := (a * b) / gcd
	return lcm
}
