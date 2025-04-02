# stations-pathfinder
`stations-pathfinder` is a path-finding algorithm, used to find the most efficient paths to move trains from one destination to another.

 The algorithm finds the shortest path between stations in a rail network (defined in `.map` files) using a variation of Dijkstra's algorithm enhanced with A* search heuristics. It employs a priority queue to explore paths efficiently, utilizing Manhattan distance as a heuristic for better performance. The algorithm can handle multiple trains by finding and managing several unique paths, ensuring optimal dispatching based on path lengths. It reconstructs the final path by backtracking through a map of predecessors, enabling dynamic route adjustments based on station occupancy.  

It generates a schedule for optimal movements in a turn based manner, then executes it and prints the order of movements.

## Structure
All files should be in the same directory in order for the program to work.

## Usage

The program requires 4 arguments to run.

[path to file containing network map] [start station] [end station] [number of trains]

```bash
$ go run . londonnetwork.map victoria euston 2
Turn 1: T1-waterloo T2-st_pancras 
Turn 2: T1-euston T2-euston 
```

When a viable input is given, the program simulates the train movements and prints them.

## Testing
This project was done as part of coursework for programming studies at kood/sisu. `main_test.go` contains testing functions matching the requirements of the project and can be used by reviewers to easily run the tests.

### License 

Jean-Albert Campello & Niila Rontti     2024

This project is licensed under the MIT License.

[MIT](https://choosealicense.com/licenses/mit/)