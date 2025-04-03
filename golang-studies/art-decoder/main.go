package main

import (
	"bufio"
	"errors"
	"fmt"
	"os"
	"regexp"
	"strconv"
	"strings"
)

func main() {

	// Decodes the string passed as argument if no error
	if len(os.Args) == 3 && os.Args[1] == "-d" {
		code, err := decode(os.Args[2])
		if err != nil {
			fmt.Println(err)
		} else {
			fmt.Println(code)
		}
		return
	}

	// Encodes the string passed as argument if no error
	if len(os.Args) == 3 && os.Args[1] == "-e" {
		code, err := encode(os.Args[2])
		if err != nil {
			fmt.Println(err)
		} else {
			fmt.Println(code)
		}
		return
	}

	// Decodes from file passed as argument if no error
	if len(os.Args) == 4 && os.Args[1] == "-d" && os.Args[2] == "-f" {
		code, err := readFile(os.Args[3], decode)
		if err != nil {
			fmt.Println(err)
		} else {
			fmt.Println(code)
		}
		return
	}

	// Encodes from file passed as argument if no error
	if len(os.Args) == 4 && os.Args[1] == "-e" && os.Args[2] == "-f" {
		code, err := readFile(os.Args[3], encode)
		if err != nil {
			fmt.Println(err)
		} else {
			fmt.Println(code)
		}
		return
	}
}

// Reads a file line by line and applies a given function
func readFile(filePath string, f func(s string) (string, error)) (string, error) {

	// Opens the file
	file, err := os.Open(filePath)
	if err != nil {
		return "", errors.New("File not found:" + filePath)
	}
	defer file.Close()

	// Initializing the scanner and lines slice
	scanner := bufio.NewScanner(file)
	lines := []string{}

	// Reading and processing lines
	for scanner.Scan() {
		line := scanner.Text()
		if line == "" {
			lines = append(lines, "")
			continue
		}
		code, err := f(line)
		if err != nil {
			return "", err
		}
		lines = append(lines, code)
	}
	return strings.Join(lines, "\n"), nil
}

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
