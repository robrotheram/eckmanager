package api

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/gorilla/context"
	"github.com/gorilla/mux"
	"github.com/robrotheram/eckmanager/acl"
)

func hasPermission(user acl.User, actions []acl.Action) bool {
	for _, action := range actions {
		if user.Role.HasAction(action) {
			return true
		}
	}
	return false
}

func getToken(id string) (string, error) {
	signingKey := []byte("keymaker")
	ttl := 1 * time.Hour
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":  id,
		"exp": time.Now().UTC().Add(ttl).Unix(),
	})
	tokenString, err := token.SignedString(signingKey)
	return tokenString, err
}

func VerifyToken(tokenString string) (jwt.Claims, error) {
	signingKey := []byte("keymaker")
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return signingKey, nil
	})
	if err != nil {
		return nil, err
	}
	return token.Claims, err
}

func (a *API) AuthMiddleware(next http.Handler, actions ...acl.Action) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenString := r.Header.Get("Authorization")
		if len(tokenString) == 0 {
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte("Missing Authorization Header"))
			return
		}
		tokenString = strings.Replace(tokenString, "Bearer ", "", 1)
		claims, err := VerifyToken(tokenString)
		if err != nil {
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte("Error verifying JWT token: " + err.Error()))
			return
		}
		id := claims.(jwt.MapClaims)["id"].(string)
		r.Header.Set("id", id)
		user, err := a.getUser(id)
		pid := mux.Vars(r)["id"]
		project, err := a.GetProject(pid)

		if !hasPermission(*user, actions) && !project.HasPermission(*user, actions) {
			w.WriteHeader(http.StatusForbidden)
			w.Write([]byte("Permission Denied"))
			return
		}
		context.Set(r, "user", user)
		next.ServeHTTP(w, r)
	})
}

func (a *API) login() http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var user = acl.User{}
		_ = json.NewDecoder(r.Body).Decode(&user)
		password := user.Password
		err := user.Get(a.ds)
		if err != nil {
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte("Bad Usermae / Password"))
			return
		}
		match := ComparePasswords(user.Password, password)
		if !match {
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte("Bad Usermae / Password"))
			return
		}

		token, err := getToken(user.Username)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte("Error generating JWT token: " + err.Error()))
		} else {
			w.Header().Set("Authorization", "Bearer "+token)
			w.WriteHeader(http.StatusOK)
			user.LastActive = time.Now()
			user.Save(a.ds)
			auth := acl.User{Token: token, Username: user.Username, Role: user.Role}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(auth)
		}
	})
}
