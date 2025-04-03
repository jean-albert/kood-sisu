package main

import (
	"html/template"
	"io/ioutil"
	"log"
	"net/http"
	"strings"
)

var tmpl = template.Must(template.ParseFiles("templates/index.html"))

type PageData struct {
	Result  string
	Message string
}

func main() {
	http.HandleFunc("/", homeHandler)
	http.HandleFunc("/decoder", decoderHandler)
	http.HandleFunc("/encoder", encoderHandler)
	http.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	log.Println("Starting server on : http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		w.WriteHeader(http.StatusOK)
		tmpl.Execute(w, nil)
	} else {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
	}
}

func decoderHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	var inputText string
	var err error

	// Handle text input
	if inputText = r.FormValue("inputText"); inputText != "" {
		// Multi-line decoding
		inputLines := strings.Split(inputText, "\n")
		var decodedLines []string
		for _, line := range inputLines {
			if decodedLine, err := decode(line); err == nil {
				decodedLines = append(decodedLines, decodedLine)
			} else {
				w.WriteHeader(http.StatusBadRequest)
				tmpl.Execute(w, PageData{Message: "Error decoding input: " + err.Error()})
				return
			}
		}
		w.WriteHeader(http.StatusAccepted)
		tmpl.Execute(w, PageData{Result: strings.Join(decodedLines, "\n")})
		return
	}

	// Handle file upload
	file, _, err := r.FormFile("decodeFile")
	if err == nil {
		defer file.Close()
		content, err := ioutil.ReadAll(file)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			tmpl.Execute(w, PageData{Message: "Error reading file: " + err.Error()})
			return
		}
		fileLines := strings.Split(string(content), "\n")
		var decodedLines []string
		for _, line := range fileLines {
			if decodedLine, err := decode(line); err == nil {
				decodedLines = append(decodedLines, decodedLine)
			} else {
				w.WriteHeader(http.StatusBadRequest)
				tmpl.Execute(w, PageData{Message: "Error decoding file: " + err.Error()})
				return
			}
		}
		w.WriteHeader(http.StatusAccepted)
		tmpl.Execute(w, PageData{Result: strings.Join(decodedLines, "\n")})
		return
	}
	w.WriteHeader(http.StatusBadRequest)
	tmpl.Execute(w, PageData{Message: "Please provide input text or upload a file"})
}

func encoderHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	var inputText string
	var err error

	// Handle text input
	if inputText = r.FormValue("encodeText"); inputText != "" {
		// Multi-line encoding
		inputLines := strings.Split(inputText, "\n")
		var encodedLines []string
		for _, line := range inputLines {
			if encodedLine, err := encode(line); err == nil {
				encodedLines = append(encodedLines, encodedLine)
			} else {
				w.WriteHeader(http.StatusBadRequest)
				tmpl.Execute(w, PageData{Message: "Error encoding input: " + err.Error()})
				return
			}
		}
		w.WriteHeader(http.StatusAccepted)
		tmpl.Execute(w, PageData{Result: strings.Join(encodedLines, "\n")})
		return
	}

	// Handle file upload
	file, _, err := r.FormFile("encodeFile")
	if err == nil {
		defer file.Close()
		content, err := ioutil.ReadAll(file)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			tmpl.Execute(w, PageData{Message: "Error reading file: " + err.Error()})
			return
		}
		fileLines := strings.Split(string(content), "\n")
		var encodedLines []string
		for _, line := range fileLines {
			if encodedLine, err := encode(line); err == nil {
				encodedLines = append(encodedLines, encodedLine)
			} else {
				w.WriteHeader(http.StatusBadRequest)
				tmpl.Execute(w, PageData{Message: "Error encoding file: " + err.Error()})
				return
			}
		}
		w.WriteHeader(http.StatusAccepted)
		tmpl.Execute(w, PageData{Result: strings.Join(encodedLines, "\n")})
		return
	}
	w.WriteHeader(http.StatusBadRequest)
	tmpl.Execute(w, PageData{Message: "Please provide input text or upload a file"})
}
