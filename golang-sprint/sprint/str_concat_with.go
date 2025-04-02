package sprint

func StrConcatWith(strs []string, sep string) string {
	result := ""

	for i, str := range strs {
		result += str
		if i < len(strs)-1 {
			result += sep
		}
	}
	return result
}
