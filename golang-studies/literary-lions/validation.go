package main

import (
	"database/sql"
	"errors"
	"unicode"
)

func validateRegistrationInput(username, password string) error {

	if err := checkUsernameCriteria(username); err != nil {
		return err
	}

	if err := checkPasswordCriteria(password); err != nil {
		return err
	}

	return nil
}

func checkUserExists(username, email string) error {
	if existsInDatabase("SELECT id FROM Users WHERE username = ?", username) {
		return errors.New("sorry, that username is already taken")
	}

	if existsInDatabase("SELECT id FROM Users WHERE email = ?", email) {
		return errors.New("sorry, that email already has an account")
	}
	return nil
}

func checkUsernameCriteria(username string) error {

	var nameAlphaNumeric = true
	for _, char := range username {
		if !unicode.IsLetter(char) && !unicode.IsNumber(char) {
			nameAlphaNumeric = false
		}
	}

	if !nameAlphaNumeric {
		return errors.New("username must only contain numbers and letters")
	}

	var nameLength bool
	if 5 <= len(username) && len(username) <= 50 {
		nameLength = true
	}

	if !nameLength {
		return errors.New("username must be longer than 4 characters and less than 51")
	}
	return nil
}

func checkPasswordCriteria(password string) error {

	var err error

	var pswdLowercase, pswdUppercase, pswdNumber, pswdLength, pswdNoSpaces bool
	pswdNoSpaces = true
	for _, char := range password {
		switch {
		case unicode.IsLower(char):
			pswdLowercase = true
		case unicode.IsUpper(char):
			pswdUppercase = true
		case unicode.IsNumber(char):
			pswdNumber = true
		case unicode.IsSpace(int32(char)):
			pswdNoSpaces = false
		}
	}

	if 5 <= len(password) && len(password) < 60 {
		pswdLength = true
	}

	if !pswdLowercase || !pswdUppercase || !pswdNumber || !pswdLength || !pswdNoSpaces {
		switch false {
		case pswdLowercase:
			err = errors.New("password must contain atleast one lower case letter")
		case pswdUppercase:
			err = errors.New("password must contain atleast one upper case letter")
		case pswdNumber:
			err = errors.New("password must contain atleast one number")
		case pswdLength:
			err = errors.New("password must be atleast 5 characters and less than 60")
		case pswdNoSpaces:
			err = errors.New("password cannot contain any spaces")
		}
		return err
	}
	return nil
}

func existsInDatabase(query string, arg string) bool {

	var uID string
	err := db.QueryRow(query, arg).Scan(&uID)
	return err != sql.ErrNoRows
}
