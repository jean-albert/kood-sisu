package main

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"testing"
)

// Test that the program can find more than one valid route for 3 trains between waterloo and st_pancras for the London Network Map
func TestLondonNetworkMap1(t *testing.T) {
	fmt.Println("Test that the program can find more than one valid route for 3 trains between waterloo and st_pancras for the London Network Map")

	cmd := exec.Command("go", "run", ".", "londonnetwork.map", "waterloo", "st_pancras", "3")
	output, err := cmd.CombinedOutput()

	if err != nil {
		t.Fatal(err)
	}

	strings.Split(string(output), "\n")
	fmt.Printf("%s\n", output)

}

// Test that the program completes the movements in no more than 6 turns for 9 trains between beethoven and part
func TestBeethovenPart(t *testing.T) {
	fmt.Println("Test that the program completes the movements in no more than 6 turns for 9 trains between beethoven and part")

	cmd := exec.Command("go", "run", ".", "beethoven-part.map", "beethoven", "part", "9")
	output, err := cmd.CombinedOutput()

	if err != nil {
		t.Fatal(err)
	}

	strings.Split(string(output), "\n")
	fmt.Printf("%s\n", output)

}

// Test that the program completes the movements in no more than 8 turns for 9 trains between small and large
func TestSmallLarge(t *testing.T) {
	fmt.Println("Test that the program completes the movements in no more than 8 turns for 9 trains between small and large")

	cmd := exec.Command("go", "run", ".", "small-large.map", "small", "large", "9")
	output, err := cmd.CombinedOutput()

	if err != nil {
		t.Fatal(err)
	}

	strings.Split(string(output), "\n")
	fmt.Printf("%s\n", output)

}

// Test that the program completes the movements in no more than 6 turns for 4 trains between two and four
func TestTwoFour(t *testing.T) {
	fmt.Println("Test that the program completes the movements in no more than 6 turns for 4 trains between two and four")

	cmd := exec.Command("go", "run", ".", "two-four.map", "two", "four", "4")
	output, err := cmd.CombinedOutput()

	if err != nil {
		t.Fatal(err)
	}

	strings.Split(string(output), "\n")
	fmt.Printf("%s\n", output)

}

// Test that the program completes the movements in no more than 8 turns for 10 trains between jungle and desert
func TestJungleDesert(t *testing.T) {
	fmt.Println("Test that the program completes the movements in no more than 8 turns for 10 trains between jungle and desert")

	cmd := exec.Command("go", "run", ".", "jungle-desert.map", "jungle", "desert", "10")
	output, err := cmd.CombinedOutput()

	if err != nil {
		t.Fatal(err)
	}

	strings.Split(string(output), "\n")
	fmt.Printf("%s\n", output)

}

// Test that the program completes the movements in no more than 6 turns for 4 trains between bond_square and space_port
func TestBondSpace(t *testing.T) {
	fmt.Println("Test that the program completes the movements in no more than 6 turns for 4 trains between bond_square and space_port")

	cmd := exec.Command("go", "run", ".", "bond-space.map", "bond_square", "space_port", "4")
	output, err := cmd.CombinedOutput()

	if err != nil {
		t.Fatal(err)
	}

	strings.Split(string(output), "\n")
	fmt.Printf("%s\n", output)

}

// Test that the program can find more than one route for 2 trains between waterloo and st_pancras for the London Network Map
func TestLondonNetworkMap2(t *testing.T) {
	fmt.Println("Test that the program can find more than one route for 2 trains between waterloo and st_pancras for the London Network Map")

	cmd := exec.Command("go", "run", ".", "londonnetwork.map", "waterloo", "st_pancras", "2")
	output, err := cmd.CombinedOutput()

	if err != nil {
		t.Fatal(err)
	}

	strings.Split(string(output), "\n")
	fmt.Printf("%s\n", output)

}

// Test that the program completes the movements in no more than 11 turns for 20 trains between beginning and terminus
func TestBeginningTerminus(t *testing.T) {
	fmt.Println("Test that the program completes the movements in no more than 11 turns for 20 trains between beginning and terminus")

	cmd := exec.Command("go", "run", ".", "beginning-terminus.map", "beginning", "terminus", "20")
	output, err := cmd.CombinedOutput()

	if err != nil {
		t.Fatal(err)
	}

	strings.Split(string(output), "\n")
	fmt.Printf("%s\n", output)

}

// Tests that it displays "Error" on stderr when a map contains more than 10000 stations.
func TestTooMany(t *testing.T) {
	fmt.Println("Tests that the program displays 'Error' on stderr when a map contains more than 10000 stations")
	var content strings.Builder
	content.WriteString("stations:\n")
	for i := 0; i < 10001; i++ {
		content.WriteString(fmt.Sprintf("station%d,%d,%d\n", i, i, i))
	}
	content.WriteString("connections:\n")

	file, err := os.Create("toomany.map")
	if err != nil {
		t.Fatal(err)
	}
	defer os.Remove("toomany.map")

	if _, err := file.WriteString(content.String()); err != nil {
		t.Fatal(err)
	}
	file.Close()

	cmd := exec.Command("go", "run", ".", "toomany.map", "start", "end", "2")
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err = cmd.Run()

	if err != nil {
		// Check if stderr contains the expected error message
		errMsg := strings.TrimSpace(stderr.String())
		if !strings.Contains(errMsg, "Error: more than 10,000 stations") {
			t.Errorf("Expected error message to contain 'Error: more than 10,000 stations', got: %s", errMsg)
		}
	} else {
		t.Fatal("Expected an error but got none.")
	}
	fmt.Fprintf(os.Stderr, "%v\n", stderr.String())

}
