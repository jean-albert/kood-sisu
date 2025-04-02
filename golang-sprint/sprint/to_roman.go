package sprint

func ToRoman(num int) string {
	if num < 1 || num > 3999 {
		return "Invalid input"
	}

	romanNumerals := []string{"M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"}
	decimalValues := []int{1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1}

	roman := ""

	for i := 0; i < len(decimalValues); i++ {
		for num >= decimalValues[i] {
			roman += romanNumerals[i]
			num -= decimalValues[i]
		}
	}

	return roman
}
