package main

import (
	"fmt"
)

// For the updateActiveStations it retrieves the index value of a specific station.
func findStationIndex(stations []Station, targetName string) int {
	for i, station := range stations {
		if station.Name == targetName {
			return i
		}
	}
	return -1 // Not found
}

// This function switches the name of a trains station to the name of its neighbor, whilst checking that no two stations are occupied at the same time.
func updateActiveStations(currentStation []string, path []Station, active [][]string) []string {
	if currentStation == nil {
		currentStation = []string{path[0].Name}
	}
	index := findStationIndex(path, currentStation[len(currentStation)-1])

	if index+1 < len(path) {
		currentStation = append(currentStation, path[index+1].Name)
		//check for identical simultaneous paths
		same := false
		for _, path := range active {
			if len(path) != len(currentStation) {
				continue
			}
			same = true
			for i, stop := range path {
				if currentStation[i] != stop {
					same = false
					break
				}
			}
		}
		if same {
			return nil
		}
		return currentStation
	} else {
		return []string{"*"} // Current station is the last station
	}
}

// Creates an array of arrays that are trains at the first station, then loops through that array until every train is in the end station and prints the state of the network at every turn.
func runSchedule(paths [][]Station, uniquePaths int, counting bool) int {
	track := uniquePaths
	active := make([][]string, len(paths))
	var done bool
	turnCount := 0

	for turn := 0; ; turn++ {
		done = true
		anyMoved := false // Flag to check if any trains moved this turn
		if turn != 0 {
			track = track + uniquePaths
			if track > len(paths) {
				track = len(paths)
			}
		}
		for i := 0; i < track; i++ {
			if len(active[i]) > 0 {
				if active[i][0] == "*" {
					continue
				}
			}
			active[i] = updateActiveStations(active[i], paths[i], active)
			if active[i] != nil && active[i][0] != "*" {
				anyMoved = true // Mark that something moved this turn
			}
			done = false
		}

		if done {
			break
		}

		if !counting && anyMoved { // Only print the turn if any trains moved
			fmt.Printf("Turn %d: ", turn+1)
			for i := 0; i < len(active); i++ {
				if len(active[i]) > 0 && active[i][0] != "*" {
					fmt.Printf("T%d-%s ", i+1, active[i][len(active[i])-1])
				}
			}
			fmt.Println()
		}

		turnCount++
	}

	return turnCount
}
