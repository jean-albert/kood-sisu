# art-decoder

## What the tool does:

**art-decoder** takes a string of caracters, or a file with multiple strings of caracters, as an input and converts it into a text-based art. It can also takes a piece of text-based art, or a file with text-based art, and converts it into strings of caracters.

## Usage:

The tool accept a single command line argument, with flags.

1.  Flag `-d` is used to decode a string of caracters.

For example: `go run . -d '[5 #][5 -_]-[5 #]'`

2.  Flag `-e` is used to encode a piece of text-based art.

For example: `go run . -e '#####-_-_-_-_-_-#####'`

3.  Flag `-d` + `-f` are used to decode strings of caracters from a file.

For example: `go run . -d -f ./encoded/lion.encoded.txt`

4.  Flag `-e` + `-f` are used to encode text-based art from a file.

For example: `go run . -e -f ./art/lion.art.txt` 

### License 

Jean-Albert Campello     2024

This project is licensed under the MIT License.

[MIT](https://choosealicense.com/licenses/mit/)