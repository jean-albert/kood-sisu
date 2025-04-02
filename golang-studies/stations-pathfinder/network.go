package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
)

// Represents a station in our map.
type Station struct {
	Name     string
	Distance int
	Train    Train
	Occupied bool
	X        int
	Y        int
}

// Train struct used for scheduling.
type Train struct {
	Number int
	Path   int
	Turn   int
}

// Railway map containing both all stations and the connections between them.
type RailMap struct {
	Stations    []*Station
	Connections map[*Station][]*Station
}

// Function that builds all the stations and the railway map.
func buildStations(filePath string) ([]Station, RailMap) {
	var stations []Station
	connections := RailMap{
		Stations:    make([]*Station, 0),
		Connections: make(map[*Station][]*Station),
	}
	mapFile, err := os.Open(filePath)
	if err != nil {
		fmt.Fprintln(os.Stderr, "Error:", err)
		return stations, connections // Return an empty slice or handle the error
	}
	defer mapFile.Close()
	scanner := bufio.NewScanner(mapFile)
	stationSection, connectionsSection := false, false
	stationSectionExists := false
	for scanner.Scan() {
		//build stations until "connections:" is hit
		line := scanner.Text()
		if line == "stations:" {
			stationSectionExists = true
			stationSection = true
			continue
		}
		if !stationSectionExists {
			errCall("Error: stations section missing")
		}
		if line == "connections:" {
			//switch to building connections
			stationSection, connectionsSection = false, true
			continue
		}
		line = trimLine(line)
		if line == "" {
			continue
		}
		if stationSection {
			station := makeStation(line)
			checkDuplicates(station, stations)
			stations = append(stations, station)
			connections.Stations = append(connections.Stations, &stations[len(stations)-1])
		} else if connectionsSection {
			connections = addConnection(line, stations, connections)
		}
	}
	// check stations: and connections: sections exist, then for <=10,000 stations
	if !(!stationSection && connectionsSection) {
		errCall("Error: connections section missing")
	} else if len(stations) > 10000 {
		errCall("Error: more than 10,000 stations--" + fmt.Sprint(len(stations)))
	}

	return stations, connections
}

// Used in the buildStations function to construct individual stations.
func makeStation(line string) Station {
	parts := strings.Split(line, ",")
	name := parts[0]
	x, err1 := strconv.Atoi(parts[1])
	y, err2 := strconv.Atoi(parts[2])
	if err1 != nil || err2 != nil || x < 0 || y < 0 {
		errCall("Error: Invalid Coordinates: " + name)
	}
	if name == "" {
		errCall("Error: Invalid name")
	}
	station := Station{
		Name:     parts[0],
		X:        x,
		Y:        y,
		Distance: 1 << 20,
		Occupied: false,
	}
	return station
}

// Used in the buildStations function to add connections to the railway map.
func addConnection(line string, stations []Station, connections RailMap) RailMap {
	stops := strings.Split(line, "-")
	stop1 := stationLookup(stops[0], stations)
	stop2 := stationLookup(stops[1], stations)
	if stop1 == nil || stop2 == nil {
		errCall("Error: invalid connection: " + line)
	}
	// check here for redundant or reverse connections
	checkDupConnections(stop1, stop2, connections)

	connections.Connections[stop1] = append(connections.Connections[stop1], stop2)
	connections.Connections[stop2] = append(connections.Connections[stop2], stop1)
	return connections
}

// Creates a pointer for stations.
func stationLookup(name string, stations []Station) *Station {
	for i := range stations {
		if stations[i].Name == name {
			return &stations[i] // Return the address of the found station
		}
	}
	return nil
}

// Processes raw lines from network map.
func trimLine(line string) string {
	parts := strings.Split(line, "#")
	line = strings.ReplaceAll(parts[0], " ", "")
	return line
}

// Error checking function that checks for duplicate names and coordinates and returns an error if it finds one.
func checkDuplicates(station Station, stations []Station) {
	for _, check := range stations {
		if check.Name == station.Name {
			errCall("Error: duplicate station name--" + check.Name)
		} else if check.X == station.X && check.Y == station.Y {
			errCall("Error: duplicate coordinates: " + check.Name + " and " + station.Name)
		}
	}
}

// Checks for duplicated/reversed connections and quits with error if found.
func checkDupConnections(stop1 *Station, stop2 *Station, connections RailMap) {
	for _, check := range connections.Connections[stop1] {
		if check == stop2 {
			errCall("Error: duplicate connection--" + stop1.Name + " and " + stop2.Name)
		}
	}
	for _, check := range connections.Connections[stop2] {
		if check == stop1 {
			errCall("Error: duplicate connection--" + stop1.Name + " and " + stop2.Name)
		}
	}
}

// If multiple paths are more efficient than a single most efficient path then this function clears the connection map of occupancy for the recount.
func clearStations(railMap RailMap) {
	for _, station := range railMap.Stations {
		station.Occupied = false
	}
	for _, stations := range railMap.Connections {
		for _, station := range stations {
			station.Occupied = false
		}
	}
}
