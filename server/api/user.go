package api

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/context"
	"github.com/gorilla/mux"
	"github.com/robrotheram/eckmanager/acl"
	"github.com/robrotheram/eckmanager/audit"
	"golang.org/x/crypto/bcrypt"
)

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
		user.Role = acl.Viewer

		if user.Password != "" {
			user.Password = acl.HashAndSalt(user.Password)
		}

		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
		}
		user.Created = time.Now()
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

func (a *API) deteleUserHandler() http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, err := a.getUser(mux.Vars(r)["id"])
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}
		if user.Username == "admin" {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(("Admin user can not be deleted")))
			return
		}

		err = user.Delete(a.ds)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}
		audit.AuditWithRequest(r, "DELETE", "USER", "Deleted User"+user.Username)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(okEvent)
	})
}

func (a *API) updateUserHandler() http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, err := a.getUser(mux.Vars(r)["id"])
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}
		var updateUser acl.User
		err = json.NewDecoder(r.Body).Decode(&updateUser)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}

		if user.FirstName != updateUser.FirstName {
			user.FirstName = updateUser.FirstName
		}
		if user.LastName != updateUser.LastName {
			user.LastName = updateUser.LastName
		}
		if user.Role.ID != updateUser.Role.ID {
			role, err := acl.RoleFromString(updateUser.Role.ID)
			if err != nil {
				w.WriteHeader(http.StatusBadRequest)
				w.Write([]byte(err.Error()))
				return
			}
			user.Role = role
		}

		if updateUser.Password != "" {
			logger.Info("Updating users password")
			user.Password = acl.HashAndSalt(updateUser.Password)
		}

		err = user.Update(a.ds)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}

		audit.AuditWithRequest(r, "UPDATE", "USER", "Updated User"+user.Username)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(okEvent)
	})
}

func (a *API) getUserInfo() http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user := context.Get(r, "user").(*acl.User)
		user.Password = ""

		token, err := getToken(user.Username)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte("Error generating JWT token: " + err.Error()))
			return
		}
		user.Token = token
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(user)
	})
}

func (a *API) getUsers() http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		users, err := acl.GetAllUsers(a.ds)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(users)
	})
}

func (a *API) getUserPermission() http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user := context.Get(r, "user").(*acl.User)
		projects, _ := a.GetProjects()
		perms := map[string][]string{}
		for _, project := range projects {
			actions := project.GetActions(*user)
			if len(actions) > 0 {
				perms[project.Id] = acl.ActonsToString(actions)
			}
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(perms)
	})
}

func (a *API) updateUserInfo() http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user := context.Get(r, "user").(*acl.User)
		user.Password = ""

		token, err := getToken(user.Username)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte("Error generating JWT token: " + err.Error()))
			return
		}
		user.Token = token
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(user)
	})
}
