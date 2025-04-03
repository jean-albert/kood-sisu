package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"log"
	"net/http"
	"os"
	"sort"
	"strconv"
	"sync"
)

func FetchData(url string, key string, target interface{}, ch chan map[string]interface{}, wg *sync.WaitGroup) {
	defer wg.Done()

	response, err := http.Get(url)
	if err != nil {
		fmt.Println(err.Error())
		os.Exit(1)
	}
	defer response.Body.Close()

	responseData, err := io.ReadAll(response.Body)
	if err != nil {
		log.Fatal(err)
	}

	if err := json.Unmarshal(responseData, target); err != nil {
		log.Fatal(err)
	}

	// Send the data to the channel
	ch <- map[string]interface{}{key: target}
}

func CombineData(data map[string]interface{}) []CompositeModel {
	models := data["Models"].(*[]Model)
	manufacturers := data["Manufacturers"].(*[]Manufacturer)
	categories := data["Categories"].(*[]Category)

	// Create maps for quick lookup
	manufacturerMap := make(map[int]Manufacturer)
	categoryMap := make(map[int]Category)

	for _, m := range *manufacturers {
		manufacturerMap[m.ID] = m
	}
	for _, c := range *categories {
		categoryMap[c.ID] = c
	}

	var compositeModels []CompositeModel
	for _, model := range *models {
		compositeModels = append(compositeModels, CompositeModel{
			Model:        model,
			Manufacturer: manufacturerMap[model.Manufacturer],
			Category:     categoryMap[model.Category],
		})
	}

	return compositeModels
}

func FetchCategoriesAndSpecifications() (map[string][]string, error) {
	categories := make(map[string][]string)

	// Fetch manufacturers
	manufacturers, err := fetchDataFromAPI[Manufacturer]("http://localhost:3000/api/manufacturers")
	if err != nil {
		return nil, fmt.Errorf("failed to fetch manufacturers: %v", err)
	}
	var manufacturerNames []string
	var countryNames []string
	countrySet := make(map[string]bool)
	for _, m := range manufacturers {
		manufacturerNames = append(manufacturerNames, m.Name)
		if !countrySet[m.Country] {
			countryNames = append(countryNames, m.Country)
			countrySet[m.Country] = true
		}
	}
	categories["Manufacturers"] = manufacturerNames
	categories["Countries"] = countryNames

	// Fetch categories
	categoryData, err := fetchDataFromAPI[Category]("http://localhost:3000/api/categories")
	if err != nil {
		return nil, fmt.Errorf("failed to fetch categories: %v", err)
	}
	var categoryNames []string
	for _, c := range categoryData {
		categoryNames = append(categoryNames, c.Name)
	}
	categories["Categories"] = categoryNames

	// Fetch models
	models, err := fetchDataFromAPI[Model]("http://localhost:3000/api/models")
	if err != nil {
		return nil, fmt.Errorf("failed to fetch models: %v", err)
	}

	// Extract drivetrains, engines, and transmissions
	var drivetrains, engines, transmissions []string
	for _, m := range models {
		drivetrains = appendIfUnique(drivetrains, m.Specifications.Drivetrain)
		engines = appendIfUnique(engines, m.Specifications.Engine)
		transmissions = appendIfUnique(transmissions, m.Specifications.Transmission)
	}
	categories["Drivetrains"] = drivetrains
	categories["Engines"] = engines
	categories["Transmissions"] = transmissions

	return categories, nil
}

func fetchDataFromAPI[T any](url string) ([]T, error) {
	var result []T
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return result, nil
}

// Helper function to use in search form on mainpage
func appendIfUnique(slice []string, item string) []string {
	for _, v := range slice {
		if v == item {
			return slice
		}
	}
	return append(slice, item)
}

func PageHandler(w http.ResponseWriter, r *http.Request, templateFile string, processModel bool, message string) {
	if r.Method != http.MethodGet && r.Method != http.MethodPost {
		http.Error(w, "Method not allowed: "+r.Method, http.StatusMethodNotAllowed)
		return
	}

	endpoints := commonEndpoints

	data, err := FetchDataFromEndpoints(endpoints, w)
	if err != nil {
		return
	}

	// Combine models with their manufacturers and categories
	compositeModels := CombineData(data)

	var pageData map[string]interface{}

	sortingMethod := r.FormValue("sortingMethod")

	if processModel {
		// Retrieve the model ID from the query parameters
		modelIDStr := r.URL.Query().Get("id")
		if modelIDStr == "" {
			http.Error(w, "Model ID is required", http.StatusBadRequest)
			return
		}

		modelID, err := strconv.Atoi(modelIDStr)
		if err != nil {
			http.Error(w, "Invalid ID", http.StatusBadRequest)
			return
		}

		// Find the specific model based on the ID
		var selectedModel interface{}
		for _, model := range compositeModels {
			if model.Model.ID == modelID {
				selectedModel = model
				break
			}
		}

		if selectedModel == nil {
			http.Error(w, "Model not found", http.StatusNotFound)
			return
		}

		pageData = map[string]interface{}{
			"Model": selectedModel,
		}
	} else {
		categories, err := FetchCategoriesAndSpecifications()
		if err != nil {
			http.Error(w, "Unable to fetch categories and specifications", http.StatusInternalServerError)
			return
		}

		switch message {
		case "NoCars":
			pageData = map[string]interface{}{
				"CompositeModels": compositeModels,
				"Message":         "Select at least two cars",
				"Categories":      categories,
			}
		default:
			pageData = map[string]interface{}{
				"CompositeModels": compositeModels,
				"Categories":      categories,
			}
		}
	}

	sourceTemplate := r.URL.Query().Get("source")
	if sourceTemplate != "" {
		pageData["sourceTemplate"] = sourceTemplate
	}

	SortSearchResults(compositeModels, sortingMethod)

	pageData["SortingMethod"] = sortingMethod

	RenderTemplate(w, templateFile, pageData)
}

// Simple sorting function
func SortSearchResults(data []CompositeModel, method string) {

	switch method {
	case "year-ascending":
		sort.Slice(data, func(i, j int) bool {
			return data[i].Model.Year < data[j].Model.Year
		})
	case "year-descending":
		sort.Slice(data, func(i, j int) bool {
			return data[i].Model.Year > data[j].Model.Year
		})
	case "horsepower-ascending":
		sort.Slice(data, func(i, j int) bool {
			return data[i].Model.Specifications.Horsepower < data[j].Model.Specifications.Horsepower
		})
	case "horsepower-descending":
		sort.Slice(data, func(i, j int) bool {
			return data[i].Model.Specifications.Horsepower > data[j].Model.Specifications.Horsepower
		})
	case "A-to-Z":
		sort.Slice(data, func(i, j int) bool {
			return data[i].Model.Name < data[j].Model.Name
		})
	case "Z-to-A":
		sort.Slice(data, func(i, j int) bool {
			return data[i].Model.Name > data[j].Model.Name
		})
	default:
		// Do nothing
	}
}

func FetchDataFromEndpoints(endpoints []Endpoint, w http.ResponseWriter) (map[string]interface{}, error) {
	var wg sync.WaitGroup
	dataChannel := make(chan map[string]interface{})
	errChannel := make(chan error, 1)

	for _, endpoint := range endpoints {
		wg.Add(1)
		go FetchData(endpoint.URL, endpoint.Key, endpoint.Target, dataChannel, &wg)
	}

	go func() {
		wg.Wait()
		close(dataChannel)
		close(errChannel)
	}()

	data := make(map[string]interface{})
	for d := range dataChannel {
		for key, value := range d {
			data[key] = value
		}
	}

	select {
	case err := <-errChannel:
		if err != nil {
			http.Error(w, "failed to fetch data", http.StatusInternalServerError)
			return nil, err
		}
	default:
		// No error received
	}

	return data, nil
}

func RenderTemplate(w http.ResponseWriter, templateFile string, data interface{}) {
	tmpl, err := template.ParseFiles(templateFile)
	if err != nil {
		http.Error(w, "Error: Template not found. Missing template in: "+templateFile, http.StatusInternalServerError)
		return
	}

	var buf bytes.Buffer
	err = tmpl.Execute(&buf, data)
	if err != nil {
		http.Error(w, "Internal Server Error: superfluous response.WriteHeader call", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	buf.WriteTo(w)
}
