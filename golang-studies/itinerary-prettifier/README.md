# Itinerary Prettifier

## What the Tool Does:

**Itinerary Prettifier** is a command line tool, which reads a text-based itinerary from a file (input), processes the text to make it customer-friendly, and makes the date and time more readable, and writes the result to a new file (output). With an optional argument, the program will also print the formatted text to the console, with added colour, underlining and bolding.

## Usage:

**The tool will be launched from the command line with three arguments:**

1.  Path to the input
2.  Path to the output
3.  Path to the airport lookup

And the command line:

`-$ go run . ./input.txt ./output.txt ./airports_lookup.csv`

**Optionally, the tool can also be launched with flags:**

1.  `-h: Print usage instructions.`

If the program is run with an -h flag, as follows:

`-$ go run . -h`

or, if the program is run with an invalid argument, or with an invalid argument number,

the tool displays the following usage guide:

`Itinerary usage:`  
<br/>`go run . ./input.txt ./output.txt ./airport-lookup.csv`

2.  `-f: Enable terminal printout.`
   
If the program is run with an -f flag, as follows:

`-$ go run . -f ./input.txt ./output.txt ./airports_lookup.csv`

It will print the 'output' result into the terminal.

3.  `-c: Enable colored stdout.`

If the program is run with an -c flag, as follows:

`-$ go run . -c ./input.txt ./output.txt ./airports_lookup.csv`

It will print the 'output' result into the terminal with colors.

### License 

Jean-Albert Campello     2024

This project is licensed under the MIT License.

[MIT](https://choosealicense.com/licenses/mit/)