package main

import (
	"database/sql"
	"fmt"
	"math"
	"net/http"
	"time"
)

func showPostHandler(w http.ResponseWriter, r *http.Request) {

	pageData := make(map[string]interface{})

	if userSession, ok := r.Context().Value(sessionKey).(UserSession); ok {
		pageData["Logged"] = true
		pageData["UserSession"] = userSession
	} else {
		pageData["Logged"] = false
	}

	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get the post ID from the URL query parameters
	postID := r.URL.Query().Get("id")
	if postID == "" {
		pageData := make(map[string]interface{})
		pageData["Message"] = "missing post ID"
		RenderTemplate(w, "error.html", pageData, http.StatusBadRequest)
		return
	}

	// Query the post summary
	queryPostSummary := `SELECT p.id, p.username, p.author_name, p.book_name, p.genre_name, p.title, p.content, 
						p.created_at, p.like_count, p.dislike_count, p.score, p.avg_score, c.name AS CategoryName
						FROM PostSummary p
						JOIN Categories c ON p.category_id = c.id
						WHERE p.id = ?`

	var post Post
	loc, err := time.LoadLocation("Europe/Helsinki")
	if err != nil {
		pageData["ErrMessage"] = err
		pageData["Message"] = "error loading location"
		RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
		return
	}

	var authorName, bookName, genreName sql.NullString
	var likes, dislikes, score sql.NullInt64
	var avgScore sql.NullFloat64

	err = db.QueryRow(queryPostSummary, postID).Scan(&post.ID, &post.Username, &authorName, &bookName, &genreName, &post.Title, &post.Content, &post.CreatedAt, &likes, &dislikes, &score, &avgScore, &post.CategoryName)
	if err != nil {
		pageData["ErrMessage"] = "It might have been deleted"
		pageData["Message"] = "that post doesn't exist"
		RenderTemplate(w, "error.html", pageData, http.StatusNotFound)
		return
	}

	post.CreatedAt = post.CreatedAt.In(loc)

	// Handle nullable fields
	if authorName.Valid {
		post.AuthorName = &authorName.String
	}
	if bookName.Valid {
		post.BookName = &bookName.String
	}
	if genreName.Valid {
		post.GenreName = &genreName.String
	}
	if likes.Valid {
		post.Likes = int(likes.Int64)
	}
	if dislikes.Valid {
		post.Dislikes = int(dislikes.Int64)
	}
	if score.Valid {
		scoreValue := int(score.Int64)
		post.Score = &scoreValue
	} else {
		post.Score = nil
	}
	if avgScore.Valid {
		avgScoreValue := math.Round(avgScore.Float64*100) / 100
		post.AvgScore = &avgScoreValue
	} else {
		post.AvgScore = nil
	}

	// Query the comments
	queryComments := `SELECT cs.id, cs.username, cs.content, cs.created_at, cs.like_count, cs.dislike_count, c.user_id AS UserID
					  FROM CommentSummary cs
					  JOIN Comments c ON cs.id = c.id
					  WHERE cs.post_id = ?`

	rows, err := db.Query(queryComments, postID)
	if err != nil {
		pageData["ErrMessage"] = err
		pageData["Message"] = "error querying comments"
		RenderTemplate(w, "error.html", pageData, http.StatusBadRequest)
		return
	}
	defer rows.Close()

	var comments []Comment
	for rows.Next() {
		var comment Comment

		loc, err := time.LoadLocation("Europe/Helsinki")
		if err != nil {
			pageData["ErrMessage"] = err
			pageData["Message"] = "error loading location"
			RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
			return
		}

		if err := rows.Scan(&comment.ID, &comment.Username, &comment.Content, &comment.CreatedAt, &comment.Likes, &comment.Dislikes, &comment.UserID); err != nil {
			pageData["ErrMessage"] = err
			pageData["Message"] = "error scanning comments"
			RenderTemplate(w, "error.html", pageData, http.StatusBadRequest)
			return
		}

		comment.CreatedAt = comment.CreatedAt.In(loc)
		comment.CreatedAtFormatted = formatTimes(comment.CreatedAt)

		comments = append(comments, comment)
	}

	queryPoster := `SELECT id FROM Users WHERE username = ?`

	var user User
	err = db.QueryRow(queryPoster, post.Username).Scan(&user.ID)
	if err != nil {
		pageData["ErrMessage"] = err
		pageData["Message"] = "error querying user"
		RenderTemplate(w, "error.html", pageData, http.StatusNotFound)
		return
	}

	if _, ok := r.Context().Value(sessionKey).(UserSession); ok {
		pageData["Logged"] = true
	} else {
		pageData["Logged"] = false
	}

	post.CreatedAt = post.CreatedAt.In(loc)
	formattedCreatedAt := formatTimes(post.CreatedAt)

	pageData["FormattedCreatedAt"] = formattedCreatedAt
	pageData["Post"] = post
	pageData["Comments"] = comments
	pageData["User"] = user

	RenderTemplate(w, "post.html", pageData, http.StatusOK)
}

func likePostHandler(w http.ResponseWriter, r *http.Request) {
	rateContent(w, r, true, "post")
}

func dislikePostHandler(w http.ResponseWriter, r *http.Request) {
	rateContent(w, r, false, "post")
}

func deletePostHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userSession, _ := r.Context().Value(sessionKey).(UserSession)

	userID := userSession.UserID
	postID := r.FormValue("post_id")
	if postID == "" {
		pageData := make(map[string]interface{})
		pageData["Message"] = "missing post ID"
		RenderTemplate(w, "error.html", pageData, http.StatusBadRequest)
		return
	}

	var postAuthorID int
	err := db.QueryRow(`SELECT user_id FROM "Posts" WHERE "id" = ?`, postID).Scan(&postAuthorID)
	if err == sql.ErrNoRows {
		pageData := make(map[string]interface{})
		pageData["ErrMessage"] = err
		pageData["Message"] = "post not found"
		RenderTemplate(w, "error.html", pageData, http.StatusBadRequest)
		return
	} else if err != nil {
		pageData := make(map[string]interface{})
		pageData["ErrMessage"] = err
		pageData["Message"] = "error querying post: Post not found"
		RenderTemplate(w, "error.html", pageData, http.StatusBadRequest)
		return
	}

	if userID != postAuthorID {
		pageData := make(map[string]interface{})
		pageData["ErrMessage"] = err
		pageData["Message"] = "Unauthorized to delete this post"
		RenderTemplate(w, "error.html", pageData, http.StatusUnauthorized)
		return
	}

	tx, err := db.Begin()
	if err != nil {
		pageData := make(map[string]interface{})
		pageData["ErrMessage"] = err
		pageData["Message"] = "error starting post deletion"
		RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
		return
	}

	defer func() {
		if p := recover(); p != nil {
			tx.Rollback()
			panic(p)
		}
	}()

	rows, err := tx.Query(`SELECT id FROM "Comments" WHERE "post_id" = ?`, postID)
	if err != nil {
		tx.Rollback()
		pageData := make(map[string]interface{})
		pageData["ErrMessage"] = err
		pageData["Message"] = "error retrieving comments"
		RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var commentID string
		if err := rows.Scan(&commentID); err != nil {
			tx.Rollback()
			pageData := make(map[string]interface{})
			pageData["ErrMessage"] = err
			pageData["Message"] = "error scanning comments"
			RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
			return
		}

		r.Form.Set("comment_id", commentID)
		if err := deleteComment(w, r, tx, userSession, true); err != nil {
			tx.Rollback()
			return
		}
	}

	_, err = tx.Exec(`DELETE FROM "PostLikes" WHERE "post_id" = ?`, postID)
	if err != nil {
		tx.Rollback()
		pageData := make(map[string]interface{})
		pageData["ErrMessage"] = err
		pageData["Message"] = "error deleting post likes"
		RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
		return
	}

	_, err = tx.Exec(`DELETE FROM "Posts" WHERE "id" = ?`, postID)
	if err != nil {
		tx.Rollback()
		pageData := make(map[string]interface{})
		pageData["ErrMessage"] = err
		pageData["Message"] = "error deleting post"
		RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
		return
	}

	err = tx.Commit()
	if err != nil {
		pageData := make(map[string]interface{})
		pageData["ErrMessage"] = err
		pageData["Message"] = "error committing deletion"
		RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
		return
	}

	http.Redirect(w, r, fmt.Sprintf("/profile?user_id=%d", userID), http.StatusSeeOther)
}
