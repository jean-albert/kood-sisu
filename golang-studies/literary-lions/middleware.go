package main

import (
	"context"
	"fmt"
	"net/http"
	"time"
)

func Auth(HandlerFunc http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		c, err := r.Cookie("session_token")
		if err != nil {
			if err == http.ErrNoCookie {
				redirectURL := r.URL.Path + "?" + r.URL.RawQuery
				http.Redirect(w, r, "/login?redirect="+redirectURL, http.StatusFound)
				return
			}
			pageData := make(map[string]interface{})
			fmt.Println("Bad request")
			pageData["Message"] = "bad request"
			RenderTemplate(w, "error.html", pageData, http.StatusBadRequest)
			return
		}
		sessionToken := c.Value

		userSession, exists := sessions[sessionToken]
		if !exists || userSession.isExpired() {
			redirectURL := r.URL.Path + "?" + r.URL.RawQuery
			http.Redirect(w, r, "/login?redirect="+redirectURL, http.StatusFound)
			return
		}

		createOrRefreshSession(w, &User{
			Username: userSession.Username,
			ID:       userSession.UserID,
			Email:    userSession.Email,
		}, sessionToken)

		ctx := context.WithValue(r.Context(), sessionKey, userSession)
		r = r.WithContext(ctx)

		HandlerFunc.ServeHTTP(w, r)
	}
}

func SessionMiddleware(HandlerFunc http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		c, err := r.Cookie("session_token")
		if err == nil {
			sessionToken := c.Value
			userSession, exists := sessions[sessionToken]
			if exists || !userSession.isExpired() {
				createOrRefreshSession(w, &User{
					Username: userSession.Username,
					ID:       userSession.UserID,
					Email:    userSession.Email,
				}, sessionToken)

				ctx := context.WithValue(r.Context(), sessionKey, userSession)
				r = r.WithContext(ctx)
			}

		}
		HandlerFunc.ServeHTTP(w, r)
	}
}

func (s UserSession) isExpired() bool {
	return s.Expiry.Before(time.Now())
}
