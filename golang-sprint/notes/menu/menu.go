package menu

import (
	"fmt"
)

// Printing menu options
func PrintMenu() {
	fmt.Println("\nSelect operation:")
	fmt.Println("1. Show notes.")
	fmt.Println("2. Add a note.")
	fmt.Println("3. Delete a note.")
	fmt.Println("4. Exit.")
	fmt.Println("5. Help")
}

// Getting user choice input
func GetUserChoice() int {
	fmt.Print("\nEnter your choice: ")
	var choice int
	fmt.Scanln(&choice)
	return choice
}

// Printing help message
func PrintHelp() {
	fmt.Println("Tool for managing short single-line notes.")
	fmt.Println("Usage: ./notestool [COLLECTION_NAME]")
	fmt.Println("Example: ./notestool coding_ideas")
	fmt.Println("Choose an option in the menu from 1 to 4")
}
