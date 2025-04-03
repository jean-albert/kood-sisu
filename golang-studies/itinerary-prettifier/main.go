package main

import (
	"flag"
	"fmt"
	lookup "itinerary/lookup"
	prettifier "itinerary/prettifier"
	"os"
)

func main() {
	flagHelp := flag.Bool("h", false, "Print Usage")
	toggleTerminalPrintOut := flag.Bool("f", false, "To enable terminal printout aka stdout")
	colorStd := flag.Bool("c", false, "Stdout Colored")
	flag.Parse()

	//Color toggle
	var mode int
	if *colorStd {
		mode = 2
	} else if *toggleTerminalPrintOut {
		mode = 1
	}

	//Get non-flag command-line arguments
	args := flag.Args()
	if len(args) != 3 || *flagHelp {
		fmt.Println("itinerary usage:\ngo run . ./input.txt ./output.txt ./airport-lookup.csv")
		return
	}

	//Extract paths for input file, output file, and airport lookup file from command-line arguments
	inputPath, outputPath, lookupPath := args[0], args[1], args[2]

	//Check Does Input Exist
	if _, err := os.Stat(inputPath); os.IsNotExist(err) {
		fmt.Println("Input not found")
		return
	}

	//Lookup Airport Not Found (Check)
	if _, err := os.Stat(lookupPath); os.IsNotExist(err) {
		fmt.Println("Airport lookup not found")
		return
	}

	// Check if the airport lookup is malformed
	_, err := lookup.LoadAirportLookup(lookupPath)
	if err != nil {
		fmt.Println("Airport lookup malformed")
		return
	}

	/*
		//Check if the Airport Look up Malformed
		if _, err := lookup.LoadAirportLookup(lookupPath); err != nil {
			fmt.Println("Airport lookup malformed")
			return
		}
	*/

	// Call the Prettifier function
	prettifier.Prettifier(inputPath, outputPath, lookupPath, mode)

	// Optional: Print a success message
	fmt.Println("Output file created successfully:", outputPath)
}
