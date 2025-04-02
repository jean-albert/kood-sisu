package sprint

import "fmt"

type Point struct {
	X    float32
	Y    float32
	Text string
}

func PointText(p Point) Point {
	newText := fmt.Sprintf("Text at (%f, %f)", p.X, p.Y)
	return Point{X: p.X, Y: p.Y, Text: newText}
}
