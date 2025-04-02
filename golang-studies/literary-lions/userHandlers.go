package main

import (
	"crypto/rand"
	"errors"
	"fmt"
	"net/http"
	"time"

	_ "github.com/mattn/go-sqlite3"
	"golang.org/x/crypto/bcrypt"
)

func registerHandler(w http.ResponseWriter, r *http.Request) {

	pageData := make(map[string]interface{})

	if r.Method == http.MethodGet {
		RenderTemplate(w, "register.html", nil, http.StatusOK)
	}

	if r.Method == http.MethodPost {
		r.ParseForm()

		email := r.FormValue("email")
		username := r.FormValue("username")
		password := r.FormValue("password")

		if err := checkUserExists(username, email); err != nil {
			pageData["ErrMessage"] = err
			pageData["Message"] = err.Error()
			RenderTemplate(w, "register.html", pageData, http.StatusBadRequest)
			return
		}

		if err := validateRegistrationInput(username, password); err != nil {
			pageData["ErrMessage"] = err
			pageData["Message"] = err.Error()
			RenderTemplate(w, "register.html", pageData, http.StatusBadRequest)
			return
		}

		if err := createUser(username, password, email); err != nil {
			pageData["ErrMessage"] = err
			pageData["Message"] = "Sorry, there was a problem registering your account."
			RenderTemplate(w, "register.html", pageData, http.StatusBadRequest)
			return
		}

		pageData["Message"] = "Your account has been created successfully"
		pageData["Success"] = true
		RenderTemplate(w, "register.html", pageData, http.StatusOK)
	}
}

func loginHandler(w http.ResponseWriter, r *http.Request) {

	pageData := make(map[string]interface{})

	switch r.Method {
	case http.MethodGet:
		redirectURL := r.URL.Query().Get("redirect")
		if redirectURL == "" {
			redirectURL = "/"
		}
		pageData["RedirectURL"] = redirectURL
		RenderTemplate(w, "login.html", pageData, http.StatusOK)
	case http.MethodPost:
		if err := handleLoginPost(w, r); err != nil {
			pageData["Message"] = err.Error()
			RenderTemplate(w, "login.html", pageData, http.StatusBadRequest)
		}
	default:
		http.Error(w, "Method not allowed: "+r.Method, http.StatusMethodNotAllowed)
	}
}

func handleLoginPost(w http.ResponseWriter, r *http.Request) error {

	if err := r.ParseForm(); err != nil {
		return fmt.Errorf("error parsing form: %v", err)
	}

	email := r.FormValue("email")
	password := r.FormValue("password")

	user, err := getUserByEmail(email)
	if err != nil {
		return errors.New("no account associated with that email")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Hash), []byte(password)); err != nil {
		return errors.New("check email and password, and try again")
	}

	_, err = createOrRefreshSession(w, user, "")
	if err != nil {
		return errors.New("failed to create or refresh session")
	}

	redirectURL := r.FormValue("redirect")
	if redirectURL == "" {
		redirectURL = "/"
	}
	http.Redirect(w, r, redirectURL, http.StatusFound)
	return nil
}

func logoutHandler(w http.ResponseWriter, r *http.Request) {

	c, err := r.Cookie("session_token")
	if err != nil {
		pageData := make(map[string]interface{})
		pageData["ErrMessage"] = err
		pageData["Message"] = "error reading cookies"
		RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
		return
	}

	sessionToken := c.Value
	delete(sessions, sessionToken)

	http.SetCookie(w, &http.Cookie{
		Name:    "session_token",
		Value:   "",
		Expires: time.Now(),
	})

	http.Redirect(w, r, "/", http.StatusFound)
}

func createUser(username, password, email string) error {

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	_, err = db.Exec("INSERT INTO Users (username, password_hash, email, created_at, bio) VALUES (?, ?, ?, ?, ?);", username, hash, email, time.Now(), "")
	return err
}

func getUserByEmail(email string) (*User, error) {

	stmt := "SELECT id, username, password_hash FROM Users WHERE email = ?"
	row := db.QueryRow(stmt, email)

	var u User
	if err := row.Scan(&u.ID, &u.Username, &u.Hash); err != nil {
		return nil, fmt.Errorf("error retrieving user: %v", err)
	}

	return &u, nil
}

func createOrRefreshSession(w http.ResponseWriter, user *User, existingToken string) (string, error) {

	var sessionToken string
	var expiresAt time.Time
	var err error

	if existingToken != "" {
		sessionToken = existingToken
	} else {
		sessionToken, err = generateUUID()
		if err != nil {
			return "", fmt.Errorf("failed to create seassion: %w", err)
		}
	}

	expiresAt = time.Now().Add(15 * time.Minute)

	sessions[sessionToken] = UserSession{
		Username: user.Username,
		UserID:   user.ID,
		Email:    user.Email,
		Expiry:   expiresAt,
	}

	http.SetCookie(w, &http.Cookie{
		Name:    "session_token",
		Value:   sessionToken,
		Expires: expiresAt,
	})

	return sessionToken, nil
}

func generateUUID() (string, error) {

	b := make([]byte, 16)
	_, err := rand.Read(b)
	if err != nil {
		return "", fmt.Errorf("failed to generate random bytes: %w", err)
	}

	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80

	uuid := fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
	return uuid, nil
}
