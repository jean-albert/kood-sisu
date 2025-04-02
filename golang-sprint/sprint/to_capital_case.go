package sprint

func ToCapitalCase(s string) string {
	result := ""
	capitalizeNext := true

	for _, char := range s {
		switch {
		case char >= 'a' && char <= 'z':
			if capitalizeNext {
				result += string(char - 32)
				capitalizeNext = false
			} else {
				result += string(char)
				capitalizeNext = false
			}
		case char >= '0' && char <= '9':
			result += string(char)
			capitalizeNext = false
		case char >= 'A' && char <= 'Z':
			if capitalizeNext {
				result += string(char)
				capitalizeNext = false
			} else {
				result += string(char + 32)
				capitalizeNext = false
			}
		default:
			result += string(char)
			capitalizeNext = true
		}
	}
	return result
}
