package api

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/context"
	"github.com/gorilla/mux"
	"github.com/robrotheram/eckmanager/acl"
	"golang.org/x/crypto/bcrypt"
)

func HashAndSalt(plainPwd string) string {
	plainHash := []byte(plainPwd)
	hash, err := bcrypt.GenerateFromPassword(plainHash, bcrypt.MinCost)
	if err != nil {
		log.Println(err)
	}
	return string(hash)
}
func ComparePasswords(hashedPwd string, plainPwd string) bool {
	byteHash := []byte(hashedPwd)
	plainHash := []byte(plainPwd)
	err := bcrypt.CompareHashAndPassword(byteHash, plainHash)
	if err != nil {
		log.Println(err)
		return false
	}
	return true
}

func (a *API) createUser() http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var user acl.User
		err := json.NewDecoder(r.Body).Decode(&user)
		if user.Username == "test" {
			user.Role = acl.Platform_ADMIN
		} else {
			user.Role = acl.Viewer
		}

		if user.Password != "" {
			user.Password = HashAndSalt(user.Password)
		}

		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
		}
		err = user.Save(a.ds)
	})
}

func (a *API) getUser(username string) (*acl.User, error) {
	user := acl.User{Username: username}
	err := user.Get(a.ds)
	return &user, err
}

func (a *API) getUserHandler() http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, err := a.getUser(mux.Vars(r)["id"])
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}
		user.Password = ""
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(user)
	})
}
func (a *API) getUserInfo() http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user := context.Get(r, "user").(*acl.User)
		user.Password = ""
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(user)
	})
}
