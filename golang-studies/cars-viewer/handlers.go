package main

import (
	"net/http"
	"strconv"
	"strings"
)

func MainPageHandler(w http.ResponseWriter, r *http.Request) {
	PageHandler(w, r, "templates/mainpage.html", false, "main")
}

func InfoPageHandler(w http.ResponseWriter, r *http.Request) {
	PageHandler(w, r, "templates/info.html", true, "info")
}

func IntSliceContains(slice []int, item int) bool {
	for _, v := range slice {
		if v == item {
			return true
		}
	}
	return false
}

func SearchHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed: "+r.Method, http.StatusMethodNotAllowed)
		return
	}

	endpoints := commonEndpoints

	data, err := FetchDataFromEndpoints(endpoints, w)
	if err != nil {
		return
	}

	compositeModels := CombineData(data)

	// Gather search criteria
	searchManufacturer := r.FormValue("manufacturer")
	searchCategory := r.FormValue("category")
	searchCountry := r.FormValue("country")
	searchDrivetrain := r.FormValue("drivetrain")
	searchEngine := r.FormValue("engine")
	searchTransmission := r.FormValue("transmission")
	searchYear := r.FormValue("year")
	valueMinHorsepowerStr := r.FormValue("valueMinHorsepower")
	valueMaxHorsepowerStr := r.FormValue("valueMaxHorsepower")
	sortingMethod := r.FormValue("sortingMethod")
	message := r.FormValue("message")

	valueMinHorsepower, _ := strconv.Atoi(valueMinHorsepowerStr)
	valueMaxHorsepower, _ := strconv.Atoi(valueMaxHorsepowerStr)

	if valueMinHorsepower > valueMaxHorsepower {
		valueMinHorsepower, valueMaxHorsepower = valueMaxHorsepower, valueMinHorsepower
	}

	var result []CompositeModel
	for _, compositeModel := range compositeModels {
		if searchManufacturer != "" && !strings.Contains(compositeModel.Manufacturer.Name, searchManufacturer) {
			continue
		}
		if searchCategory != "" && !strings.Contains(compositeModel.Category.Name, searchCategory) {
			continue
		}
		if searchCountry != "" && !strings.Contains(compositeModel.Manufacturer.Country, searchCountry) {
			continue
		}
		if searchDrivetrain != "" && !strings.Contains(compositeModel.Model.Specifications.Drivetrain, searchDrivetrain) {
			continue
		}
		if searchEngine != "" && !strings.Contains(compositeModel.Model.Specifications.Engine, searchEngine) {
			continue
		}
		if searchTransmission != "" && !strings.Contains(compositeModel.Model.Specifications.Transmission, searchTransmission) {
			continue
		}
		if searchYear != "" && !strings.Contains(compositeModel.Model.Year, searchYear) {
			continue
		}

		horsepowerMatches := true
		if valueMinHorsepowerStr != "" || valueMaxHorsepowerStr != "" {
			horsepowerMatches = compositeModel.Model.Specifications.Horsepower >= valueMinHorsepower && compositeModel.Model.Specifications.Horsepower <= valueMaxHorsepower
		}

		if horsepowerMatches {
			result = append(result, compositeModel)
		}
	}

	// Store the results in a map to perform sorting based on the previous search without making a new search
	previousSearch := map[string]string{
		"Manufacturer":       searchManufacturer,
		"Category":           searchCategory,
		"Country":            searchCountry,
		"Drivetrain":         searchDrivetrain,
		"Engine":             searchEngine,
		"Transmission":       searchTransmission,
		"Year":               searchYear,
		"ValueMinHorsepower": valueMinHorsepowerStr,
		"ValueMaxHorsepower": valueMaxHorsepowerStr,
		"SortingMethod":      sortingMethod,
	}

	SortSearchResults(result, sortingMethod)

	pageData := map[string]interface{}{
		"Results":        result,
		"PreviousSearch": previousSearch,
		"Message":        message,
		"SourceTemplate": "search.html",
	}

	RenderTemplate(w, "templates/search.html", pageData)
}

func CompareHandler(w http.ResponseWriter, r *http.Request) {

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed: "+r.Method, http.StatusMethodNotAllowed)
		return
	}

	endpoints := commonEndpoints

	data, err := FetchDataFromEndpoints(endpoints, w)
	if err != nil {
		return
	}

	compositeModels := CombineData(data)
	r.ParseForm()
	selectedCars := r.Form["comparename"]
	sourceTemplate := r.FormValue("source")
	var selectedModels []CompositeModel

	if len(selectedCars) < 2 {
		switch sourceTemplate {
		case "mainpage.html":
			PageHandler(w, r, "templates/"+sourceTemplate, false, "NoCars")
			return
		case "search.html":
			r.Form.Set("message", "Select at least two cars")
			SearchHandler(w, r)
			return
		}
	}

	for _, id := range selectedCars {
		carID, err := strconv.Atoi(id)
		if err != nil {
			http.Error(w, "Invalid ID", http.StatusBadRequest)
			return
		}

		found := false
		for _, model := range compositeModels {
			if model.Model.ID == carID {
				selectedModels = append(selectedModels, model)
				found = true
				break
			}
		}

		if !found {
			http.Error(w, "Car ID not found", http.StatusNotFound)
			return
		}

	}

	pageData := map[string]interface{}{
		"Model": selectedModels,
	}

	RenderTemplate(w, "templates/compare.html", pageData)
}
