package acl

type User struct {
	Username string `storm:"id"  json:"username"`
	Password string `json:"password,omitempty"`
	Role     Role   `json:"role"`
	Token    string `json:"token,omitempty"`
}

func CreateUser(name string, password string, role Role) User {
	return User{Username: name, Role: role, Password: password}
}

func (u *User) Save(ds Datastore) error {
	return ds.DB.Save(u)
}

func (u *User) Get(ds Datastore) error {
	err := ds.DB.One("Username", u.Username, u)
	return err
}
