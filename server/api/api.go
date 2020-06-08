package api

import (
	"errors"
	"fmt"
	"time"

	"github.com/gorilla/mux"
	"github.com/robrotheram/eckmanager/acl"
	"github.com/sirupsen/logrus"
	"k8s.io/client-go/dynamic"
	metrics "k8s.io/metrics/pkg/client/clientset/versioned"
)

var logger *logrus.Logger

type API struct {
	ds             acl.Datastore
	clientset      dynamic.Interface
	kubeMetrics    *metrics.Clientset
	requestTimeout time.Duration
}

func (api API) hasPermission(user acl.User, actions ...acl.Action) error {

	logger.Debugf("%v", user)
	logger.Debugf("%v", actions)

	for _, a := range actions {
		if user.Role.HasAction(a) {
			return nil
		}
	}
	message := fmt.Sprintf("User: %s does not have permission to execute this action", user.Username)
	return errors.New(message)
}

func InitAPI(ds acl.Datastore, client dynamic.Interface, metrics *metrics.Clientset, log *logrus.Logger) *API {
	logger = log
	api := API{ds: ds, requestTimeout: 10 * time.Second, clientset: client, kubeMetrics: metrics}
	return &api
}

func (api *API) InitApiRoutes(r *mux.Router) *mux.Router {
	r.Handle("/api/login", (api.login())).Methods("POST")
	r.Handle("/api/user", (api.createUser())).Methods("PUT")

	r.Handle("/api/user", api.AuthMiddleware(api.getUserInfo(), acl.PROJECT_VIEW, acl.VIEW)).Methods("Get")
	r.Handle("/api/perms", api.AuthMiddleware(api.getUserPermission(), acl.PROJECT_VIEW, acl.VIEW)).Methods("Get")
	r.Handle("/api/users", api.AuthMiddleware(api.getUsers(), acl.CREATE_PROJECT)).Methods("Get")

	r.Handle("/api/user/{id}", api.AuthMiddleware(api.getUserHandler(), acl.PROJECT_VIEW)).Methods("GET")
	r.Handle("/api/user/{id}", api.AuthMiddleware(api.updateUserHandler(), acl.VIEW, acl.PROJECT_VIEW)).Methods("POST")
	r.Handle("/api/user/{id}", api.AuthMiddleware(api.deteleUserHandler(), acl.PROJECT_VIEW)).Methods("DELETE")

	r.Handle("/api/project/{id}/role", api.AuthMiddleware(api.addRoleToProject(), acl.CREATE_PROJECT)).Methods("PUT")
	r.Handle("/api/project/{id}/metrics", api.AuthMiddleware(api.getProjectMetrics(), acl.PROJECT_VIEW, acl.VIEW)).Methods("GET")
	r.Handle("/api/project/{id}/events", api.AuthMiddleware(api.getProjectEvents(), acl.PROJECT_VIEW, acl.VIEW)).Methods("GET")
	r.Handle("/api/project/{id}/quota", api.AuthMiddleware(api.getProjectQuota(), acl.PROJECT_VIEW, acl.VIEW)).Methods("GET")

	r.Handle("/api/project/{id}", api.AuthMiddleware(api.getProjectHandler(), acl.PROJECT_VIEW, acl.VIEW)).Methods("GET")
	r.Handle("/api/project/{id}", api.AuthMiddleware(api.deleteProjectMetrics(), acl.CREATE_PROJECT)).Methods("DELETE")

	r.Handle("/api/projects", api.AuthMiddleware(api.getProjectHandler(), acl.PROJECT_VIEW, acl.VIEW)).Methods("GET")

	r.Handle("/api/projects", api.AuthMiddleware(api.createProjects(), acl.CREATE_PROJECT)).Methods("PUT")

	r.Handle("/api/license", api.AuthMiddleware(api.updateLicense(), acl.CREATE_PROJECT)).Methods("PUT")
	r.Handle("/api/license", api.AuthMiddleware(api.getLicense(), acl.CREATE_PROJECT)).Methods("GET")

	// /*CREATE DEPLOYMENTS*/
	r.Handle("/api/project/{id}/deployment", api.AuthMiddleware(api.createDeployment(), acl.CREATE_PROJECT, acl.Create, acl.Edit)).Methods("PUT")
	r.Handle("/api/project/{id}/deployments", api.AuthMiddleware(api.getDeploymentHanadler(), acl.PROJECT_VIEW, acl.VIEW)).Methods("GET")
	r.Handle("/api/project/{id}/deployments/{deployment_id}", api.AuthMiddleware(api.getDeploymentHandler(), acl.PROJECT_VIEW, acl.VIEW)).Methods("GET")
	r.Handle("/api/project/{id}/deployments/{deployment_id}/status", api.AuthMiddleware(api.getDeploymentStatus(), acl.PROJECT_VIEW, acl.VIEW)).Methods("GET")
	r.Handle("/api/project/{id}/deployments/{deployment_id}/events", api.AuthMiddleware(api.getDeploymentEvents(), acl.PROJECT_VIEW, acl.VIEW)).Methods("GET")
	r.Handle("/api/project/{id}/deployments/{deployment_id}", api.AuthMiddleware(api.detleteDeploymentHandler(), acl.CREATE_PROJECT, acl.Create, acl.Edit)).Methods("DELETE")

	r.Handle("/api/project/{id}/deployments/{deployment_id}/elasticsearch", api.AuthMiddleware(api.getDeploymentElasticsearchHanadler(), acl.PROJECT_VIEW, acl.VIEW)).Methods("GET")
	r.Handle("/api/project/{id}/deployments/{deployment_id}/kibana", api.AuthMiddleware(api.getDeploymentKibanaHanadler(), acl.PROJECT_VIEW, acl.VIEW)).Methods("GET")
	r.Handle("/api/project/{id}/deployments/{deployment_id}/secrets", api.AuthMiddleware(api.getDeploymentSecrets(), acl.PROJECT_VIEW, acl.VIEW)).Methods("GET")
	r.Handle("/api/project/{id}/deployments/{deployment_id}/secrets", api.AuthMiddleware(api.deleteDeploymentSecrets(), acl.CREATE_PROJECT, acl.Create, acl.Edit)).Methods("DELETE")
	return r
}
