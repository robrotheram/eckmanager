package acl

import (
	"errors"

	"github.com/rs/xid"
)

type Role struct {
	ID      string
	Name    string
	Actions []Action
}

var Platform_VIEWER = Role{"Platform_VIEWER", "Project Viewer Role", []Action{PROJECT_VIEW}}
var Platform_ADMIN = Role{"Platform_ADMIN", "Project Admin Role", []Action{CREATE_PROJECT, PROJECT_VIEW}}
var Editor = Role{"Editor", "Platform Admin Role", []Action{VIEW, Edit}}
var Viewer = Role{"Viewer", "Platform Viewer Role", []Action{VIEW}}

func (r *Role) HasAction(act Action) bool {
	for _, a := range r.Actions {
		if a == act {
			return true
		}
	}
	return false
}

func RoleFromString(role string) (Role, error) {
	switch role {
	case "Platform_VIEWER":
		return Platform_VIEWER, nil
	case "Platform_ADMIN":
		return Platform_ADMIN, nil
	case "Viewer":
		return Viewer, nil
	case "Editor":
		return Editor, nil
	default:
		return Role{}, errors.New("role not found")
	}
}

func (r *Role) String() string {
	return r.ID
}

type RoleUserMapping struct {
	Id   string
	User string
	Role Role
}

func CreateRoleUserMapping(user string, role Role) RoleUserMapping {
	guid := xid.New()
	return RoleUserMapping{Id: guid.String(), User: user, Role: role}
}
