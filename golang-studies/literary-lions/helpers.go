package main

import (
	"bytes"
	"database/sql"
	"fmt"
	"html/template"
	"os"
	"time"

	"net/http"
)

func RenderTemplate(w http.ResponseWriter, templateFile string, data interface{}, errorCode int) {
	var buf bytes.Buffer

	if w.Header().Get("X-Error-Handling") == "true" {
		http.Error(w, "Critical Server Error: Missing error page template", http.StatusInternalServerError)
		return
	}

	tpl, err := template.ParseFiles("templates/base.html", "templates/header.html", "templates/"+templateFile)
	if err != nil {
		if os.IsNotExist(err) {
			w.Header().Set("X-Error-Handling", "true")
			pageData := map[string]interface{}{
				"Message":    "page does not exist",
				"ErrMessage": "Missing template: " + templateFile,
			}
			RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
			return
		}
		http.Error(w, "Internal Server Error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	err = tpl.ExecuteTemplate(&buf, "base", data)
	if err != nil {
		http.Error(w, "Internal Server Error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(errorCode)
	buf.WriteTo(w)
}

func rateContent(w http.ResponseWriter, r *http.Request, like bool, contentType string) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userSession, ok := r.Context().Value(sessionKey).(UserSession)
	if !ok {
		http.Error(w, "You must be logged in to perform this action", http.StatusUnauthorized)
		return
	}
	userID := userSession.UserID

	var contentID, queryField, tableName string
	if contentType == "post" {
		contentID = r.FormValue("post_id")
		queryField = "post_id"
		tableName = "PostLikes"
	} else if contentType == "comment" {
		contentID = r.FormValue("comment_id")
		queryField = "comment_id"
		tableName = "CommentLikes"
	} else {
		pageData := make(map[string]interface{})
		pageData["Message"] = "invalid content type"
		RenderTemplate(w, "error.html", pageData, http.StatusBadRequest)
		return
	}

	if contentID == "" {
		pageData := make(map[string]interface{})
		pageData["Message"] = "missing content ID"
		RenderTemplate(w, "error.html", pageData, http.StatusBadRequest)
		return
	}

	if contentType == "comment" {
		postID := r.FormValue("post_id")
		if postID == "" {
			pageData := make(map[string]interface{})
			pageData["Message"] = "missing post ID"
			RenderTemplate(w, "error.html", pageData, http.StatusBadRequest)
			return
		}
	}

	var currentLikeValue sql.NullBool
	err := db.QueryRow(fmt.Sprintf(`SELECT "like" FROM "%s" WHERE "%s" = ? AND "user_id" = ?`, tableName, queryField), contentID, userID).Scan(&currentLikeValue)
	if err == sql.ErrNoRows {
		_, err = db.Exec(fmt.Sprintf(`INSERT INTO "%s" ("%s", "user_id", "like") VALUES (?, ?, ?)`, tableName, queryField), contentID, userID, like)
		if err != nil {
			pageData := make(map[string]interface{})
			pageData["ErrMessage"] = err
			pageData["Message"] = "error inserting like/dislike"
			RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
			return
		}
	} else if err == nil {
		if currentLikeValue.Valid && currentLikeValue.Bool == like {
			_, err = db.Exec(fmt.Sprintf(`DELETE FROM "%s" WHERE "%s" = ? AND "user_id" = ?`, tableName, queryField), contentID, userID)
			if err != nil {
				pageData := make(map[string]interface{})
				pageData["ErrMessage"] = err
				pageData["Message"] = "error deleting like/dislike"
				RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
				return
			}
		} else {
			_, err = db.Exec(fmt.Sprintf(`UPDATE "%s" SET "like" = ? WHERE "%s" = ? AND "user_id" = ?`, tableName, queryField), like, contentID, userID)
			if err != nil {
				pageData := make(map[string]interface{})
				pageData["ErrMessage"] = err
				pageData["Message"] = "error updating like/dislike"
				RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
				return
			}
		}
	} else {
		pageData := make(map[string]interface{})
		pageData["ErrMessage"] = err
		pageData["Message"] = "error checking like/dislike"
		RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
		return
	}

	http.Redirect(w, r, fmt.Sprintf("/post?id=%s", r.FormValue("post_id")), http.StatusSeeOther)
}

func deleteComment(w http.ResponseWriter, r *http.Request, tx *sql.Tx, userSession UserSession, bypassRedirect bool) error {
	userID := userSession.UserID
	postID := r.FormValue("post_id")
	commentID := r.FormValue("comment_id")

	if postID == "" || commentID == "" {
		pageData := make(map[string]interface{})
		err := fmt.Errorf("missing post or comment ID")
		pageData["Message"] = "missing post or comment ID"
		RenderTemplate(w, "error.html", pageData, http.StatusBadRequest)
		return err
	}

	var commenterID int
	err := db.QueryRow(`SELECT user_id FROM "Comments" WHERE "id" = ?`, commentID).Scan(&commenterID)
	if err != nil {
		if err == sql.ErrNoRows {
			pageData := make(map[string]interface{})
			pageData["ErrMessage"] = err
			pageData["Message"] = "comment not found"
			RenderTemplate(w, "error.html", pageData, http.StatusBadRequest)
		} else {
			pageData := make(map[string]interface{})
			pageData["ErrMessage"] = err
			pageData["Message"] = "error querying comment"
			RenderTemplate(w, "error.html", pageData, http.StatusBadRequest)
		}
		return err
	}

	if userID != commenterID {
		var postAuthorID int
		err = db.QueryRow(`SELECT user_id FROM "Posts" WHERE "id" = ?`, postID).Scan(&postAuthorID)
		if err != nil {
			pageData := make(map[string]interface{})
			pageData["ErrMessage"] = err
			pageData["Message"] = "error querying post"
			RenderTemplate(w, "error.html", pageData, http.StatusBadRequest)
			return err
		}
		if userID != postAuthorID {
			pageData := make(map[string]interface{})
			pageData["ErrMessage"] = err
			pageData["Message"] = "you are not allowed to delete that comment"
			RenderTemplate(w, "error.html", pageData, http.StatusUnauthorized)
			return err
		}
	}

	_, err = tx.Exec(`DELETE FROM "Comments" WHERE "id" = ?`, commentID)
	if err != nil {
		pageData := make(map[string]interface{})
		pageData["ErrMessage"] = err
		pageData["Message"] = "error deleting comment"
		RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
		return err
	}

	_, err = tx.Exec(`DELETE FROM "CommentLikes" WHERE "comment_id" = ?`, commentID)
	if err != nil {
		pageData := make(map[string]interface{})
		pageData["ErrMessage"] = err
		pageData["Message"] = "error deleting comment likes"
		RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
		return err
	}

	_, err = tx.Exec(`DELETE FROM "CommentLikes" WHERE "user_id" = ? AND comment_id = ?`, userID, commentID)
	if err != nil {
		pageData := make(map[string]interface{})
		pageData["ErrMessage"] = err
		pageData["Message"] = "error deleting comment likes"
		RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
		return err
	}

	if !bypassRedirect {
		http.Redirect(w, r, fmt.Sprintf("/post?id=%s", postID), http.StatusSeeOther)
	}

	return nil
}

func deletePost(w http.ResponseWriter, r *http.Request, tx *sql.Tx, userSession UserSession, postID string, bypassRedirect bool) error {
	var postAuthorID int
	err := db.QueryRow(`SELECT user_id FROM "Posts" WHERE "id" = ?`, postID).Scan(&postAuthorID)
	if err == sql.ErrNoRows {
		pageData := make(map[string]interface{})
		pageData["ErrMessage"] = err
		pageData["Message"] = "post not found"
		RenderTemplate(w, "error.html", pageData, http.StatusNotFound)
		return err
	} else if err != nil {
		pageData := make(map[string]interface{})
		pageData["ErrMessage"] = err
		pageData["Message"] = "error querying post"
		RenderTemplate(w, "error.html", pageData, http.StatusBadRequest)
		return err
	}

	rows, err := tx.Query(`SELECT id FROM "Comments" WHERE "post_id" = ?`, postID)
	if err != nil {
		pageData := make(map[string]interface{})
		pageData["ErrMessage"] = err
		pageData["Message"] = "error retrieving comments"
		RenderTemplate(w, "error.html", pageData, http.StatusBadRequest)
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var commentID string
		if err := rows.Scan(&commentID); err != nil {
			return err
		}

		r.ParseForm()

		r.Form.Set("comment_id", commentID)
		r.Form.Set("post_id", postID)
		if err := deleteComment(w, r, tx, userSession, true); err != nil {
			return err
		}
	}

	_, err = tx.Exec(`DELETE FROM "PostLikes" WHERE "post_id" = ?`, postID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(`DELETE FROM "PostLikes" WHERE "user_id" = ?`, userSession.UserID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(`DELETE FROM "Posts" WHERE "id" = ?`, postID)
	if err != nil {
		return err
	}

	if !bypassRedirect {
		http.Redirect(w, r, "/posts", http.StatusSeeOther)
	}

	return nil
}

func ordinalSuffix(day int) string {
	switch day {
	case 1, 21, 31:
		return "st"
	case 2, 22:
		return "nd"
	case 3, 23:
		return "rd"
	default:
		return "th"
	}
}

func formatTimes(t time.Time) string {
	day := t.Day()
	dayWithSuffix := fmt.Sprintf("%d%s", day, ordinalSuffix(day))

	return fmt.Sprintf("%s of %s %d, %02d:%02d",
		dayWithSuffix,
		t.Format("January"),
		t.Year(),
		t.Hour(),
		t.Minute(),
	)
}

func (mux *CustomServeMux) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	_, pattern := mux.Handler(r)

	if r.URL.Path == "/favicon.ico" {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	if pattern == "" || (pattern == "/" && r.URL.Path != "/") {
		pageData := map[string]interface{}{
			"Message":    "that page does not exist",
			"ErrMessage": "Unregistered handler",
		}
		RenderTemplate(w, "error.html", pageData, http.StatusNotFound)
		return
	}
	mux.ServeMux.ServeHTTP(w, r)
}
