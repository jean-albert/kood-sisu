package main

import (
	"flag"
	"fmt"
	"os"
	"strconv"
)

func main() {
	// Flag for A* distance-based heuristic.
	var aStar bool
	flag.BoolVar(&aStar, "a", false, "use A*")
	flag.Parse()

	// Assess arguments.
	args := os.Args
	if !((len(args) == 5 && !aStar) || (len(args) == 6 && aStar)) {
		errCall("Error: train scheduler usage:\ngo run . [path to file containing network map] [start station] [end station] [number of trains]\noptional flag -a before other arguments to use distance-based pathfinding")
	}
	argShift := 0
	if len(args) == 6 {
		argShift = 1
	}
	networkMap, startName, endName, trainsToRun := args[1+argShift], args[2+argShift], args[3+argShift], args[4+argShift]
	numTrains, err := strconv.Atoi(trainsToRun)
	if numTrains <= 0 || err != nil {
		errCall("Error: number of trains must be positive int:\n")
	}
	if startName == endName {
		errCall("Error: start and end station are the same")
	}

	// Build your slice of stations and the map.
	stations, connections := buildStations(networkMap)

	start, end := stationLookup(startName, stations), stationLookup(endName, stations)
	if start == nil && end == nil {
		errCall("Error: Start or end station not found.")
	}
	if start == nil {
		errCall("Error: Start station not found.")
	}
	if end == nil {
		errCall("Error: End station not found.")
	}

	// Find efficient paths and dispatch trains.
	paths, uniquePaths := findPaths(start, end, connections, aStar, numTrains, nil)

	// Run and print the line by line run.
	runSchedule(paths, uniquePaths, false)
}

// Prints error string to os.Stderr and calls os.Exit(1).
func errCall(err string) {
	fmt.Fprintln(os.Stderr, err)
	os.Exit(1)
}
