package acl

import (
	"log"
	"math/rand"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type User struct {
	Username   string    `storm:"id"  json:"username"`
	Password   string    `json:"password,omitempty"`
	Role       Role      `json:"role"`
	Token      string    `json:"token,omitempty"`
	Created    time.Time `json:"created_time,omitempty"`
	LastActive time.Time `json:"last_active,omitempty"`
	FirstName  string    `json:"first_name,omitempty"`
	LastName   string    `json:"last_name,omitempty"`
}

func CreateUser(name string, password string, role Role) User {
	return User{Username: name, Role: role, Password: password}
}

func (u *User) Save(ds Datastore) error {
	return ds.DB.Save(u)
}

func (u *User) Delete(ds Datastore) error {
	return ds.DB.DeleteStruct(u)
}

func (u *User) Update(ds Datastore) error {
	return ds.DB.Update(u)
}

func (u *User) Get(ds Datastore) error {
	err := ds.DB.One("Username", u.Username, u)
	return err
}

func GetAllUsers(ds Datastore) ([]User, error) {
	users := []User{}
	err := ds.DB.All(&users)
	if err != nil {
		return users, err
	}
	for i := range users {
		users[i].Password = ""
	}
	return users, nil
}

const charset = "abcdefghijklmnopqrstuvwxyz" +
	"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

var seededRand *rand.Rand = rand.New(
	rand.NewSource(time.Now().UnixNano()))

func StringWithCharset(length int, charset string) string {
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[seededRand.Intn(len(charset))]
	}
	return string(b)
}

func RandomPassword(length int) string {
	return StringWithCharset(length, charset)
}

func HashAndSalt(plainPwd string) string {
	plainHash := []byte(plainPwd)
	hash, err := bcrypt.GenerateFromPassword(plainHash, bcrypt.MinCost)
	if err != nil {
		log.Println(err)
	}
	return string(hash)
}

func CreateDefaultUser(datastore *Datastore) {
	pasword := RandomPassword(8)
	user := User{
		Username:  "admin",
		Password:  HashAndSalt(pasword),
		Role:      Platform_ADMIN,
		FirstName: "Joe",
		LastName:  "Blogs",
	}
	datastore.DB.Save(&user)
	logger.Infof("New Admin account created!")
	logger.Infof("New Default Admin username: %s password: %s", user.Username, pasword)
}
