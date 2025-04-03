# Art Interface

## Overview

This project provides a web interface for the shapes-decoder, allowing to input encoded text (string, multi-line or file) to generate text-based art output. Or to input text-based art (string, multi-line or file) to generate encoded output.

## Decode feature

- Input encoded strings or multi-line text via a web form
- Or upload encoded file
- Decode given input
- Display the generated text-based art on the same page

## Encode feature

- Input text-based art strings or multi-line via a web form
- Or upload text-based art file
- Encode given input
- Display the generated encoded text on the same page

## Endpoints

- `GET /` - Main page of the web interface
- `POST /decoder` - Endpoint to decode the input text or file
- `POST /encoder` - Endpoint to encode the input text or file

## How to Run

To start the server:
    `go run .`
    Then click on the link provide in the terminal:
    `2024/06/28 17:06:29 Starting server on : http://localhost:8080`

To stop the server type:
    ctrl + c

### License 

Jean-Albert Campello     2024

This project is licensed under the MIT License.

[MIT](https://choosealicense.com/licenses/mit/)