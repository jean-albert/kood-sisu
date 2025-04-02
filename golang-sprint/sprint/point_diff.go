package sprint

type Point struct {
	X    float32
	Y    float32
	Text string
}

func PointDiff(p1, p2 Point) Point {
	if p1.X > p2.X || p1.Y > p2.Y {
		return p1
	}
	if p2.X > p1.X || p2.Y > p1.Y {
		return p2
	}
	return p1
}
