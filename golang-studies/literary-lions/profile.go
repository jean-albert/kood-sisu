package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"golang.org/x/crypto/bcrypt"
)

func showProfileHandler(w http.ResponseWriter, r *http.Request) {

	pageData := make(map[string]interface{})

	userSession := r.Context().Value(sessionKey).(UserSession)
	pageData["Logged"] = true
	pageData["UserSession"] = userSession

	loc, err := time.LoadLocation("Europe/Helsinki")
	if err != nil {
		pageData["ErrMessage"] = err
		pageData["Message"] = "error with loading timezone"
		RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
		return
	}

	username := userSession.Username
	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		pageData["Message"] = "missing user ID"
		RenderTemplate(w, "error.html", pageData, http.StatusBadRequest)
		return
	}

	if r.Method == http.MethodPost {
		r.ParseForm()
		favoritedCategory := r.FormValue("favorite")

		if favoritedCategory == "false" {
			query := `UPDATE Users SET fav_category = NULL WHERE id = ?`
			_, err := db.Exec(query, userID)
			if err != nil {
				pageData["ErrMessage"] = err
				pageData["Message"] = "error clearing favorite category"
				RenderTemplate(w, "error.html", pageData, http.StatusBadRequest)
				return
			}

			pageData["Message"] = "Removed from favorites!"
		}
	} else if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	queryProfile := `SELECT u.id, u.username, u.bio, u.email, u.created_at, c.name AS CategoryName
	                 FROM Users u
					 LEFT JOIN Categories c ON u.fav_category = c.id
	                 WHERE u.id = ?`

	var profile User
	var favoriteCategory sql.NullString

	err = db.QueryRow(queryProfile, userID).Scan(&profile.ID, &profile.Username, &profile.Bio, &profile.Email, &profile.CreatedAt, &favoriteCategory)
	if err != nil {
		pageData["ErrMessage"] = "No user found"
		pageData["Message"] = "error querying profile"
		RenderTemplate(w, "error.html", pageData, http.StatusNotFound)
		return
	}

	if favoriteCategory.Valid {
		profile.FavoriteCategory = favoriteCategory
	}

	queryPosts := `SELECT id, username, title, like_count, dislike_count
	FROM PostSummary
	WHERE user_id = ?`

	rows, err := db.Query(queryPosts, userID)
	if err != nil {
		pageData["ErrMessage"] = err
		pageData["Message"] = "error querying posts:"
		RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var posts []Post
	for rows.Next() {
		var post Post
		var likes, dislikes sql.NullInt64

		if err := rows.Scan(&post.ID, &post.Username, &post.Title, &likes, &dislikes); err != nil {
			pageData["ErrMessage"] = err
			pageData["Message"] = "error scanning posts"
			RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
			return
		}
		if likes.Valid {
			likesValue := int(likes.Int64)
			post.Likes = likesValue
		}
		if dislikes.Valid {
			dislikesValue := int(dislikes.Int64)
			post.Dislikes = dislikesValue
		}

		posts = append(posts, post)
	}
	if err := rows.Err(); err != nil {
		pageData["ErrMessage"] = err
		pageData["Message"] = "error iterating rows"
		RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
		return
	}

	likedPostQuery := `SELECT p.id, p.title, p.like_count, p.dislike_count
                   FROM PostLikes pl
                   JOIN PostSummary p ON pl.post_id = p.id
                   WHERE pl.user_id = ? AND pl.like = TRUE`

	rows, err = db.Query(likedPostQuery, userID)
	if err != nil {
		pageData["ErrMessage"] = err
		pageData["Message"] = "error querying liked posts"
		RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var likedPosts []Post
	for rows.Next() {
		var post Post

		var likes, dislikes sql.NullInt64

		if err := rows.Scan(&post.ID, &post.Title, &likes, &dislikes); err != nil {
			pageData["ErrMessage"] = err
			pageData["Message"] = "error scanning liked posts"
			RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
			return
		}
		if likes.Valid {
			post.Likes = int(likes.Int64)
		}
		if dislikes.Valid {
			post.Dislikes = int(dislikes.Int64)
		}

		likedPosts = append(likedPosts, post)
	}
	if err := rows.Err(); err != nil {
		pageData["ErrMessage"] = err
		pageData["Message"] = "error iterating liked posts"
		RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
		return
	}

	profile.CreatedAt = profile.CreatedAt.In(loc)
	formattedCreatedAt := formatTimes(profile.CreatedAt)

	pageData["Profile"] = profile
	pageData["FormattedCreatedAt"] = formattedCreatedAt
	pageData["Username"] = username
	pageData["Posts"] = posts
	pageData["LikedPosts"] = likedPosts

	RenderTemplate(w, "profile.html", pageData, http.StatusOK)
}

func editProfileHandler(w http.ResponseWriter, r *http.Request) {

	pageData := make(map[string]interface{})

	userSession := r.Context().Value(sessionKey).(UserSession)
	pageData["Logged"] = true
	pageData["UserSession"] = userSession

	userID := r.URL.Query().Get("user_id")
	if r.Method == http.MethodGet {
		if userID == "" {
			pageData["Message"] = "missing post ID"
			RenderTemplate(w, "error.html", pageData, http.StatusBadRequest)
			return
		}

		var profile User
		err := db.QueryRow(`SELECT id, username, bio FROM Users WHERE id = ?`, userID).Scan(&profile.ID, &profile.Username, &profile.Bio)
		if err != nil {
			pageData["ErrMessage"] = err
			pageData["Message"] = "error retrieving profile"
			RenderTemplate(w, "error.html", pageData, http.StatusBadRequest)
			return
		}

		if profile.ID != userSession.UserID {
			pageData["ErrMessage"] = err
			pageData["Message"] = "you are not authorized to edit this profile"
			RenderTemplate(w, "error.html", pageData, http.StatusUnauthorized)
			return
		}

		pageData["Profile"] = profile
		pageData["Username"] = userSession.Username

		RenderTemplate(w, "editProfile.html", pageData, http.StatusOK)

	} else if r.Method == http.MethodPost {
		userID = r.FormValue("user_id")
		bio := r.FormValue("bio")
		currentPassword := r.FormValue("current_password")
		newPassword := r.FormValue("new_password")

		username := userSession.Username

		if userID == "" {
			pageData["Message"] = "missing user ID"
			RenderTemplate(w, "error.html", pageData, http.StatusBadRequest)
			return
		}

		var currentUserID int
		err := db.QueryRow(`SELECT id FROM Users WHERE username = ?`, username).Scan(&currentUserID)
		if err != nil {
			pageData["ErrMessage"] = err
			pageData["Message"] = "error retrieving user"
			RenderTemplate(w, "error.html", pageData, http.StatusNotFound)
			return
		}

		if userID != fmt.Sprintf("%d", currentUserID) {
			pageData["ErrMessage"] = err
			pageData["Message"] = "you are not authorized to edit this profile"
			RenderTemplate(w, "error.html", pageData, http.StatusUnauthorized)
			return
		}

		var currentHash string
		err = db.QueryRow(`SELECT password_hash FROM Users WHERE username = ?`, username).Scan(&currentHash)
		if err != nil {
			pageData["ErrMessage"] = err
			pageData["Message"] = "error retrieving password"
			RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
			return
		}

		err = bcrypt.CompareHashAndPassword([]byte(currentHash), []byte(currentPassword))
		if err != nil {
			pageData["ErrMessage"] = err
			pageData["Message"] = "Current password is incorrect"
			pageData["Profile"] = User{ID: userSession.UserID, Bio: bio}
			pageData["Username"] = username
			RenderTemplate(w, "editProfile.html", pageData, http.StatusForbidden)
			return
		}

		if newPassword != "" {
			err = checkPasswordCriteria(newPassword)
			if err != nil {
				pageData["ErrMessage"] = err
				pageData["Message"] = err.Error()
				pageData["Profile"] = User{ID: userSession.UserID, Bio: bio}
				pageData["Username"] = username
				RenderTemplate(w, "editProfile.html", pageData, http.StatusNotAcceptable)
				return
			}
		}

		tx, err := db.Begin()
		if err != nil {
			pageData["ErrMessage"] = err
			pageData["Message"] = "error starting profile update"
			RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
			return
		}

		defer func() {
			if p := recover(); p != nil {
				tx.Rollback()
				panic(p)
			}
		}()

		_, err = tx.Exec(`UPDATE Users SET bio = ? WHERE id = ?`, bio, userID)
		if err != nil {
			tx.Rollback()
			pageData["ErrMessage"] = err
			pageData["Message"] = "error updating your bio"
			RenderTemplate(w, "editProfile.html", pageData, http.StatusBadRequest)
			return
		}

		// Update user password
		if newPassword != "" {
			hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
			if err != nil {
				tx.Rollback()
				pageData["ErrMessage"] = err
				pageData["Message"] = "error hashing password"
				RenderTemplate(w, "editProfile.html", pageData, http.StatusInternalServerError)
				return
			}

			_, err = tx.Exec(`UPDATE Users SET password_hash = ? WHERE id = ?`, hash, userID)
			if err != nil {
				tx.Rollback()
				pageData["ErrMessage"] = err
				pageData["Message"] = "error updating your password"
				RenderTemplate(w, "editProfile.html", pageData, http.StatusBadRequest)
				return
			}
		}

		err = tx.Commit()
		if err != nil {
			pageData["ErrMessage"] = err
			pageData["Message"] = "error updating your profile"
			RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
			return
		}

		http.Redirect(w, r, fmt.Sprintf("/profile?user_id=%s", userID), http.StatusSeeOther)
	} else {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func deleteUserHandler(w http.ResponseWriter, r *http.Request) {

	pageData := make(map[string]interface{})

	userSession := r.Context().Value(sessionKey).(UserSession)
	pageData["Logged"] = true
	pageData["UserSession"] = userSession

	username := userSession.Username
	var userID int

	err := db.QueryRow(`SELECT id FROM Users WHERE username = ?`, username).Scan(&userID)
	if err != nil {
		pageData["ErrMessage"] = err
		pageData["Message"] = "error retrieving user"
		RenderTemplate(w, "error.html", pageData, http.StatusNotFound)
		return
	}

	if r.Method == http.MethodGet {
		userID := strconv.Itoa(userID)
		pageData["Profile"] = map[string]string{
			"Username": username,
			"UserID":   userID,
		}

		RenderTemplate(w, "deleteUser.html", pageData, http.StatusAccepted)
		return
	}

	if r.Method == http.MethodPost {

		password := r.FormValue("password")

		var hash string

		err := db.QueryRow(`SELECT password_hash FROM Users WHERE username = ?`, username).Scan(&hash)
		if err != nil {
			pageData["ErrMessage"] = err
			pageData["Message"] = "error authenticating your password"
			RenderTemplate(w, "error.html", pageData, http.StatusUnauthorized)
			return
		}

		err = bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
		if err != nil {
			pageData["ErrMessage"] = err
			pageData["Message"] = "Password is incorrect."
			pageData["Profile"] = map[string]string{
				"Username": username,
				"UserID":   strconv.Itoa(userID),
			}
			RenderTemplate(w, "deleteUser.html", pageData, http.StatusUnauthorized)
			return
		}

		tx, err := db.Begin()
		if err != nil {
			pageData["ErrMessage"] = err
			pageData["Message"] = "error starting profile update"
			RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
			return
		}

		defer func() {
			if p := recover(); p != nil {
				tx.Rollback()
				panic(p)
			}
		}()

		rows, err := tx.Query(`SELECT id FROM "Posts" WHERE "user_id" = ?`, userID)
		if err != nil {
			tx.Rollback()
			pageData["ErrMessage"] = err
			pageData["Message"] = "error retrieving your posts"
			RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		for rows.Next() {
			var postID string
			if err := rows.Scan(&postID); err != nil {
				tx.Rollback()
				pageData["ErrMessage"] = err
				pageData["Message"] = "error scanning your posts"
				RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
				return
			}

			if err := deletePost(w, r, tx, userSession, postID, true); err != nil {
				tx.Rollback()
				return
			}
		}

		rows, err = tx.Query(`SELECT id FROM "Comments" WHERE "user_id" = ? AND "post_id" NOT IN (SELECT id FROM "Posts" WHERE "user_id" = ?)`, userID, userID)
		if err != nil {
			tx.Rollback()
			pageData["ErrMessage"] = err
			pageData["Message"] = "error retrieving your comments"
			RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		for rows.Next() {
			var commentID string
			if err := rows.Scan(&commentID); err != nil {
				tx.Rollback()
				pageData["ErrMessage"] = err
				pageData["Message"] = "error scanning your comments"
				RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
				return
			}
			var postID string
			if err := rows.Scan(&postID); err != nil {
				tx.Rollback()
				pageData["ErrMessage"] = err
				pageData["Message"] = "error scanning your posts"
				RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
				return
			}

			r.Form.Set("comment_id", commentID)
			r.Form.Set("post_id", postID)
			if err := deleteComment(w, r, tx, userSession, true); err != nil {
				tx.Rollback()
				return
			}
		}

		_, err = tx.Exec(`DELETE FROM Users WHERE id = ?`, userID)
		if err != nil {
			tx.Rollback()
			pageData["ErrMessage"] = err
			pageData["Message"] = "error deleting your profile"
			RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
			return
		}

		err = tx.Commit()
		if err != nil {
			pageData["ErrMessage"] = err
			pageData["Message"] = "error finalizing your profile deletion"
			RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
			return
		}

		http.Redirect(w, r, "/logout", http.StatusSeeOther)
	}
}
