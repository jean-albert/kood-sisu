package itinerary

import (
	"fmt"
	lookup "itinerary/lookup"
	"os"
	"regexp"
	"strconv"
	"strings"
)

// Function to process date and time fields
func ProcessDateTimeField(field string) (string, bool) {
	// Define regular expressions for date and time patterns
	datePattern := `D\((\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})([+\-−]\d{2}:\d{2}|Z)\)`
	time12Pattern := `T12\((\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})([+\-−]\d{2}:\d{2}|Z)\)`
	time24Pattern := `T24\((\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})([+\-−]\d{2}:\d{2}|Z)\)`

	// Match input against regex
	dateMatch := regexp.MustCompile(datePattern).FindStringSubmatch(field)
	time12Match := regexp.MustCompile(time12Pattern).FindStringSubmatch(field)
	time24Match := regexp.MustCompile(time24Pattern).FindStringSubmatch(field)

	// Validate date
	isValidDate := func(year, month, day int) bool {
		if year < 0 || month < 1 || month > 12 || day < 1 || day > 31 {
			return false
		}
		// Additional checks for months and leap years can be added if necessary
		return true
	}

	// Validate time
	isValidTime := func(hour, minute int) bool {
		if hour < 0 || hour >= 24 || minute < 0 || minute >= 60 {
			return false
		}
		return true
	}

	// Switch for different time input formats
	switch {
	case len(dateMatch) > 0:
		// Process date match
		year, _ := strconv.Atoi(dateMatch[1])
		month, _ := strconv.Atoi(dateMatch[2])
		day, _ := strconv.Atoi(dateMatch[3])
		hour, _ := strconv.Atoi(dateMatch[4])
		minute, _ := strconv.Atoi(dateMatch[5])
		if isValidDate(year, month, day) && isValidTime(hour, minute) {
			return fmt.Sprintf("%02d %s %d", day, convertMonth(month), year), true
		}
	case len(time12Match) > 0:
		// Process 12-hour time match
		year, _ := strconv.Atoi(time12Match[1])
		month, _ := strconv.Atoi(time12Match[2])
		day, _ := strconv.Atoi(time12Match[3])
		hour, _ := strconv.Atoi(time12Match[4])
		minute, _ := strconv.Atoi(time12Match[5])
		if isValidDate(year, month, day) && isValidTime(hour, minute) {
			offset := time12Match[6]
			return fmt.Sprintf("%02d:%02d%s (%s)", convertHour(hour), minute, convertAMPM(hour), replaceZWithOffset(offset)), true
		}
	case len(time24Match) > 0:
		// Process 24-hour time match
		year, _ := strconv.Atoi(time24Match[1])
		month, _ := strconv.Atoi(time24Match[2])
		day, _ := strconv.Atoi(time24Match[3])
		hour, _ := strconv.Atoi(time24Match[4])
		minute, _ := strconv.Atoi(time24Match[5])
		if isValidDate(year, month, day) && isValidTime(hour, minute) {
			offset := time24Match[6]
			return fmt.Sprintf("%02d:%02d (%s)", hour, minute, replaceZWithOffset(offset)), true
		}
	}
	return field, false
}

// Function to replace Z with (+00:00)
func replaceZWithOffset(offset string) string {
	if offset == "Z" {
		return "+00:00"
	}
	return offset
}

// Function to convert month number to abbreviated month name
func convertMonth(month int) string {
	months := [...]string{"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"}
	return months[month-1]
}

// Function to convert hour from 24-hour format to 12-hour format
func convertHour(hour int) int {
	if hour > 12 {
		return hour - 12
	}
	return hour
}

// Function to determine AM or PM based on hour
func convertAMPM(hour int) string {
	if hour >= 12 {
		return "PM"
	}
	return "AM"
}

// Function to prettify the input
func Prettifier(input, output, lookupPath string, stdOut int) {
	inputData, err := os.ReadFile(input)
	if err != nil {
		fmt.Println("Error reading input file:", err)
		return
	}

	// Load airport lookup data and validate it
	airports, err := lookup.LoadAirportLookup(lookupPath)
	if err != nil {
		fmt.Println("Error loading airport lookup:", err)
		return
	}
	if len(airports) == 0 {
		fmt.Println("Error: Airport lookup data is missing or incorrect")
		return
	}

	lines := strings.Split(string(inputData), "\n")

	var outputData strings.Builder // Using strings.Builder for efficient string concatenation
	emptyLine := 0

	var coloredOutputData strings.Builder

	//Bool Color
	var color bool
	if stdOut > 1 {
		color = true
	}

	for _, line := range lines {
		correctedLine, correctedColorLine := Prettify(line, lookupPath, color)
		if len(line) == 0 {
			emptyLine++
			if emptyLine >= 2 {
				continue
			}
		} else {
			emptyLine = 0
		}
		// Process special characters
		correctedLine = strings.ReplaceAll(correctedLine, "\v", "\n")
		correctedLine = strings.ReplaceAll(correctedLine, "\f", "\n")
		correctedLine = strings.ReplaceAll(correctedLine, "\r", "\n")
		correctedColorLine = strings.ReplaceAll(correctedColorLine, "\v", "\n")
		correctedColorLine = strings.ReplaceAll(correctedColorLine, "\f", "\n")
		correctedColorLine = strings.ReplaceAll(correctedColorLine, "\r", "\n")

		outputData.WriteString(StripANSIEscapeCodes(correctedLine) + "\n")
		coloredOutputData.WriteString(correctedColorLine + "\n")
	}

	//Print to stdout
	if stdOut > 0 {
		fmt.Println(coloredOutputData.String())
	}
	//Write output data to txt
	err = os.WriteFile(output, []byte(outputData.String()), 0644)
	if err != nil {
		fmt.Println("Error writing to output file:", err)
		return
	}

}

// Scrubber
func StripANSIEscapeCodes(input string) string {
	// Regular expression to match ANSI escape codes
	ansiEscapeRegex := regexp.MustCompile(`\x1b\[[0-9;]+m`)
	// Replace escape codes with empty string
	cleaned := ansiEscapeRegex.ReplaceAllString(input, "")
	return cleaned
}

// Const for colors

const (
	ColorReset  = "\033[0m"
	ColorBold   = "\033[1m"
	ColorYellow = "\033[33m"
	ColorRed    = "\033[31m"
	ColorCyan   = "\033[36m"
	ColorItalic = "\033[3m"
)

func Prettify(line, lookupPath string, applyColor bool) (string, string) {
	airports, err := lookup.LoadAirportLookup(lookupPath)
	if err != nil {
		fmt.Println("Error loading airport lookup:", err)
		return "", ""
	}

	// Split the line by spaces
	words := strings.Split(line, " ")
	//Deep copy for color application
	coloredWords := make([]string, len(words))
	copy(coloredWords, words)

	// Regex for matches
	reg := regexp.MustCompile(`(?:(\*##[A-Z]{4})|(\*#[A-Z]{3})|##([A-Z]{4})|#([A-Z]{3}))(?:\s+\(\w+\))?`)

	// Iterate through each word
	for i, word := range words {
		// Check if the word matches the date/time pattern
		if strings.Contains(word, "D(") || strings.Contains(word, "T12(") || strings.Contains(word, "T24(") {
			// Process the date/time part
			convertedDateTime, processed := ProcessDateTimeField(word)
			if processed {
				// Replace the original word with the converted date/time
				containerBefore := ""
				if strings.Contains(word, "D(") {
					containerBefore = strings.Split(word, "D")[0]
				} else {
					containerBefore = strings.Split(word, "T")[0]
				}
				containerAfterSplit := strings.Split(word, ")")
				var containerAfter string //strings.Split(word, ")")//[1]
				if len(containerAfterSplit) > 1 {
					containerAfter = containerAfterSplit[1]
				}

				words[i] = containerBefore + convertedDateTime + containerAfter

				coloredWords[i] = containerBefore + convertedDateTime + containerAfter
				if applyColor {
					coloredWords[i] = containerBefore + ColorBold + ColorRed + convertedDateTime + ColorReset + containerAfter
				}
			}
		}

		// Check if the word matches airport code pattern
		matches := reg.FindStringSubmatch(word)
		find := reg.FindString(word)

		if len(matches) > 0 {

			// Extract airport code
			code := ""
			for j := 1; j < len(matches); j++ {
				if matches[j] != "" {
					code = matches[j]
					break
				}
			}
			// Find airport name from lookup table
			airportName := lookup.FindAirportName(code, airports)
			if airportName != "" {
				if applyColor {
					// Replace the original word with the airport name
					coloredWords[i] = strings.Replace(word, find, ColorItalic+ColorBold+ColorCyan+airportName+ColorReset, 1)
					words[i] = strings.Replace(word, find, airportName, 1)
				} else {
					words[i] = strings.Replace(word, find, airportName, 1)
					coloredWords[i] = strings.Replace(word, find, airportName, 1)

				}
			}
		}
	}

	// Join the words back into a single line
	return strings.Join(words, " "), strings.Join(coloredWords, " ")
}
