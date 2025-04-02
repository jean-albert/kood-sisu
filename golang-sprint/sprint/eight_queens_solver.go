package sprint

import (
	"strconv"
	"strings"
)

func EightQueensSolver() string {
	var solutions []string
	queens := make([]int, 8)
	solveQueens(queens, 0, &solutions)
	return strings.Join(solutions, "\n")
}

func solveQueens(queens []int, row int, solutions *[]string) {
	if row == 8 {
		*solutions = append(*solutions, formatSolution(queens))
		return
	}
	for col := 0; col < 8; col++ {
		if isSafe(queens, row, col) {
			queens[row] = col
			solveQueens(queens, row+1, solutions)
		}
	}
}

func isSafe(queens []int, row, col int) bool {
	for i := 0; i < row; i++ {
		if queens[i] == col || queens[i]-col == i-row || queens[i]-col == row-i {
			return false
		}
	}
	return true
}

func formatSolution(queens []int) string {
	var solution strings.Builder
	for _, pos := range queens {
		solution.WriteString(strconv.Itoa(pos + 1))
	}
	return solution.String()
}
