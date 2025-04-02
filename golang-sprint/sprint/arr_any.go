package sprint

func ArrAny(f func(string) bool, a []string) bool {
	for _, str := range a {
		if f(str) {
			return true
		}
	}
	return false
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
