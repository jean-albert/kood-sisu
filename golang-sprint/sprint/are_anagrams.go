package sprint

import (
	"sort"
	"strings"
)

func AreAnagrams(str1, str2 string) bool {
	str1 = strings.ReplaceAll(str1, " ", "")
	str2 = strings.ReplaceAll(str2, " ", "")
	str1 = strings.ToLower(str1)
	str2 = strings.ToLower(str2)

	runes1 := []rune(str1)
	runes2 := []rune(str2)

	sort.Slice(runes1, func(i, j int) bool {
		return runes1[i] < runes1[j]
	})

	sort.Slice(runes2, func(i, j int) bool {
		return runes2[i] < runes2[j]
	})

	return string(runes1) == string(runes2)
}
