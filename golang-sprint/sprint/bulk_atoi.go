package sprint

func StrToInt(s string) int {
	result, sign := 0, 1

	for i, char := range s {
		switch {
		case i == 0 && char == '-':
			sign = -1
		case i == 0 && char == '+':
		case char >= '0' && char <= '9':
			result = result*10 + int(char-'0')
		default:
			return 0
		}
	}
	return result * sign
}

func BulkAtoi(arr []string) []int {
	result := make([]int, len(arr))
	for i, str := range arr {
		result[i] = StrToInt(str)
	}
	return result
}
