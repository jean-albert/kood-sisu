package notes

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

const NotesDir = "notes_collection"

// Initialize the filename constant
var NotesFile = ""

// Initialization logic
func InitializeDatabase(dbPath string) {
	// Create the notes directory if it doesn't exist
	notesPath := filepath.Join(dbPath, NotesDir)
	if _, err := os.Stat(notesPath); os.IsNotExist(err) {
		os.Mkdir(notesPath, os.ModePerm)
	}

	for {
		// Get user input for the notes file name
		var notesFileName string
		fmt.Print("Enter the name for the notes file (or type 'help'): ")
		fmt.Scanln(&notesFileName)

		if notesFileName == "" || notesFileName == "help" {
			fmt.Println("Please input the name of a new collection, or an existing collection's name.")
		} else {
			// Set the global NotesFile variable
			NotesFile = notesFileName

			// Create or open the notes file
			filePath := filepath.Join(notesPath, NotesFile+".txt")
			if _, err := os.Stat(filePath); os.IsNotExist(err) {
				file, err := os.Create(filePath)
				if err != nil {
					fmt.Println("Error creating the notes file:", err)
					return
				}
				file.Close()
			}
			break // Break out of the loop if valid input is provided
		}
	}
}

// Displaying notes to the user
func DisplayNotes(dbPath string) ([]string, error) {
	filePath := filepath.Join(dbPath)

	// Check if the notes file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return nil, fmt.Errorf("The notes file does not exist")
	}

	// Open the notes file
	file, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("Error opening the notes file: %v", err)
	}
	defer file.Close()

	// Read and display each line along with line numbers
	fmt.Println("\nNotes:")
	scanner := bufio.NewScanner(file)
	lineNumber := 1
	var notes []string
	for scanner.Scan() {
		// Format the line number with leading zeros
		lineNumberFormatted := fmt.Sprintf("%03d", lineNumber)
		fmt.Printf("%s - %s\n", lineNumberFormatted, scanner.Text())
		notes = append(notes, scanner.Text())
		lineNumber++
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("Error reading the notes file: %v", err)
	}

	return notes, nil
}

// Adding a note to the database
func AddNotes(dbPath string) {
	filePath := filepath.Join(dbPath)
	// Open the notes file in append mode
	file, err := os.OpenFile(filePath, os.O_APPEND|os.O_WRONLY, os.ModeAppend)
	if err != nil {
		fmt.Println("Error opening the notes file:", err)
		return
	}
	defer file.Close()

	// Get user input for the new note
	fmt.Print("Enter the note text: ")
	scanner := bufio.NewScanner(os.Stdin)
	scanner.Scan()
	newNote := scanner.Text()

	// Write the new note to the file
	_, err = file.WriteString(newNote + "\n")
	if err != nil {
		fmt.Println("Error writing to the notes file:", err)
	}
}

// Removing a note from the database
func RemoveNotes(dbPath string) {
	notes, err := DisplayNotes(dbPath)
	if err != nil {
		fmt.Println(err)
		return
	}

	// Ask the user for the number of the note to be removed
	fmt.Print("\nEnter the number of the note to remove (or 0 to cancel): ")
	var listNumber int
	_, err = fmt.Scan(&listNumber)
	if err != nil {
		fmt.Println("Error reading input:", err)
		return
	}

	// Check if the user wants to cancel
	if listNumber == 0 {
		fmt.Println("Operation canceled.")
		return
	}

	// Check if the provided number is valid
	if listNumber < 1 || listNumber > len(notes) {
		fmt.Println("Invalid note number.")
		return
	}

	filePath := filepath.Join(dbPath)

	// Open the notes file in read-write mode
	file, err := os.OpenFile(filePath, os.O_WRONLY|os.O_TRUNC, os.ModePerm)
	if err != nil {
		fmt.Println("Error opening the notes file:", err)
		return
	}
	defer file.Close()

	// Truncate the file
	file.Truncate(0)
	file.Seek(0, 0)

	// Write back the remaining lines excluding the selected line number
	for i, line := range notes {
		if i+1 != listNumber {
			_, err := file.WriteString(strings.TrimPrefix(line, fmt.Sprintf("%03d - ", i+1)) + "\n")
			if err != nil {
				fmt.Println("Error writing to the notes file:", err)
				return
			}
		}
	}

	fmt.Println("Note removed successfully.")
}
