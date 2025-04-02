package main

import (
	"fmt"
	"net/http"
)

func addCommentHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userSession, ok := r.Context().Value(sessionKey).(UserSession)
	if !ok {
		http.Error(w, "You must be logged in to perform this action", http.StatusUnauthorized)
	}

	userID := userSession.UserID
	comment := r.FormValue("comment")
	postID := r.FormValue("id")

	if postID == "" || comment == "" {
		pageData := make(map[string]interface{})
		pageData["Message"] = "missing post ID or comment"
		RenderTemplate(w, "error.html", pageData, http.StatusBadRequest)
		return
	}

	_, err := db.Exec(`INSERT INTO Comments (post_id, user_id, content) VALUES (?, ?, ?)`, postID, userID, comment)
	if err != nil {
		pageData := make(map[string]interface{})
		pageData["ErrMessage"] = err
		pageData["Message"] = "error adding your comment"
		RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
		return
	}

	http.Redirect(w, r, fmt.Sprintf("/post?id=%s", postID), http.StatusSeeOther)
}

func likeCommentHandler(w http.ResponseWriter, r *http.Request) {
	rateContent(w, r, true, "comment")
}

func dislikeCommentHandler(w http.ResponseWriter, r *http.Request) {
	rateContent(w, r, false, "comment")
}

func deleteCommentHandler(w http.ResponseWriter, r *http.Request) {
	userSession, _ := r.Context().Value(sessionKey).(UserSession)

	tx, err := db.Begin()
	if err != nil {
		pageData := make(map[string]interface{})
		pageData["ErrMessage"] = err
		pageData["Message"] = "error deleting your comment"
		RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
		return
	}

	defer func() {
		if p := recover(); p != nil {
			tx.Rollback()
			panic(p)
		}
	}()

	err = deleteComment(w, r, tx, userSession, false)
	if err != nil {
		tx.Rollback()
		return
	}

	err = tx.Commit()
	if err != nil {
		pageData := make(map[string]interface{})
		pageData["ErrMessage"] = err
		pageData["Message"] = "error deleting your comment"
		RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
		return
	}
}
