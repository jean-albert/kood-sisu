package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"time"
)

func categoryHandler(w http.ResponseWriter, r *http.Request) {
	pageData := make(map[string]interface{})

	if userSession, ok := r.Context().Value(sessionKey).(UserSession); ok {
		pageData["Logged"] = true
		pageData["UserSession"] = userSession
	} else {
		pageData["Logged"] = false
	}

	catName := r.URL.Query().Get("category_name")
	var categoryID int
	err := db.QueryRow(`SELECT id FROM Categories WHERE name = ?`, catName).Scan(&categoryID)
	if err != nil {
		pageData["ErrMessage"] = err
		pageData["Message"] = "error querying category ID"
		RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
		return
	}
	pageData["Category"] = catName

	if r.Method == http.MethodGet || r.Method == http.MethodPost {

		sortOption := r.URL.Query().Get("sort")
		if sortOption == "" {
			sortOption = "recent"
		}

		var orderByClause string
		switch sortOption {
		case "recent":
			orderByClause = "p.created_at DESC"
		case "recent_comment":
			orderByClause = "p.last_commented_at DESC"
		case "most_liked":
			orderByClause = "p.net_likes DESC"
		default:
			orderByClause = "p.created_at DESC"
		}

		searchword := r.URL.Query().Get("search")
		pageData["SearchTerm"] = searchword

		searchword = "%" + searchword + "%"

		var query string
		var args []interface{}

		if searchword != "%%" {
			query = fmt.Sprintf(`
                SELECT 
                p.id, p.username, p.title, p.created_at, p.like_count, p.dislike_count, p.net_likes, c.name AS CategoryName
                FROM PostSummary p
                JOIN Categories c ON p.category_id = c.id
                WHERE p.category_id = ?
                AND (p.title LIKE ? OR p.content LIKE ? OR p.book_name LIKE ? OR p.author_name LIKE ? OR p.genre_name LIKE ?)
                ORDER BY %s`, orderByClause)

			args = append(args, categoryID, searchword, searchword, searchword, searchword, searchword)
		} else {
			query = fmt.Sprintf(`
                SELECT 
                p.id, p.username, p.title, p.created_at, p.like_count, p.dislike_count, p.net_likes, c.name AS CategoryName
                FROM PostSummary p
                JOIN Categories c ON p.category_id = c.id
                WHERE p.category_id = ?
                ORDER BY %s`, orderByClause)

			args = append(args, categoryID)
		}

		rows, err := db.Query(query, args...)
		if err != nil {
			pageData["ErrMessage"] = err
			pageData["Message"] = "error querying posts"
			RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var posts []Post
		for rows.Next() {
			var post Post
			loc, err := time.LoadLocation("Europe/Helsinki")
			if err != nil {
				pageData["ErrMessage"] = err
				pageData["Message"] = "error with loading timezone"
				RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
				return
			}
			var likes, dislikes, netLikes sql.NullInt64

			if err := rows.Scan(&post.ID, &post.Username, &post.Title, &post.CreatedAt, &likes, &dislikes, &netLikes, &post.CategoryName); err != nil {
				pageData["ErrMessage"] = err
				pageData["Message"] = "error scanning rows"
				RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
				return
			}
			if likes.Valid {
				post.Likes = int(likes.Int64)
			}
			if dislikes.Valid {
				post.Dislikes = int(dislikes.Int64)
			}
			if netLikes.Valid {
				post.NetLikes = int(netLikes.Int64)
			}

			err = db.QueryRow(`SELECT COUNT(id) FROM CommentSummary WHERE post_id = ?`, post.ID).Scan(&post.CommentNum)
			if err != nil {
				pageData["ErrMessage"] = err
				pageData["Message"] = "error counting comments"
				RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
				return
			}

			post.CreatedAt = post.CreatedAt.In(loc)
			post.CreatedAtFormatted = formatTimes(post.CreatedAt)

			posts = append(posts, post)
		}
		if err := rows.Err(); err != nil {
			pageData["ErrMessage"] = err
			pageData["Message"] = "error iterating rows"
			RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
			return
		}

		pageData["Posts"] = posts

		if r.Method == http.MethodPost {
			favoritedCategory := r.FormValue("favorite")

			if userSession, ok := r.Context().Value(sessionKey).(UserSession); ok {
				userID := userSession.UserID

				if favoritedCategory == "true" {
					query = `UPDATE Users SET fav_category = ? WHERE id = ?`
					_, err := db.Exec(query, categoryID, userID)
					if err != nil {
						pageData["ErrMessage"] = err
						pageData["Message"] = "error updating favorite category"
						RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
						return
					}
					pageData["Message"] = "Added to favorites!"
				}
			}
		}

		// Render the posts template
		RenderTemplate(w, "category.html", pageData, http.StatusOK)
	}
}
