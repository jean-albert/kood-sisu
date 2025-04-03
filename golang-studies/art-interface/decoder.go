package main

import (
	"errors"
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

// Decodes a string according to a specific format involving patterns and repetitions
func decode(line string) (string, error) {

	// Empty input check
	if line == "" {
		return "", errors.New("Error")
	}

	// Initialization of variables
	i, matchingBrace, block, repeted, outputStr := 0, rune('['), "", false, ""

	// Main loop: adds caracters to 'block' until encounters brace
	for i < len(line) {
		for i < len(line) && rune(line[i]) != '[' && rune(line[i]) != ']' {
			block += string(line[i])
			i++
		}

		// Unmatched brace check
		if i == len(line)-1 && line[i] == '[' {
			return "", errors.New("Error")
		}

		// Matching brace check
		if i == len(line) && repeted || i < len(line) && rune(line[i]) != matchingBrace {
			return "", errors.New("Error")
		}

		// Handling repetitions
		if repeted {
			pattern := regexp.MustCompile(`^(\d+) (.+)$`).FindStringSubmatch(block)
			if len(pattern) > 0 {
				amount, _ := strconv.Atoi(pattern[1])
				repetedStr := pattern[2]
				for k := 0; k < amount; k++ {
					outputStr += repetedStr
				}
			} else {
				return "", errors.New("Error")
			}
		} else {
			outputStr += block
		}

		// Switching brace and repetition state
		if matchingBrace == '[' {
			matchingBrace = ']'
		} else {
			matchingBrace = '['
		}
		repeted, i, block = !repeted, i+1, ""
	}
	return outputStr, nil
}

// Encodes a string by finding repeating patterns and formatting them
func encode(line string) (string, error) {

	// Empty input check
	if line == "" {
		return "", nil
	}

	// Initialization of variable
	var code []string

	// Main loop: iterates over the input string
	for i := 0; i < len(line); {
		pattern, start := "", i

		// Builds the smallest repeating pattern
		for pattern == "" || start+len(pattern) < len(line) && pattern != line[start:start+len(pattern)] {
			pattern += string(line[start])
			start++
		}

		// Finding repetitions
		regexStr := fmt.Sprintf(`^(%s)+`, escapeSpecialChars(pattern))
		repetitions := regexp.MustCompile(regexStr).FindString(line[i:])
		count := len(repetitions) / len(pattern)

		// Single character handling
		if count == 1 {
			pattern = string(pattern[0])
			code = append(code, pattern)

			// Repeated pattern handling
		} else {
			code = append(code, fmt.Sprintf("[%d %s]", count, pattern))
		}

		// Index update
		i += len(pattern) * count
	}
	return strings.Join(code, ""), nil
}

// Escapes special characters in a string for use in regular expressions
func escapeSpecialChars(str string) string {
	str = strings.Replace(str, `\`, `\\`, -1)
	str = strings.Replace(str, `.`, `\.`, -1)
	str = strings.Replace(str, `*`, `\*`, -1)
	str = strings.Replace(str, `?`, `\?`, -1)
	str = strings.Replace(str, `+`, `\+`, -1)
	str = strings.Replace(str, `^`, `\^`, -1)
	str = strings.Replace(str, `$`, `\$`, -1)
	str = strings.Replace(str, `(`, `\(`, -1)
	str = strings.Replace(str, `)`, `\)`, -1)
	str = strings.Replace(str, `[`, `\[`, -1)
	str = strings.Replace(str, `]`, `\]`, -1)
	str = strings.Replace(str, `{`, `\{`, -1)
	str = strings.Replace(str, `}`, `\}`, -1)
	str = strings.Replace(str, `|`, `\|`, -1)
	return str
}
