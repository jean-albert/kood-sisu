package sprint

func BalancedParentheses(input string) bool {
	stack := make([]rune, 0)

	// Define a map for matching parentheses
	parenthesesMap := map[rune]rune{
		')': '(',
		'}': '{',
		']': '[',
	}

	for _, char := range input {
		switch char {
		case '(', '[', '{':
			// Opening parentheses, push onto the stack
			stack = append(stack, char)
		case ')', ']', '}':
			// Closing parentheses, check if it matches the last opening parenthesis
			if len(stack) == 0 || stack[len(stack)-1] != parenthesesMap[char] {
				return false
			}
			// Pop the last opening parenthesis from the stack
			stack = stack[:len(stack)-1]
		}
	}

	// The parentheses are balanced if the stack is empty at the end
	return len(stack) == 0
}
