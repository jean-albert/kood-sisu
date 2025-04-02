package sprint

func LongestCommonSubstr(str1, str2 string) string {
	len1 := len(str1)
	len2 := len(str2)

	// Create a 2D slice to store the lengths of common substrings
	dp := make([][]int, len1+1)
	for i := range dp {
		dp[i] = make([]int, len2+1)
	}

	// Variables to store the length and end position of the longest common substring
	maxLen := 0
	endPos := 0

	// Fill the dp table
	for i := 1; i <= len1; i++ {
		for j := 1; j <= len2; j++ {
			if str1[i-1] == str2[j-1] {
				dp[i][j] = dp[i-1][j-1] + 1

				// Update the variables if a longer common substring is found
				if dp[i][j] > maxLen {
					maxLen = dp[i][j]
					endPos = i - 1
				}
			}
		}
	}

	// Extract the longest common substring
	if maxLen == 0 {
		return ""
	}
	return str1[endPos-maxLen+1 : endPos+1]
}
