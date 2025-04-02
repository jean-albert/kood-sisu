package main

import (
	"fmt"
	"os"
	"path/filepath"

	"koodsisu.fi/jeanalbertcampello/notes/menu"
	"koodsisu.fi/jeanalbertcampello/notes/notes"
)

const collectionDir = "collections/"

func main() {

	notes.InitializeDatabase("notes/")

	filePath := filepath.Join("notes/", notes.NotesDir, notes.NotesFile+".txt")

	fmt.Printf("Welcome to the notes tool!\n")

	for {
		menu.PrintMenu()

		choice := menu.GetUserChoice()

		switch choice {
		case 1:
			notes.DisplayNotes(filePath)
		case 2:
			notes.AddNotes(filePath)
		case 3:
			notes.RemoveNotes(filePath)
		case 4:
			fmt.Println("Exiting the program.")
			os.Exit(0)
		case 5:
			menu.PrintHelp()
		default:
			fmt.Println("Invalid choice. Please choose a valid option.")
		}
	}
}
