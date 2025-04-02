package sprint

func ConvertAnyToAny(nbr, baseFrom, baseTo string) string {
	decValue := convertToDec(nbr, baseFrom)
	return convertDecToAny(decValue, baseTo)
}

func convertToDec(nbr, baseFrom string) int {
	if len(baseFrom) < 2 || containsSigns(baseFrom) {
		return 0
	}

	result := 0
	baseMap := make(map[byte]int)
	for i := 0; i < len(baseFrom); i++ {
		baseMap[baseFrom[i]] = i
	}

	baseLen := len(baseFrom)
	nbrLen := len(nbr)

	for i := nbrLen - 1; i >= 0; i-- {
		digit := nbr[i]
		if val, ok := baseMap[digit]; ok {
			result += val * pow(baseLen, nbrLen-i-1)
		} else {
			return 0
		}
	}
	return result
}

func convertDecToAny(decValue int, baseTo string) string {
	if len(baseTo) < 2 || containsSigns(baseTo) {
		return "NV"
	}
	result := ""
	baseLen := len(baseTo)

	for decValue > 0 {
		digit := decValue % baseLen
		result = string(baseTo[digit]) + result
		decValue /= baseLen
	}
	return result
}

func containsSigns(base string) bool {
	return base == "+" || base == "-"
}

func pow(base, exp int) int {
	result := 1
	for i := 0; i < exp; i++ {
		result *= base
	}
	return result
}
