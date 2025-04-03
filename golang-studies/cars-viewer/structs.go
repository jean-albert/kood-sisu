package main

type Manufacturer struct {
	ID           int    `json:"id"`
	Name         string `json:"name"`
	Country      string `json:"country"`
	FoundingYear int    `json:"foundingYear"`
}

type Category struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type Model struct {
	ID             int            `json:"id"`
	Name           string         `json:"name"`
	Manufacturer   int            `json:"manufacturerID"`
	Category       int            `json:"categoryID"`
	Year           string         `json:"year"`
	Specifications Specifications `json:"specifications"`
	Image          string         `json:"image"`
}

type Specifications struct {
	Engine       string `json:"engine"`
	Horsepower   int    `json:"horsepower"`
	Transmission string `json:"transmission"`
	Drivetrain   string `json:"drivetrain"`
}

type CompositeModel struct {
	Model        Model
	Manufacturer Manufacturer
	Category     Category
}

type Endpoint struct {
	URL    string
	Key    string
	Target interface{}
}

var commonEndpoints = []Endpoint{
	{"http://localhost:3000/api/manufacturers", "Manufacturers", &[]Manufacturer{}},
	{"http://localhost:3000/api/categories", "Categories", &[]Category{}},
	{"http://localhost:3000/api/models", "Models", &[]Model{}},
}

type HandlerConfig struct {
	Method       string
	TemplateFile string
	ProcessModel bool
	Message      string
	Endpoints    []Endpoint
}
