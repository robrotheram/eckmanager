package acl

type DeploymentType int

const (
	ELASTICSEARCH DeploymentType = iota
	KIBANA
	PROXY
	APM
)

func (d DeploymentType) String() string {
	return [...]string{"elasticsearch", "kibana", "proxy", "apm"}[d]
}
