CREATE TABLE IF NOT EXISTS "Users" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"email" TEXT NOT NULL UNIQUE,
	"username" TEXT NOT NULL UNIQUE,
	"password_hash" TEXT NOT NULL,
	"created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "bio" TEXT,
    "fav_category" INTEGER,
    FOREIGN KEY ("fav_category") REFERENCES "Categories"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Categories" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"name" TEXT NOT NULL UNIQUE
);

INSERT INTO "Categories" ("id", "name") VALUES (1, 'Book review');

CREATE TABLE IF NOT EXISTS "Books" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
	"author" TEXT NOT NULL,
    "genre" TEXT
);

CREATE TABLE IF NOT EXISTS "Posts" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "book_id" INTEGER,
    "category_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
	"like_count" INTEGER NOT NULL DEFAULT 0,
	"dislike_count" INTEGER NOT NULL DEFAULT 0,
	"comments_count" INTEGER DEFAULT 0,
    FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE,
    FOREIGN KEY ("category_id") REFERENCES "Categories"("id") ON DELETE CASCADE,
    FOREIGN KEY ("book_id") REFERENCES "Books"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Ratings" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"score" INTEGER,
	"book_id" INTEGER NOT NULL,
	"user_id" INTEGER NOT NULL,
	"post_id" INTEGER NOT NULL,
	FOREIGN KEY ("book_id") REFERENCES "Books"("id") ON DELETE CASCADE,
	FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE,
	FOREIGN KEY ("post_id") REFERENCES "Posts"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Comments" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"post_id" INTEGER NOT NULL,
	"user_id" INTEGER NOT NULL,
	"content" TEXT NOT NULL,
	"created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
	"like_count" INTEGER NOT NULL DEFAULT 0,
	"dislike_count" INTEGER NOT NULL DEFAULT 0,
	FOREIGN KEY ("post_id") REFERENCES "Posts"("id") ON DELETE CASCADE,
	FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "PostLikes" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"post_id" INTEGER NOT NULL,
	"user_id" INTEGER NOT NULL,
	"like" BOOLEAN,
	FOREIGN KEY ("post_id") REFERENCES "Posts"("id") ON DELETE CASCADE,
	FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "CommentLikes" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT,
	"comment_id" INTEGER NOT NULL,
	"user_id" INTEGER NOT NULL,
	"like" BOOLEAN,
	FOREIGN KEY ("comment_id") REFERENCES "Comments"("id") ON DELETE CASCADE,
	FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE CASCADE
);

-- Trigger for post likes: INSERT
CREATE TRIGGER IF NOT EXISTS "update_post_like_dislike_count_after_insert"
AFTER INSERT ON `PostLikes`
FOR EACH ROW
BEGIN
    UPDATE `Posts`
    SET `like_count` = (
        SELECT COUNT(*) FROM `PostLikes` WHERE `post_id` = NEW.post_id AND "like" = TRUE
    ),
    `dislike_count` = (
        SELECT COUNT(*) FROM `PostLikes` WHERE `post_id` = NEW.post_id AND "like" = FALSE
    )
    WHERE `id` = NEW.post_id;
END;

-- Trigger for post likes: DELETE
CREATE TRIGGER IF NOT EXISTS "update_post_like_dislike_count_after_delete"
AFTER DELETE ON `PostLikes`
FOR EACH ROW
BEGIN
    UPDATE `Posts`
    SET `like_count` = (
        SELECT COUNT(*) FROM `PostLikes` WHERE `post_id` = OLD.post_id AND "like" = TRUE
    ),
    `dislike_count` = (
        SELECT COUNT(*) FROM `PostLikes` WHERE `post_id` = OLD.post_id AND "like" = FALSE
    )
    WHERE `id` = OLD.post_id;
END;

-- Trigger for post likes: UPDATE
CREATE TRIGGER IF NOT EXISTS "update_post_like_dislike_count_after_update"
AFTER UPDATE ON `PostLikes`
FOR EACH ROW
BEGIN
    UPDATE `Posts`
    SET `like_count` = (
        SELECT COUNT(*) FROM `PostLikes` WHERE `post_id` = NEW.post_id AND "like" = TRUE
    ),
    `dislike_count` = (
        SELECT COUNT(*) FROM `PostLikes` WHERE `post_id` = NEW.post_id AND "like" = FALSE
    )
    WHERE `id` = NEW.post_id;
END;

-- Trigger for comment likes: INSERT
CREATE TRIGGER IF NOT EXISTS "update_comment_like_dislike_count_after_insert"
AFTER INSERT ON `CommentLikes`
FOR EACH ROW
BEGIN
    UPDATE `Comments`
    SET `like_count` = (
        SELECT COUNT(*) FROM `CommentLikes` WHERE `comment_id` = NEW.comment_id AND "like" = TRUE
    ),
    `dislike_count` = (
        SELECT COUNT(*) FROM `CommentLikes` WHERE `comment_id` = NEW.comment_id AND "like" = FALSE
    )
    WHERE `id` = NEW.comment_id;
END;

-- Trigger for comment likes: DELETE
CREATE TRIGGER IF NOT EXISTS "update_comment_like_dislike_count_after_delete"
AFTER DELETE ON `CommentLikes`
FOR EACH ROW
BEGIN
    UPDATE `Comments`
    SET `like_count` = (
        SELECT COUNT(*) FROM `CommentLikes` WHERE `comment_id` = OLD.comment_id AND "like" = TRUE
    ),
    `dislike_count` = (
        SELECT COUNT(*) FROM `CommentLikes` WHERE `comment_id` = OLD.comment_id AND "like" = FALSE
    )
    WHERE `id` = OLD.comment_id;
END;

-- Trigger for comment likes: UPDATE
CREATE TRIGGER IF NOT EXISTS "update_comment_like_dislike_count_after_update"
AFTER UPDATE ON `CommentLikes`
FOR EACH ROW
BEGIN
    UPDATE `Comments`
    SET `like_count` = (
        SELECT COUNT(*) FROM `CommentLikes` WHERE `comment_id` = NEW.comment_id AND "like" = TRUE
    ),
    `dislike_count` = (
        SELECT COUNT(*) FROM `CommentLikes` WHERE `comment_id` = NEW.comment_id AND "like" = FALSE
    )
    WHERE `id` = NEW.comment_id;
END;

-- Delete rating if the post gets deleted
CREATE TRIGGER IF NOT EXISTS "delete_rating_after_post"
AFTER DELETE ON Posts
FOR EACH ROW
BEGIN
	DELETE FROM Ratings
	WHERE post_id = OLD.id;
END;

-- Delete the rating if there are no books associated with it
CREATE TRIGGER IF NOT EXISTS "delete_rating_after_book"
AFTER DELETE ON Books
FOR EACH ROW
BEGIN
	DELETE FROM Ratings
	WHERE id = OLD.id;
END;

CREATE VIEW IF NOT EXISTS "PostSummary" AS
SELECT 
    p.id, p.title, p.content, p.created_at, p.user_id, p.category_id, p.book_id,
    u.username, 
    b.genre AS genre_name, b.author AS author_name, b.name AS book_name, 
    r.score, avg_ratings.average_score AS avg_score,
    COALESCE(likes.like_count, 0) AS like_count, 
    COALESCE(dislikes.dislike_count, 0) AS dislike_count,
    (COALESCE(likes.like_count, 0) - COALESCE(dislikes.dislike_count, 0)) AS net_likes,
    c.name AS CategoryName,
    MAX(co.created_at) AS last_commented_at
FROM Posts p
JOIN Users u ON p.user_id = u.id
LEFT JOIN Categories c ON p.category_id = c.id
LEFT JOIN Books b ON p.book_id = b.id
LEFT JOIN Ratings r ON p.id = r.post_id
LEFT JOIN Ratings r2 ON b.id = r2.book_id
LEFT JOIN (
    SELECT post_id, COUNT(*) AS like_count
    FROM PostLikes
    WHERE "like" = TRUE
    GROUP BY post_id    
) likes ON p.id = likes.post_id
LEFT JOIN (
    SELECT post_id, COUNT(*) AS dislike_count
    FROM PostLikes
    WHERE "like" = FALSE
    GROUP BY post_id    
) dislikes ON p.id = dislikes.post_id
LEFT JOIN (
    SELECT book_id, AVG(score) AS average_score
    FROM Ratings
    GROUP BY book_id
) avg_ratings ON b.id = avg_ratings.book_id
LEFT JOIN Comments co ON p.id = co.post_id
GROUP BY p.id, u.username, b.genre, b.author, b.name, r.score, avg_ratings.average_score, c.name;


CREATE VIEW IF NOT EXISTS "CommentSummary" AS
SELECT 
    c.id, u.username, c.content, c.created_at,
    COALESCE(likes.like_count, 0) AS like_count,
    COALESCE(dislikes.dislike_count, 0) AS dislike_count,
	c.post_id
FROM Comments c
LEFT JOIN Users u ON c.user_id = u.id
LEFT JOIN (
    SELECT comment_id, COUNT(*) AS like_count
    FROM CommentLikes
    WHERE "like" = TRUE
    GROUP BY comment_id
) likes ON c.id = likes.comment_id
LEFT JOIN (
    SELECT comment_id, COUNT(*) AS dislike_count
    FROM CommentLikes
    WHERE "like" = FALSE
    GROUP BY comment_id
) dislikes ON c.id = dislikes.comment_id
ORDER BY c.created_at ASC;
