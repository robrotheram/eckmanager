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
