package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"sort"
	"strings"
	"time"
)

func mainPageHandler(w http.ResponseWriter, r *http.Request) {
	pageData := make(map[string]interface{})

	sortOption := r.URL.Query().Get("sort")
	if sortOption == "" {
		sortOption = "recent"
	}

	var userSession UserSession
	var favoriteCategory sql.NullInt64
	var err error

	categories, err := queryCategories()
	if err != nil {
		pageData["ErrMessage"] = err
		pageData["Message"] = "error retrieving categories"
		RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
		return
	}

	pageData["Categories"] = categories
	if session, ok := r.Context().Value(sessionKey).(UserSession); ok {
		userSession = session
		pageData["Logged"] = true
		pageData["UserSession"] = userSession

		err = db.QueryRow(`SELECT fav_category FROM Users WHERE id = ?`, userSession.UserID).Scan(&favoriteCategory)
		if err != nil && err != sql.ErrNoRows {
			pageData["ErrMessage"] = err
			pageData["Message"] = "error retrieving favorite category"
			RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
			return
		}
	} else {
		pageData["Logged"] = false
	}

	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
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

	var query string
	if favoriteCategory.Valid {
		query = fmt.Sprintf(`
		WITH LatestPosts AS (
			SELECT 
				p.id, p.username, p.title, p.created_at, p.last_commented_at, p.like_count, p.dislike_count, p.net_likes, c.name AS CategoryName, p.category_id,
				ROW_NUMBER() OVER (PARTITION BY p.category_id ORDER BY %s) AS row_num
			FROM PostSummary p
			JOIN Categories c ON p.category_id = c.id
		),
		FavoriteCategory AS (
			SELECT 
				id, username, title, created_at, like_count, dislike_count, net_likes, CategoryName
			FROM LatestPosts
			WHERE row_num <= 3 
			AND category_id = ?
		),
		OtherCategories AS (
			SELECT 
				id, username, title, created_at, like_count, dislike_count, net_likes, CategoryName
			FROM LatestPosts
			WHERE row_num <= 3 
			AND category_id != ?
		)
		SELECT id, username, title, created_at, like_count, dislike_count, net_likes, CategoryName FROM FavoriteCategory
		UNION ALL
		SELECT id, username, title, created_at, like_count, dislike_count, net_likes, CategoryName FROM OtherCategories;`, orderByClause)
	} else {
		query = fmt.Sprintf(`
		WITH LatestPosts AS (
			SELECT 
				p.id, p.username, p.title, p.created_at, p.last_commented_at, p.like_count, p.dislike_count, p.net_likes, c.name AS CategoryName, p.category_id,
				ROW_NUMBER() OVER (PARTITION BY p.category_id ORDER BY %s) AS row_num
			FROM PostSummary p
			JOIN Categories c ON p.category_id = c.id
		)
		SELECT id, username, title, created_at, like_count, dislike_count, net_likes, CategoryName FROM LatestPosts
		WHERE row_num <= 3;`, orderByClause)
	}

	var rows *sql.Rows
	if favoriteCategory.Valid {
		rows, err = db.Query(query, favoriteCategory.Int64, favoriteCategory.Int64)
	} else {
		rows, err = db.Query(query)
	}
	if err != nil {
		pageData["ErrMessage"] = err
		pageData["Message"] = "error querying recent posts"
		RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	postsByCategory := make(map[string][]Post)

	for rows.Next() {
		var post Post
		var likes, dislikes, netLikes sql.NullInt64

		if err := rows.Scan(&post.ID, &post.Username, &post.Title, &post.CreatedAt, &likes, &dislikes, &netLikes, &post.CategoryName); err != nil {
			pageData["ErrMessage"] = err
			pageData["Message"] = "error scanning posts"
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

		loc, err := time.LoadLocation("Europe/Helsinki")
		if err != nil {
			pageData["ErrMessage"] = err
			pageData["Message"] = "error with loading timezone"
			RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
			return
		}
		post.CreatedAt = post.CreatedAt.In(loc)

		err = db.QueryRow(`SELECT COUNT(id) FROM CommentSummary WHERE post_id = ?`, post.ID).Scan(&post.CommentNum)
		if err != nil {
			pageData["ErrMessage"] = err
			pageData["Message"] = "error counting comments"
			RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
			return
		}

		post.CreatedAtFormatted = formatTimes(post.CreatedAt)
		postsByCategory[post.CategoryName] = append(postsByCategory[post.CategoryName], post)
	}

	if err := rows.Err(); err != nil {
		pageData["ErrMessage"] = err
		pageData["Message"] = "error iterating rows"
		RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
		return
	}

	var orderedCategories []CategoryPosts

	var favoriteCategoryName string
	if favoriteCategory.Valid {
		err := db.QueryRow(`SELECT name FROM Categories WHERE id = ?`, favoriteCategory.Int64).Scan(&favoriteCategoryName)
		if err != nil {
			pageData["ErrMessage"] = err
			pageData["Message"] = "error retrieving favorite category name"
			RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
			return
		}

		if favoritePosts, exists := postsByCategory[favoriteCategoryName]; exists {
			orderedCategories = append(orderedCategories, CategoryPosts{CategoryName: favoriteCategoryName, Posts: favoritePosts})
			delete(postsByCategory, favoriteCategoryName)
			pageData["FavoriteCategory"] = favoriteCategoryName
		} else {
			orderedCategories = append(orderedCategories, CategoryPosts{CategoryName: favoriteCategoryName, Posts: nil})
		}
	}

	remainingCategories := make([]string, 0, len(postsByCategory))
	for category := range postsByCategory {
		remainingCategories = append(remainingCategories, category)
	}

	sort.Strings(remainingCategories)

	for _, category := range remainingCategories {
		orderedCategories = append(orderedCategories, CategoryPosts{CategoryName: category, Posts: postsByCategory[category]})
	}

	pageData["PostsByCategory"] = orderedCategories

	RenderTemplate(w, "index.html", pageData, http.StatusOK)
}

func newPostHandler(w http.ResponseWriter, r *http.Request) {
	pageData := make(map[string]interface{})
	userSession := r.Context().Value(sessionKey).(UserSession)
	pageData["UserSession"] = userSession
	pageData["Logged"] = true

	categories, err := queryCategories()
	if err != nil {
		pageData["ErrMessage"] = err
		pageData["Message"] = "error retrieving categories"
		RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
		return
	}
	pageData["Categories"] = categories

	if r.Method == http.MethodGet {
		RenderTemplate(w, "createPost.html", pageData, http.StatusOK)
		return
	}

	if r.Method == http.MethodPost {

		userID := userSession.UserID
		title := r.FormValue("title")
		content := r.FormValue("content")
		category := r.FormValue("category")

		if title == "" || content == "" || category == "" {
			pageData["Message"] = "all fields are required"
			RenderTemplate(w, "createPost.html", pageData, http.StatusBadRequest)
			return
		}

		if strings.TrimSpace(content) == "" {
			pageData["Message"] = "content cannot be empty or only contain spaces"
			RenderTemplate(w, "createPost.html", pageData, http.StatusBadRequest)
			return
		}

		var categoryID int
		err = db.QueryRow(`SELECT id FROM Categories WHERE name = ?`, category).Scan(&categoryID)
		if err != nil {
			pageData["ErrMessage"] = fmt.Sprintf("%v: %s\n", err, category)
			pageData["Message"] = "error retrieving category"
			RenderTemplate(w, "createPost.html", pageData, http.StatusBadRequest)
			return
		}

		_, err = db.Exec(`INSERT INTO Posts (user_id, category_id, title, content) VALUES (?, ?, ?, ?)`,
			userID, categoryID, title, content)
		if err != nil {
			pageData["ErrMessage"] = err
			pageData["Message"] = "error creating a post"
			RenderTemplate(w, "error.html", pageData, http.StatusBadRequest)
			return
		}

		var postID int
		err = db.QueryRow(`SELECT last_insert_rowid()`).Scan(&postID)
		if err != nil {
			pageData["ErrMessage"] = fmt.Sprintf("%v: %d\n", err, postID)
			pageData["Message"] = "error creating a post"
			RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
			return
		}
		pageData["Success"] = true
		pageData["Message"] = "New post created successfully!"

		RenderTemplate(w, "createPost.html", pageData, http.StatusOK)
		return
	}

	http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
}

func newReviewHandler(w http.ResponseWriter, r *http.Request) {

	pageData := make(map[string]interface{})
	userSession := r.Context().Value(sessionKey).(UserSession)
	pageData["UserSession"] = userSession
	pageData["Logged"] = true

	booksByAuthor, err := queryBooks()
	if err != nil {
		pageData["ErrMessage"] = err
		pageData["Message"] = "error querying books"
		RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
		return
	}
	pageData["BooksByAuthor"] = booksByAuthor

	if r.Method == http.MethodPost {

		userID := userSession.UserID

		title := r.FormValue("title")
		content := r.FormValue("content")
		bookID := r.FormValue("bookID")
		score := r.FormValue("score")

		category := "Book review"

		if title == "" || content == "" || bookID == "" || score == "" {
			pageData["Message"] = "all fields are required"
			RenderTemplate(w, "createReview.html", pageData, http.StatusBadRequest)
			return
		}

		var categoryID int
		err := db.QueryRow(`SELECT id FROM Categories WHERE name = ?`, category).Scan(&categoryID)
		if err != nil {
			pageData["ErrMessage"] = fmt.Sprintf("%v: %s\n", err, category)
			pageData["Message"] = "error retrieving category"
			RenderTemplate(w, "createReview.html", pageData, http.StatusBadRequest)
			return
		}

		_, err = db.Exec(`INSERT INTO Posts (user_id, book_id, category_id, title, content) VALUES (?, ?, ?, ?, ?)`,
			userID, bookID, categoryID, title, content)
		if err != nil {
			pageData["ErrMessage"] = err
			pageData["Message"] = "error creating review"
			RenderTemplate(w, "error.html", pageData, http.StatusBadRequest)
			return
		}

		var postID int
		err = db.QueryRow(`SELECT last_insert_rowid()`).Scan(&postID)
		if err != nil {
			pageData["ErrMessage"] = fmt.Sprintf("%v: %d\n", err, postID)
			pageData["Message"] = "error creating post"
			RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
			return
		}
		_, err = db.Exec(`INSERT INTO Ratings (book_id, user_id, score, post_id) VALUES (?, ?, ?, ?)`,
			bookID, userID, score, postID)
		if err != nil {
			pageData["ErrMessage"] = err
			pageData["Message"] = "error creating or updating score"
			RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
			return
		}
		pageData["Message"] = "New review created succesfully!"

	}

	RenderTemplate(w, "createReview.html", pageData, http.StatusOK)

}

func queryCategories() ([]Categories, error) {

	categoriesQuery := `SELECT id, name FROM Categories WHERE NOT name = 'Book review' `
	categoriesRows, err := db.Query(categoriesQuery)
	if err != nil {
		return nil, fmt.Errorf("error querying categories: %v", err)
	}
	defer categoriesRows.Close()

	var categories []Categories
	for categoriesRows.Next() {
		var category Categories
		if err := categoriesRows.Scan(&category.ID, &category.Name); err != nil {
			return nil, fmt.Errorf("error scanning category rows: %v", err)
		}
		categories = append(categories, category)
	}
	if err := categoriesRows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating category rows: %v", err)
	}
	return categories, nil
}

func queryBooks() (map[string][]Books, error) {

	stm := `SELECT id, name, author FROM Books;`
	rows, err := db.Query(stm)
	if err != nil {
		return nil, fmt.Errorf("error querying books: %v", err)
	}
	defer rows.Close()

	booksByAuthor := make(map[string][]Books)

	for rows.Next() {
		var b Books
		if err := rows.Scan(&b.ID, &b.Name, &b.Author); err != nil {
			return nil, fmt.Errorf("error scanning rows of books: %v", err)
		}

		booksByAuthor[b.Author] = append(booksByAuthor[b.Author], b)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating over rows of books: %v", err)
	}

	return booksByAuthor, nil
}

func queryAuthors() ([]string, error) {

	stm := `SELECT DISTINCT author FROM Books;`
	rows, err := db.Query(stm)
	if err != nil {
		return nil, fmt.Errorf("error querying authors")
	}
	defer rows.Close()

	var authors []string

	for rows.Next() {
		var author string
		if err := rows.Scan(&author); err != nil {
			return nil, fmt.Errorf("error scanning author rows")
		}
		authors = append(authors, author)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating over rows of authors")
	}
	return authors, nil
}

func addBookOrCategoryHandler(w http.ResponseWriter, r *http.Request) {

	pageData := make(map[string]interface{})
	userSession := r.Context().Value(sessionKey).(UserSession)
	pageData["UserSession"] = userSession
	pageData["Logged"] = true

	authors, err := queryAuthors()
	if err != nil {
		pageData["ErrMessage"] = err
		pageData["Message"] = "error querying authors"
		RenderTemplate(w, "error.html", pageData, http.StatusInternalServerError)
		return
	}
	pageData["Authors"] = authors

	if r.Method == http.MethodGet {

		formType := r.URL.Query().Get("form")
		if formType == "book" {
			pageData["ShowBookForm"] = true
			pageData["FormType"] = "Book"
		} else if formType == "category" {
			pageData["ShowCategoryForm"] = true
			pageData["FormType"] = "Category"
		}
		RenderTemplate(w, "addBookOrCategory.html", pageData, http.StatusOK)
		return
	}

	if r.Method == http.MethodPost {

		book := r.FormValue("book")
		selectedAuthor := r.FormValue("author")
		newAuthor := r.FormValue("newauthor")
		genre := r.FormValue("genre")
		category := r.FormValue("category")
		formType := r.FormValue("form")

		if selectedAuthor != "" && newAuthor != "" {
			pageData["Message"] = "You cannot select an existing author and provide a new one. Please select only one."
			pageData["ShowBookForm"] = true
			pageData["FormType"] = "Book"
			RenderTemplate(w, "addBookOrCategory.html", pageData, http.StatusBadRequest)
			return
		}

		var author string

		if selectedAuthor != "" {
			author = selectedAuthor
		} else if newAuthor != "" {
			author = newAuthor
		}

		if formType == "book" {
			if book == "" && author == "" && genre == "" {
				pageData["Message"] = "Please input book details"
				RenderTemplate(w, "addBookOrCategory.html", pageData, http.StatusNoContent)
				return
			}
		} else if formType == "category" {
			if category == "" {
				pageData["Message"] = "Please input category"
				RenderTemplate(w, "addBookOrCategory.html", pageData, http.StatusNoContent)
				return
			}
		}

		if book != "" || author != "" || genre != "" {
			var bookID int
			err := db.QueryRow(`SELECT id FROM "Books" WHERE name = ?`, book).Scan(&bookID)
			if err == sql.ErrNoRows {
				result, err := db.Exec(`INSERT INTO "Books" (name, author, genre) VALUES (?, ?, ?)`, book, author, genre)
				if err != nil {
					pageData["Message"] = fmt.Sprintf("Error creating book: %v", err)
					RenderTemplate(w, "addBookOrCategory.html", pageData, http.StatusBadRequest)
					return
				}
				lastID, err := result.LastInsertId()
				if err != nil {
					pageData["Message"] = fmt.Sprintf("Error retrieving new book ID: %v", err)
					RenderTemplate(w, "addBookOrCategory.html", pageData, http.StatusBadRequest)
					return
				}
				bookID = int(lastID)
			} else if err != nil {
				pageData["Message"] = fmt.Sprintf("Error retrieving book ID: %v", err)
				RenderTemplate(w, "addBookOrCategory.html", pageData, http.StatusNotFound)
				return
			}
		}

		if category != "" {
			var categoryID int
			err := db.QueryRow(`SELECT id FROM "Categories" WHERE name = ?`, category).Scan(&categoryID)
			if err == sql.ErrNoRows {
				result, err := db.Exec(`INSERT INTO "Categories" (name) VALUES (?)`, category)
				if err != nil {
					pageData["Message"] = fmt.Sprintf("Error creating category: %v", err)
					RenderTemplate(w, "addBookOrCategory.html", pageData, http.StatusBadRequest)
					return
				}
				lastID, err := result.LastInsertId()
				if err != nil {
					pageData["Message"] = fmt.Sprintf("Error retrieving new category ID: %v", err)
					RenderTemplate(w, "addBookOrCategory.html", pageData, http.StatusBadRequest)
					return
				}
				categoryID = int(lastID)
			} else if err != nil {
				pageData["Message"] = fmt.Sprintf("Error retrieving category ID: %v", err)
				RenderTemplate(w, "addBookOrCategory.html", pageData, http.StatusNotFound)
				return
			}
		}

		if formType == "book" {
			pageData["Message"] = "New book created succesfully!"
			pageData["ShowBookForm"] = true
			pageData["FormType"] = "Book"
		} else if formType == "category" {
			pageData["Message"] = "New category created succesfully!"
			pageData["ShowCategoryForm"] = true
			pageData["FormType"] = "Category"
		}

		pageData["Logged"] = true
		RenderTemplate(w, "addBookOrCategory.html", pageData, http.StatusOK)
	}
}
