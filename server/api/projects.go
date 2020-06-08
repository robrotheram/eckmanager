package api

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/context"
	"github.com/gorilla/mux"
	"github.com/robrotheram/eckmanager/acl"
	"github.com/robrotheram/eckmanager/audit"
	"github.com/robrotheram/eckmanager/containerMetrics"
)

func (a *API) createProjects() http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user := context.Get(r, "user").(*acl.User)

		var project acl.Project
		err := json.NewDecoder(r.Body).Decode(&project)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}

		if project.Cpu == 0 {
			project.Cpu = 4
		}
		if project.Memory == 0 {
			project.Memory = 4
		}

		if len(project.Roles) > 0 {
			project.CovertRolesToMappings()
		}
		if len(project.RoleMappings) == 0 {
			project.RoleMappings = append(project.RoleMappings, acl.CreateRoleUserMapping(user.Username, acl.Platform_ADMIN))
		}

		project.CreateNamespace(a.clientset)
		containerMetrics.AddNamespaceMetrics(project, a.kubeMetrics)
		err = project.CreateResourceQuota(a.clientset)
		err = project.CreateLimitRange(a.clientset)

		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}

		oldproject, err := a.GetProject(project.Id)
		if err != nil {
			err = project.Save(a.ds)
			if err != nil {
				w.WriteHeader(http.StatusBadRequest)
				w.Write([]byte(err.Error()))
				return
			}
		} else {
			oldproject.UpdateWithProject(project)
			logger.Debug(project)
			logger.Debug(oldproject)
			err = oldproject.Update(a.ds)

			if err != nil {
				w.WriteHeader(http.StatusBadRequest)
				w.Write([]byte(err.Error()))
				return
			}
		}

		audit.AuditWithRequest(r, "Create", "Project Create", fmt.Sprintf("Project Create %s", project.Name))
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(okEvent)
	})
}

func (a *API) addRoleToProject() http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := mux.Vars(r)["id"]
		project, err := a.GetProject(id)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}
		var result map[string]interface{}
		json.NewDecoder(r.Body).Decode(&result)
		username := result["username"]
		roleName := result["role"]
		if username == nil || roleName == nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte("Invaild Request"))
			return
		}
		_, err = a.getUser(username.(string))
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}
		role, err := acl.RoleFromString(roleName.(string))
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}
		project.AddRole(acl.CreateRoleUserMapping(username.(string), role))
		err = project.Save(a.ds)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}
		audit.AuditWithRequest(r, "Create", "Project Role", fmt.Sprintf("Added Role %s to Project %s", roleName.(string), project.Name))
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(okEvent)
	})
}

func (a *API) GetProjects() ([]acl.Project, error) {
	projets, err := a.ds.GetAllProjects(a.clientset)
	if err != nil {
		return projets, err
	}
	for i, p := range projets {
		p.CovertMappingToRoles()
		projets[i] = p
	}
	return a.ds.GetAllProjects(a.clientset)
}

func (a *API) GetProject(id string) (acl.Project, error) {
	project := acl.Project{Id: id}
	err := project.Get(a.ds, a.clientset)
	project.CovertMappingToRoles()
	return project, err
}

func (a *API) getProjectHandler() http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := mux.Vars(r)["id"]
		userIterface := context.Get(r, "user")
		if userIterface == nil {
			return
		}
		user := userIterface.(*acl.User)

		if id != "" {
			project, err := a.GetProject(id)
			if err != nil {
				w.WriteHeader(http.StatusBadRequest)
				w.Write([]byte(err.Error()))
				return
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(project)
			return
		}
		projects, err := a.GetProjects()
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}

		filterProjects := []acl.Project{}
		for _, p := range projects {

			if p.HasPermission(*user, []acl.Action{acl.VIEW, acl.PROJECT_VIEW}) || user.Role.Name == acl.Platform_ADMIN.Name {
				filterProjects = append(filterProjects, p)
			}
		}
		audit.AuditWithRequest(r, "GET", "Projects", fmt.Sprintf("Returned %d objects", len(filterProjects)))
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(filterProjects)
	})
}

func (a *API) getProjectMetrics() http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := mux.Vars(r)["id"]
		project, err := a.GetProject(id)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}

		for _, m := range containerMetrics.GetNamespaceMetrics(project.Id) {
			if len(m.Metrics) != 0 {
				m.PrintMetrics()
			}
		}

		audit.AuditWithRequest(r, "GET", "Project Metircs", fmt.Sprintf("Project Metircs %s", project.Name))

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(containerMetrics.GetNamespaceMetrics(project.Id))

	})
}
func (a *API) deleteProjectMetrics() http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := mux.Vars(r)["id"]
		project, err := a.GetProject(id)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}

		project.DeleteNamespace(a.clientset)
		project.Delete(a.ds)

		audit.AuditWithRequest(r, "DELETE", "Project Metrics", fmt.Sprintf("Project Metrics %s", project.Name))
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(okEvent)

	})
}

func (a *API) getProjectEvents() http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := mux.Vars(r)["id"]
		project, err := a.GetProject(id)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}

		audit.AuditWithRequest(r, "GET", "Project Events", fmt.Sprintf("Project Events %s", project.Name))
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(project.GetEvents(a.clientset, ""))

	})
}

func (a *API) getProjectQuota() http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := mux.Vars(r)["id"]
		project, err := a.GetProject(id)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}
		audit.AuditWithRequest(r, "GET", "Project Quota", fmt.Sprintf("Project Quota %s", project.Name))
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(project.GetQuota(a.clientset, ""))

	})
}

func (a *API) updateLicense() http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var licence acl.Licence
		err := json.NewDecoder(r.Body).Decode(&licence)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}
		err = licence.GenerateLicense(a.clientset)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}
		audit.AuditWithRequest(r, "UPDATE", "Licence", "Update Licence")
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(okEvent)
	})
}

func (a *API) getLicense() http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		license := acl.Licence{}
		data, err := license.GetLicense(a.clientset)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}
		audit.AuditWithRequest(r, "GET", "Licence", "Found Licence")
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(data)
	})
}
