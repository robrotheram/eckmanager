package acl

type Action int

const (
	CREATE_PROJECT Action = iota
	PROJECT_VIEW
	VIEW
	Edit
	Create
	Delete
)

func (a Action) String() string {
	switch a {
	case CREATE_PROJECT:
		return "CREATE_PROJECT"
	case PROJECT_VIEW:
		return "PROJECT_VIEW"
	case VIEW:
		return "VIEW"
	case Edit:
		return "Edit"
	case Create:
		return "Create"
	case Delete:
		return "Delete"
	}
	return ""
}

func ActonsToString(act []Action) []string {
	actions := []string{}
	for _, a := range act {
		actions = append(actions, a.String())
	}
	return actions
}
