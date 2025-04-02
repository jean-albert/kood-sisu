package sprint

type Circle struct {
	Radius    float32
	Diameter  float32
	Area      float32
	Perimeter float32
}

func GetCircle(r float32) Circle {
	diameter := 2 * r
	area := 3.14 * r * r
	perimeter := 2 * 3.14 * r

	return Circle{
		Radius:    r,
		Diameter:  diameter,
		Area:      area,
		Perimeter: perimeter,
	}
}
