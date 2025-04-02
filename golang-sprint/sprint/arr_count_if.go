package sprint

func ArrCountIf(f func(string) bool, tab []string) int {
	count := 0
	for _, value := range tab {
		if f(value) {
			count++
		}
	}
	return count
}

func IsUpper(s string) bool {
	for _, char := range s {
		if !(char >= 'A' && char <= 'Z') {
			return false
		}
	}
	return true
}

func IsAlphanumeric(s string) bool {
	for _, char := range s {
		if !((char >= '0' && char <= '9') || (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z')) {
			return false
		}
	}
	return true
}

func IsLower(s string) bool {
	for _, char := range s {
		if !(char >= 'a' && char <= 'z') {
			return false
		}
	}
	return true
}

func IsNumeric(s string) bool {
	for _, char := range s {
		if !(char >= '0' && char <= '9') {
			return false
		}
	}
	return true
}
