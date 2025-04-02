package main

import (
	"container/heap"
)

// Item struct used in the shortest path algorithm.
type Item struct {
	value    *Station
	priority int
	index    int
}

// Creates the priority queue item.
type PriorityQueue []*Item

// These add functions to the PriorityQueue item, think of them like methods in Python classes, functions inside a specific datastructure.
func (pq PriorityQueue) Len() int           { return len(pq) }
func (pq PriorityQueue) Less(i, j int) bool { return pq[i].priority < pq[j].priority }
func (pq PriorityQueue) Swap(i, j int)      { pq[i], pq[j] = pq[j], pq[i] }

// Pushes items into the queue.
func (pq *PriorityQueue) Push(x interface{}) {
	item := x.(*Item)
	item.index = len(*pq)
	*pq = append(*pq, item)
}

// Pops items out of the queue.
func (pq *PriorityQueue) Pop() interface{} {
	old := *pq
	n := len(old)
	item := old[n-1]
	item.index = -1 // Mark as removed
	*pq = old[0 : n-1]
	return item
}

// A dijkstra algorithm that has an A* boolean, the review cases work with the normal dijkstra because they do not incorporate distance.
func findShortestPath(start *Station, end *Station, connections RailMap, aStar bool, short bool, single []Station) []Station {
	count := 0
	openSet := make(PriorityQueue, 0) // The set of travelable stations.
	heap.Init(&openSet)
	heap.Push(&openSet, &Item{
		value:    start,
		priority: 0,
		index:    count,
	})

	cameFrom := make(map[*Station]*Station) // The path that has already been taken, stores stations.
	gScore := make(map[string]int)          // How much distance does it take to get to this station from start.
	fScore := make(map[*Station]int)        // The sum of the distance from start and to the end station.

	for _, station := range connections.Stations { // Making the stations distance near infinite value before they are evaluated.
		gScore[station.Name] = 1 << 20
		fScore[station] = 1 << 20
	}
	gScore[start.Name] = 0
	fScore[start] = h(start.X, start.Y, end.X, end.Y)

	for openSet.Len() > 0 {
		current := heap.Pop(&openSet).(*Item).value

		//if end, return. also checks that not finding same path of length=1
		if current == end && !(short && cameFrom[current].Name == start.Name) {
			path := reconstructPath(cameFrom, end)
			// when MULTI searching, check that this isn't the shortest path
			if len(path) == len(single) {
				clearStations(connections)
				continue
			}

			return path
		} else if cameFrom[current] != nil {
			if current == end && short && cameFrom[current].Name == start.Name {
				// when we hit the end directly from the start a second time, skip to avoid redundancy
				continue
			}
		}

		for _, neighbor := range connections.Connections[current] {
			tempGScore := gScore[current.Name] + 1
			if (tempGScore < gScore[neighbor.Name] && !neighbor.Occupied) || (short && neighbor.Name == end.Name) || (single != nil && neighbor.Name == end.Name) {
				cameFrom[neighbor] = current

				gScore[neighbor.Name] = tempGScore
				fScore[neighbor] = tempGScore + h(neighbor.X, neighbor.Y, end.X, end.Y)

				// Check if neighbor is not already in the openSet
				found := false
				for _, item := range openSet {
					if item.value == neighbor {
						found = true
						break
					}
				}

				if !found {
					count++
					// check for a* flag to switch to distance heuristic. default is fixed-block
					if aStar {
						heap.Push(&openSet, &Item{
							value:    neighbor,
							priority: fScore[neighbor],
							index:    count,
						})
					} else {
						heap.Push(&openSet, &Item{
							value:    neighbor,
							priority: gScore[neighbor.Name],
							index:    count,
						})
					}
				}
			}
		}
	}

	return nil // No path found
}

// Once a path has been found the history of stations is reconstructed from the cameFrom variable and a functional path is created.
func reconstructPath(cameFrom map[*Station]*Station, current *Station) []Station {
	path := make([]Station, 0)
	path = append(path, *current)
	current = cameFrom[current]

	for current != nil {
		path = append(path, *current)
		current.Occupied = true
		current = cameFrom[current]
	}
	// Reverse the path before returning
	for i, j := 0, len(path)-1; i < j; i, j = i+1, j-1 {
		path[i], path[j] = path[j], path[i]
	}
	return path
}

// Function for calculating Manhattan distance for the A* algorithm.
func h(x1, y1, x2, y2 int) int {
	return abs(x1-x2) + abs(y1-y2)
}

// Absolute value, there can be no negative numbers in the sums.
func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

// Function identifies all the possible paths that there can be and assigns a path to every train. It also tracks how many unique paths there are, which informs how many trains can be released in one turn.
func findPaths(start *Station, end *Station, connections RailMap, aStar bool, numTrains int, single []Station) ([][]Station, int) {
	var paths [][]Station
	var uniquePaths int
	var short bool
	counter := 0
	netTrains := numTrains

	path := findShortestPath(start, end, connections, aStar, false, single)
	if path == nil {
		if single != nil {
			return nil, 1
		}
		errCall("Error: no path found")
	}
	numTrains--
	paths = append(paths, path)
	if len(path) == 2 {
		short = true // Marks that we have a path directly from start to end for later pathfinding.
	}
	for {
		path := findShortestPath(start, end, connections, aStar, short, single)
		// Dispatch efficiency logic:
		if len(path)-len(paths[0]) < numTrains {
			if len(path) != 0 {
				paths = append(paths, path)
				uniquePaths = len(paths)
			} else if len(paths[counter])-len(paths[0]) < numTrains {
				paths = append(paths, paths[counter]) // Once all the new paths are found all the other trains will be assigned the already existing paths, from most efficient to least.
				counter++
				if counter == uniquePaths {
					counter = 0
				}
			} else {
				paths = append(paths, paths[0])
				counter = 0
			}
			numTrains--
			if numTrains <= 0 {
				break
			}
		} else {
			break
		}
	}
	if uniquePaths == 0 {
		// Check for more optimal multi-pathing options.
		clearStations(connections)
		multiPaths, uniquePaths := findPaths(start, end, connections, aStar, netTrains, paths[0])
		if uniquePaths == 1 {
			return paths, uniquePaths
		}
		if runSchedule(multiPaths, uniquePaths, true) < (len(paths[0]) + netTrains - 1) {
			return multiPaths, uniquePaths
		}
		uniquePaths = 1
	}
	return paths, uniquePaths // Returns a path for every train and the amount of paths that can be started per turn.
}
