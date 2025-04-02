package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	_ "github.com/mattn/go-sqlite3"
)

var db *sql.DB

func main() {

	var err error

	mux := &CustomServeMux{}

	dbFile := "./db/database.db"

	// Check if the database file exists
	if _, err := os.Stat(dbFile); os.IsNotExist(err) {
		// Create the database file
		fmt.Println("Database file does not exist. Creating a new one...")
		os.Create(dbFile)
	}

	db, err = sql.Open("sqlite3", dbFile)
	if err != nil {
		log.Fatalf("Error opening database: %v", err)
	}
	defer db.Close()

	runSQLFile("./schema/schema.sql", db)

	mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("./static/"))))

	mux.HandleFunc("/", SessionMiddleware(mainPageHandler))
	mux.HandleFunc("/register", registerHandler)
	mux.HandleFunc("/login", loginHandler)
	mux.HandleFunc("/logout", Auth(logoutHandler))
	mux.HandleFunc("/category", SessionMiddleware(categoryHandler))

	mux.HandleFunc("/post", SessionMiddleware(showPostHandler))

	mux.HandleFunc("/createPost", Auth(newPostHandler))
	mux.HandleFunc("/createReview", Auth(newReviewHandler))
	mux.HandleFunc("/likePost", Auth(likePostHandler))
	mux.HandleFunc("/dislikePost", Auth(dislikePostHandler))
	mux.HandleFunc("/deletePost", Auth(deletePostHandler))
	mux.HandleFunc("/addBookOrCategory", Auth(addBookOrCategoryHandler))

	mux.HandleFunc("/comment", SessionMiddleware(addCommentHandler))
	mux.HandleFunc("/likeComment", Auth(likeCommentHandler))
	mux.HandleFunc("/dislikeComment", Auth(dislikeCommentHandler))
	mux.HandleFunc("/deleteComment", Auth(deleteCommentHandler))

	mux.HandleFunc("/profile", Auth(showProfileHandler))
	mux.HandleFunc("/editProfile", Auth(editProfileHandler))
	mux.HandleFunc("/deleteUser", Auth(deleteUserHandler))

	log.Println("Main server started on: 8080")
	if err := http.ListenAndServe(":8080", mux); err != nil {
		log.Fatalf("Error starting a main server: %v", err)
	}

}

func runSQLFile(filename string, db *sql.DB) error {

	data, err := os.ReadFile(filename)
	if err != nil {
		return fmt.Errorf("error reading SQL: %w", err)
	}

	_, err = db.Exec(string(data))
	if err != nil {
		return fmt.Errorf("error executing SQL commands: %w", err)
	}
	return nil
}
