package main

import (
	"database/sql"
	"net/http"
	"time"
)

var sessions = map[string]UserSession{}

type contextKey string

var sessionKey = contextKey("userSession")

type CustomServeMux struct {
	http.ServeMux
}

type User struct {
	ID               int
	Email            string
	Username         string
	Bio              string
	Hash             string
	CreatedAt        time.Time
	FavoriteCategory sql.NullString
}

type Categories struct {
	ID   int
	Name string
}

type CategoryPosts struct {
	CategoryName string
	Posts        []Post
}

type Books struct {
	ID     int
	Name   string
	Author string
	Genre  string
}

type UserSession struct {
	UserID   int
	Username string
	Email    string
	Expiry   time.Time
}

type Post struct {
	ID                 int
	Username           string
	AuthorName         *string
	BookName           *string
	GenreName          *string
	CategoryName       string
	Score              *int
	AvgScore           *float64
	Title              string
	Content            string
	CreatedAt          time.Time
	CreatedAtFormatted string
	Likes              int
	Dislikes           int
	NetLikes           int
	Comments           []Comment
	CommentNum         int
}

type Comment struct {
	ID                 int
	Username           string
	UserID             int
	Content            string
	CreatedAt          time.Time
	CreatedAtFormatted string
	Likes              int
	Dislikes           int
}
