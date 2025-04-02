# **Literary Lions Forum README**

## **Project Overview**

The Literary Lions Forum is a web-based discussion platform designed for book clubs. It aims to provide a digital space for members to engage in lively discussions, share insights, and preserve knowledge. The forum features user authentication, post categorization, like/dislike functionality, and post filtering.

## **Functional Requirements**

- Utilizes SQLite for data management
- Implements user authentication with email, username, and password
- Enables communication features for registered users to create posts and comments
- Allows registered users to associate categories with posts
- Displays posts and comments to all users
- Implements like/dislike functionality for registered users
- Adds post filtering by category, created posts, and liked posts
- Dockerizes the application for efficient management and deployment

## **Technical Details**

- Built using Go programming language
- Uses go-sqlite3 driver to interface with SQLite
- Database design follows an entity-relationship diagram (ERD) to model relationships between entities
- Query execution uses SQL queries with at least one SELECT, CREATE, and INSERT query
- Implements password encryption for secure storage
- Uses UUIDs for session management

## **Dockerization**

- Crafts a Dockerfile to define the application's environment and dependencies
- Utilizes Docker to construct an image encapsulating the application and its required components
- Spins up a container from the created image, effectively running the application
- Applies metadata to Docker objects for enhanced organization and management
- Maintains a clean environment by addressing unused objects to optimize resource usage

## Manual Setup

1.  Build the application. This command compiles the Go source code into an executable binary named "literary-lions".  
    The -o flag specifies the output filename.

```bash
go build -o literary-lions
```

2.  This command runs the compiled executable.  
    The server will start and listen on port 8080 as specified in main.go: http.ListenAndServe(":8080", mux)

```bash
./literary-lions
```

Check the console for the message "Main server started on: 8080" (from main.go)  
Open a web browser and navigate to http://localhost:8080  
You should see the Literary Lions Forum homepage.

## Forum Features

### User Management

- User authentication with email, username, and password
- Password encryption for secure storage
- UUIDs for session management (extra)

### Post Management

- Registered users can create posts
- Posts can be associated with categories
- Posts can be liked and disliked by registered users
- Post filtering by category, created posts, and liked posts

### Comment Management

- Registered users can create comments on posts
- Comments can be liked and disliked by registered users

### Book Management

- Books can be added to the forum (bonus)
- Books can be associated with posts (bonus)

### Category Management

- Categories can be added to the forum (bonus)
- Posts can be associated with categories (bonus)

### Profile Management

- Registered users can view and edit their profiles (bonus)
- Profiles display user information and post history (bonus)

### Other Features

- Display of posts and comments to all users
- Entity-relationship diagram (ERD) based database design
- SQL queries for data management
- Go-sqlite3 driver for interfacing with SQLite

### Authors

Eemil Rontti & Jean-Albert Campello

### **License**

This project is licensed under the MIT License.