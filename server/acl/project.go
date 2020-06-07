package acl

import (
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/rs/xid"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

const LayoutISO = "2006-01-02T15:04:05Z"

type Project struct {
	Id           string `storm:"id"`
	Name         string `storm:"unique"`
	Description  string
	Enabled      bool
	RoleMappings []RoleUserMapping
	Roles        []map[string]string
	Cpu          int
	Memory       int
	Disk         int
	Deployment   []Deployment
}

type Quota struct {
	Used   Resources `json:used`
	Limits Resources `json:limits`
}

type Resources struct {
	CPU    string `json:cpu`
	Memory string `json:memory`
}

func (p *Project) UpdateWithProject(project Project) {
	if p.Name != project.Name {
		p.Name = project.Name
	}
	if p.Description != project.Description {
		p.Description = project.Description
	}
	p.RoleMappings = project.RoleMappings
	p.Roles = project.Roles

	if p.Cpu != project.Cpu {
		p.Cpu = project.Cpu
	}
	if p.Memory != project.Memory {
		p.Memory = project.Memory
	}
	if p.Disk != project.Disk {
		p.Disk = project.Disk
	}
}

func (p *Project) HasPermission(u User, actions []Action) bool {
	for _, rm := range p.RoleMappings {
		if rm.User == u.Username {
			for _, action := range actions {
				if rm.Role.HasAction(action) {
					return true
				}
			}
		}
	}
	return false
}

func (p *Project) GetActions(u User) []Action {
	for _, rm := range p.RoleMappings {
		if rm.User == u.Username {
			return rm.Role.Actions
		}
	}
	return []Action{}
}

func (p *Project) SetUser(r RoleUserMapping) {
	p.RoleMappings = append(p.RoleMappings, r)
}

func CreateProject(name string, cpu int, memory int, disk int) Project {
	guid := xid.New()
	return Project{Id: guid.String(), Name: name, Cpu: cpu, Memory: memory, Disk: disk}
}

func (p *Project) AddRole(rm RoleUserMapping) {
	p.RoleMappings = append(p.RoleMappings, rm)
}

func (p *Project) Save(ds Datastore) error {
	if p.Id == "" {
		p.Id = xid.New().String()
	}
	return ds.DB.Save(p)
}
func (p *Project) Update(ds Datastore) error {
	return ds.DB.Update(p)
}
func (p *Project) Delete(ds Datastore) error {
	return ds.DB.DeleteStruct(p)
}

func (p *Project) Get(ds Datastore, kubeClient dynamic.Interface) error {
	err := ds.DB.One("Id", p.Id, p)
	if err != nil {
		return fmt.Errorf("Could Not find project with id %s, error: %v", p.Id, err)
	}
	err = p.DoesExistInKube(kubeClient)
	return err
}

func (p *Project) GetFromName(ds Datastore, kubeClient dynamic.Interface) error {
	err := ds.DB.One("Id", p.Id, p)
	if err != nil {
		return err
	}
	err = p.DoesExistInKube(kubeClient)
	return err
}

func (p *Project) CreateNamespace(kubeClient dynamic.Interface) error {
	deploymentRes := schema.GroupVersionResource{Version: "v1", Resource: "namespaces"}
	deployment := &unstructured.Unstructured{
		Object: map[string]interface{}{
			"apiVersion": "v1",
			"kind":       "Namespace",
			"metadata": map[string]interface{}{
				"name": p.Name,
				"labels": map[string]interface{}{
					"name": p.Name,
				},
			},
		},
	}
	logger.Infof("Creating deployment...")
	_, err := kubeClient.Resource(deploymentRes).Create(deployment, metav1.CreateOptions{})
	return err
}

func (p *Project) DeleteNamespace(kubeClient dynamic.Interface) error {
	deploymentRes := schema.GroupVersionResource{Version: "v1", Resource: "namespaces"}
	err := kubeClient.Resource(deploymentRes).Delete(p.Name, &metav1.DeleteOptions{})
	return err
}

func (p *Project) CreateLimitRange(kubeClient dynamic.Interface) error {
	deploymentRes := schema.GroupVersionResource{Version: "v1", Resource: "limitranges"}
	limitRange := &unstructured.Unstructured{
		Object: map[string]interface{}{
			"apiVersion": "v1",
			"kind":       "LimitRange",
			"metadata": map[string]interface{}{
				"name": p.Name + "-resource-limits",
			},
			"spec": map[string]interface{}{
				"limits": []map[string]interface{}{
					map[string]interface{}{
						"max": map[string]interface{}{
							"cpu":    fmt.Sprintf("%d", p.Cpu),
							"memory": fmt.Sprintf("%dGi", p.Memory),
						},
						"min": map[string]interface{}{
							"cpu":    "100m",
							"memory": "6Mi",
						},
						"type": "Pod",
					},
					map[string]interface{}{
						"default": map[string]interface{}{
							"cpu":    "300m",
							"memory": "200Mi",
						},
						"defaultRequest": map[string]interface{}{
							"cpu":    "200m",
							"memory": "100Mi",
						},
						"max": map[string]interface{}{
							"cpu":    fmt.Sprintf("%d", p.Cpu),
							"memory": fmt.Sprintf("%dGi", p.Memory),
						},
						"maxLimitRequestRatio": map[string]interface{}{
							"cpu": "10",
						},
						"min": map[string]interface{}{
							"cpu":    "100m",
							"memory": "4Mi",
						},
						"type": "Container",
					},
				},
			},
		},
	}
	logger.Infof("Creating Limit Quota...")
	_, err := kubeClient.Resource(deploymentRes).Namespace(p.Name).Create(limitRange, metav1.CreateOptions{})
	if err != nil {
		_, err = kubeClient.Resource(deploymentRes).Namespace(p.Name).Update(limitRange, metav1.UpdateOptions{})
	}
	return err
}

func (p *Project) CreateResourceQuota(kubeClient dynamic.Interface) error {
	deploymentRes := schema.GroupVersionResource{Version: "v1", Resource: "resourcequotas"}
	deployment := &unstructured.Unstructured{
		Object: map[string]interface{}{
			"apiVersion": "v1",
			"kind":       "ResourceQuota",
			"metadata": map[string]interface{}{
				"name": p.Name,
			},
			"spec": map[string]interface{}{
				"hard": map[string]interface{}{
					"limits.cpu":    fmt.Sprintf("%d", p.Cpu),
					"limits.memory": fmt.Sprintf("%dGi", p.Memory),
				},
			},
		},
	}
	logger.Infof("Creating Resource Quota...")
	_, err := kubeClient.Resource(deploymentRes).Namespace(p.Name).Create(deployment, metav1.CreateOptions{})
	if err != nil {
		_, err = kubeClient.Resource(deploymentRes).Namespace(p.Name).Update(deployment, metav1.UpdateOptions{})
	}
	return err
}

func (p *Project) DoesExistInKube(kubeClient dynamic.Interface) error {
	label := fmt.Sprintf("name=%s", p.Name)
	deploymentRes := schema.GroupVersionResource{Version: "v1", Resource: "namespaces"}
	result, err := kubeClient.Resource(deploymentRes).List(metav1.ListOptions{LabelSelector: label})
	if len(result.Items) == 1 {
		p.Enabled = true
	} else {
		p.Enabled = false
	}
	return err
}

func (p *Project) UpdateDeployment(deployment Deployment) Deployment {
	for i, d := range p.Deployment {
		if d.Name == deployment.Name {
			p.Deployment[i].Update(deployment)
			return p.Deployment[i]
		}
	}
	p.Deployment = append(p.Deployment, deployment)
	return deployment
}

func (p *Project) FindDeployment(searchterm string) (Deployment, error) {
	for _, d := range p.Deployment {
		if d.Name == searchterm {
			return d, nil
		}
		if d.ID == searchterm {
			return d, nil
		}
	}
	return Deployment{}, fmt.Errorf("Deployment Not Found")
}

func (p *Project) CovertMappingToRoles() {
	roles := []map[string]string{}
	for _, rm := range p.RoleMappings {
		role := map[string]string{
			"username": rm.User,
			"role":     rm.Role.String(),
		}
		roles = append(roles, role)
	}
	p.Roles = roles
}

func (p *Project) CovertRolesToMappings() {
	roles := []RoleUserMapping{}
	for _, rm := range p.Roles {
		role, err := RoleFromString(rm["role"])
		if err == nil {
			roles = append(roles, RoleUserMapping{User: rm["username"], Role: role})
		}
	}
	p.RoleMappings = roles
}

func (p *Project) DeletDeployment(deployment Deployment) {
	dpl := []Deployment{}
	for _, d := range p.Deployment {
		if d.Name != deployment.Name {
			dpl = append(dpl, d)
		}
	}
	p.Deployment = dpl
}

func (p *Project) GetEvents(client dynamic.Interface, deploymentName string) []KubeEvent {
	deploymentRes := schema.GroupVersionResource{Version: "v1", Resource: "events"}
	//label := fmt.Sprintf("elasticsearch.k8s.elastic.co/cluster-name=%s", config.Name)
	result, _ := client.Resource(deploymentRes).Namespace(p.Name).List(metav1.ListOptions{})
	evetns := []KubeEvent{}
	for _, item := range result.Items {
		typ, found, err := unstructured.NestedString(item.Object, "type")
		if err != nil || !found {
			logger.Warnf("type not found for deployment %s: error=%s", item.GetName(), err)
			continue
		}
		message, found, err := unstructured.NestedString(item.Object, "message")
		if err != nil || !found {
			logger.Warnf("message not found for deployment %s: error=%s", item.GetName(), err)
			continue
		}
		lastTimestamp, found, err := unstructured.NestedString(item.Object, "lastTimestamp")
		if err != nil || !found {
			logger.Warnf("lastTimestamp not found for deployment %s: error=%s", item.GetName(), err)
			continue
		}
		reason, found, err := unstructured.NestedString(item.Object, "reason")
		if err != nil || !found {
			logger.Warnf("lastTimestamp not found for deployment %s: error=%s", item.GetName(), err)
			continue
		}
		metadata, found, err := unstructured.NestedStringMap(item.Object, "metadata")
		if err != nil || !found {
			logger.Warnf("lastTimestamp not found for metadata %s: error=%s", item.GetName(), err)
			continue
		}
		source, found, err := unstructured.NestedStringMap(item.Object, "source")
		if err != nil || !found {
			logger.Warnf("lastTimestamp not found for deployment %s: error=%s", item.GetName(), err)
			continue
		}
		t, _ := time.Parse(LayoutISO, lastTimestamp)

		if (deploymentName == "") || (strings.HasPrefix(metadata["name"], deploymentName)) {
			evetns = append(evetns, KubeEvent{
				Type:          typ,
				Message:       message,
				LastTimestamp: t,
				Reason:        reason,
				Component:     source["component"],
			})
		}

	}
	//return result.Items
	sort.Slice(evetns, func(i, j int) bool {
		return evetns[i].LastTimestamp.Before(evetns[j].LastTimestamp)
	})
	return evetns
}

func (p *Project) GetQuota(client dynamic.Interface, deploymentName string) []Quota {
	deploymentRes := schema.GroupVersionResource{Version: "v1", Resource: "resourcequotas"}
	//label := fmt.Sprintf("elasticsearch.k8s.elastic.co/cluster-name=%s", config.Name)
	result, _ := client.Resource(deploymentRes).Namespace(p.Name).List(metav1.ListOptions{})
	quotas := []Quota{}

	for _, item := range result.Items {
		status, found, err := unstructured.NestedMap(item.Object, "status")
		if err != nil || !found {
			continue
		}
		lstat := status["hard"].(map[string]interface{})
		uStat := status["used"].(map[string]interface{})

		quotas = append(quotas, Quota{
			Used: Resources{
				CPU:    uStat["limits.cpu"].(string),
				Memory: uStat["limits.memory"].(string),
			},
			Limits: Resources{
				CPU:    lstat["limits.cpu"].(string),
				Memory: lstat["limits.memory"].(string),
			},
		})

	}
	return quotas
}
