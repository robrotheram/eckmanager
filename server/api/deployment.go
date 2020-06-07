package api

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/robrotheram/eckmanager/acl"
	"github.com/robrotheram/eckmanager/audit"
	"github.com/robrotheram/eckmanager/containerMetrics"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

func (a *API) createDeployment() http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := mux.Vars(r)["id"]
		project, err := a.GetProject(id)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}

		var deployment acl.Deployment
		err = json.NewDecoder(r.Body).Decode(&deployment)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}

		if deployment.ElasticseachConfig.Name != "" {
			deployment.ElasticseachConfig.CreateSecrests(a.clientset, project.Name)
			err := deployment.ElasticseachConfig.Deploy(a.clientset, project.Name)
			if err == nil {
				deployment.ElasticseachConfig.GetID()
			}
		}
		if deployment.KibanaConfig.Name != "" {
			err = deployment.KibanaConfig.Deploy(a.clientset, project.Name)
			if err == nil {
				deployment.KibanaConfig.GetID()
			}
		}
		if err == nil && deployment.ElasticseachConfig.Name != "" && deployment.KibanaConfig.Name != "" {
			deployment = project.UpdateDeployment(deployment)
			deployment.ProxyDeploy(a.clientset, project.Name)
		}

		if err == nil {
			err = project.Update(a.ds)
		}

		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}
		resp := okEvent
		resp.Mesassge = "Deployment created"
		audit.AuditWithRequest(r, "CREATE", "Deployment", fmt.Sprintf("Created %s ", (deployment.Name)))
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(okEvent)
	})
}

func (a *API) getDeploymentHandler() http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		projectid := mux.Vars(r)["id"]
		project, err := a.GetProject(projectid)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}
		id := mux.Vars(r)["deployment_id"]
		if id != "" {
			deployment, err := project.FindDeployment(id)
			if err != nil {
				w.WriteHeader(http.StatusBadRequest)
				w.Write([]byte(err.Error()))
				return
			}
			audit.AuditWithRequest(r, "GET", "Deployment", fmt.Sprintf("GET %s ", (deployment.Name)))
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(deployment)
			return
		}
	})
}
func (a *API) getDeploymentStatus() http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		projectid := mux.Vars(r)["id"]
		project, err := a.GetProject(projectid)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}
		id := mux.Vars(r)["deployment_id"]
		if id != "" {
			deployment, err := project.FindDeployment(id)
			if err != nil {
				w.WriteHeader(http.StatusBadRequest)
				w.Write([]byte(err.Error()))
				return
			}
			status := map[string][]acl.Status{}
			status["elasticsearch"] = deployment.ElasticseachConfig.Status(a.clientset, project.Name)
			status["kibana"] = deployment.KibanaConfig.Status(a.clientset, project.Name)

			audit.AuditWithRequest(r, "GET", "Deployment Status", fmt.Sprintf("Created %s ", (deployment.Name)))
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(status)
			return
		}
	})
}

func (a *API) getDeploymentEvents() http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		projectid := mux.Vars(r)["id"]
		project, err := a.GetProject(projectid)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}
		id := mux.Vars(r)["deployment_id"]
		if id != "" {
			deployment, err := project.FindDeployment(id)
			if err != nil {
				w.WriteHeader(http.StatusBadRequest)
				w.Write([]byte(err.Error()))
				return
			}
			audit.AuditWithRequest(r, "GET", "Deployment Events", fmt.Sprintf("Get Events from %s ", (deployment.Name)))
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(project.GetEvents(a.clientset, id))
			return
		}
	})
}

func (a *API) detleteDeploymentHandler() http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		projectid := mux.Vars(r)["id"]
		project, err := a.GetProject(projectid)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}
		id := mux.Vars(r)["deployment_id"]
		if id != "" {
			deployment, err := project.FindDeployment(id)
			if err != nil {
				w.WriteHeader(http.StatusBadRequest)
				w.Write([]byte(err.Error()))
				return
			}
			deployment.ProxyDelete(a.clientset, project.Name)
			deployment.ElasticseachConfig.Delete(a.clientset, project.Name)
			deployment.KibanaConfig.Delete(a.clientset, project.Name)

			project.DeletDeployment(deployment)
			project.Save(a.ds)

			audit.AuditWithRequest(r, "DETETE", "Deployment", fmt.Sprintf("Delployment deleted %s ", (deployment.Name)))
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(okEvent)
			return
		}
	})
}

func (a *API) getDeploymentHanadler() http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := mux.Vars(r)["id"]
		project, err := a.GetProject(id)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}
		audit.AuditWithRequest(r, "GET", "Deployments", fmt.Sprintf("Found  %d ", len(project.Deployment)))
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(project.Deployment)

	})
}

func (a *API) getDeploymentElasticsearchHanadler() http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		projectid := mux.Vars(r)["id"]
		project, err := a.GetProject(projectid)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}
		id := mux.Vars(r)["deployment_id"]
		if id != "" {
			deployment, err := project.FindDeployment(id)
			if err != nil {
				w.WriteHeader(http.StatusBadRequest)
				w.Write([]byte(err.Error()))
				return
			}

			pods := deployment.ElasticseachConfig.Pods(a.clientset, project.Name)
			kpods := processPods(pods, acl.ELASTICSEARCH)

			reponse := map[string]interface{}{
				"status": deployment.ElasticseachConfig.Status(a.clientset, project.Name),
				"pods":   kpods,
			}
			audit.AuditWithRequest(r, "GET", "Elasticsearch", fmt.Sprintf("Found Elasticsearch for deployment %s ", (project.Deployment)))
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(reponse)
		}
	})
}

type kubePods struct {
	ID      string                              `json:"uid"`
	Name    string                              `json:"name"`
	Version string                              `json:"es_version"`
	Status  kubePodStatus                       `json:"status"`
	Metircs []containerMetrics.NamespaceMetrics `json:"metrics"`
	Limits  []containerMetrics.NamespaceMetrics `json:"limits"`
}
type kubePodStatus struct {
	RestartCount string                 `json:"restartCount"`
	Ready        string                 `json:"ready"`
	Phase        string                 `json:"phase"`
	State        map[string]interface{} `json:"state"`
}

func createPodStatus(s map[string]interface{}) (kubePodStatus, error) {
	status := kubePodStatus{}
	status.Phase = fmt.Sprintf("%v", s["phase"])

	containerStatuses, ok := s["containerStatuses"].([]interface{})
	if !ok {
		return status, fmt.Errorf("Unable to get status")
	}
	containerStatus, ok := containerStatuses[0].(map[string]interface{})
	if !ok {
		return status, fmt.Errorf("Unable to get status")
	}
	status.RestartCount = fmt.Sprintf("%v", containerStatus["restartCount"])
	status.Ready = fmt.Sprintf("%v", containerStatus["ready"])
	status.State = containerStatus["state"].(map[string]interface{})

	return status, nil
}

func processPods(pods []unstructured.Unstructured, dtype acl.DeploymentType) []kubePods {
	kpods := []kubePods{}
	for _, p := range pods {
		meta, found, err := unstructured.NestedMap(p.Object, "metadata")
		if err != nil || !found {
			logger.Warnf("Status not found for deployment %s: error=%s", p.GetName(), err)
			continue
		}
		labels := p.GetLabels()

		kpod := kubePods{
			ID:   fmt.Sprintf("%v", meta["uid"]),
			Name: fmt.Sprintf("%v", meta["name"]),
		}
		namespace := fmt.Sprintf("%v", meta["namespace"])

		switch dtype {
		case acl.ELASTICSEARCH:
			kpod.Version = fmt.Sprintf("%v", labels["elasticsearch.k8s.elastic.co/version"])
		case acl.KIBANA:
			kpod.Version = fmt.Sprintf("%v", labels["kibana.k8s.elastic.co/version"])
		}

		status, found, err := unstructured.NestedMap(p.Object, "status")
		if err != nil || !found {
			logger.Warnf("Status not found for deployment %s: error=%s", p.GetName(), err)
			continue
		}

		kstatus, _ := createPodStatus(status)
		kpod.Status = kstatus
		kpod.Metircs = containerMetrics.GetPodMetrics(kpod.Name, namespace)
		kpods = append(kpods, kpod)
	}
	return kpods
}

func (a *API) getDeploymentKibanaHanadler() http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		projectid := mux.Vars(r)["id"]
		project, err := a.GetProject(projectid)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}
		id := mux.Vars(r)["deployment_id"]
		if id != "" {
			deployment, err := project.FindDeployment(id)
			if err != nil {
				w.WriteHeader(http.StatusBadRequest)
				w.Write([]byte(err.Error()))
				return
			}

			pods := deployment.KibanaConfig.Pods(a.clientset, project.Name)
			kpods := processPods(pods, acl.KIBANA)

			reponse := map[string]interface{}{
				"status": deployment.KibanaConfig.Status(a.clientset, project.Name),
				"pods":   kpods,
			}

			audit.AuditWithRequest(r, "GET", "Kibana", fmt.Sprintf("Found Kibana for deployment %s ", (project.Deployment)))
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(reponse)
		}

	})
}
func (a *API) getDeploymentSecrets() http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		audit.Audit("test-user", "GET", "Secrets")

		projectid := mux.Vars(r)["id"]
		project, err := a.GetProject(projectid)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}
		id := mux.Vars(r)["deployment_id"]
		if id != "" {
			deployment, err := project.FindDeployment(id)
			if err != nil {
				w.WriteHeader(http.StatusBadRequest)
				w.Write([]byte(err.Error()))
				return
			}
			secrets, err := deployment.GetSecrets(a.clientset, project.Name)
			if err != nil {
				w.WriteHeader(http.StatusBadRequest)
				w.Write([]byte(err.Error()))
				return
			}
			audit.AuditWithRequest(r, "GET", "Secrets", fmt.Sprintf("Found Secrets for deployment %s ", (project.Deployment)))
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(secrets)
		}

	})
}

func (a *API) deleteDeploymentSecrets() http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		projectid := mux.Vars(r)["id"]
		project, err := a.GetProject(projectid)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}
		id := mux.Vars(r)["deployment_id"]
		if id != "" {
			deployment, err := project.FindDeployment(id)
			if err != nil {
				w.WriteHeader(http.StatusBadRequest)
				w.Write([]byte(err.Error()))
				return
			}
			deployment.DeleteSecrets(a.clientset, project.Name)
			if err != nil {
				w.WriteHeader(http.StatusBadRequest)
				w.Write([]byte(err.Error()))
				return
			}
			audit.AuditWithRequest(r, "DELETE", "Secrets", fmt.Sprintf("Found Secrets for deployment %s ", (project.Deployment)))
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(okEvent)
		}
	})
}
