package itinerary

import (
	"encoding/csv"
	"errors"
	"fmt"
	"io"
	"os"
	"strings"
)

type Airports struct {
	Name         string
	IsoCountry   string
	Municipality string
	IcaoCode     string
	IataCode     string
	Coordinates  string
}

func LoadAirportLookup(path string) ([]Airports, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	reader := csv.NewReader(file)
	// Read the header row to determine column indices
	header, err := reader.Read()
	if err != nil {
		return nil, err
	}

	// Ensure that the columns are in the correct order
	expectedSequence := []string{"name", "iso_country", "municipality", "icao_code", "iata_code", "coordinates"}
	colIndex := make(map[string]int)
	for i, column := range header {
		colIndex[column] = i
	}
	for _, expectedColumn := range expectedSequence {
		if _, ok := colIndex[expectedColumn]; !ok {
			return nil, fmt.Errorf("column %s not found in CSV header", expectedColumn)
		}
	}

	// Read and parse each row
	airports := []Airports{}
	lineNumber := 1 // Start counting from the second line (after header)
	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		} else if err != nil {
			return nil, err
		}
		//Chech if the lines are empty
		lineNumber++
		if len(record) < len(expectedSequence) {
			return nil, fmt.Errorf("malformed record at line %d: expected %d fields, got %d", lineNumber, len(expectedSequence), len(record))
		}
		airport := Airports{
			Name:         record[colIndex["name"]],
			IsoCountry:   record[colIndex["iso_country"]],
			Municipality: record[colIndex["municipality"]],
			IcaoCode:     record[colIndex["icao_code"]],
			IataCode:     record[colIndex["iata_code"]],
			Coordinates:  record[colIndex["coordinates"]],
		}

		//Column empty check
		if airport.Name == "" || airport.IsoCountry == "" || airport.Municipality == "" || airport.IataCode == "" || airport.IcaoCode == "" || airport.Coordinates == "" {
			return airports, errors.New("required data missing")
		}
		airports = append(airports, airport)
	}
	return airports, nil
}

func FindAirportName(code string, airports []Airports) string {
	city := strings.Contains(code, "*")

	//Loop for code to cityname
	for i := 0; i < len(code); i++ {
		if code[i] != '#' && code[i] != '*' && city {
			code = code[i:]
			break
		}

	}

	for _, airport := range airports {
		if len(code) == 3 || len(code) == 4 {
			if code == airport.IataCode || code == airport.IcaoCode {

				if city {
					return airport.Municipality
				} else {
					return airport.Name
				}
			}
		}
	}
	return ""

}
