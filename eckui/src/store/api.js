
import axios from 'axios';

export default class eckAPI {

    constructor(config, auth){
        this.data = {}
        this.url = config.baseUrl
        this.user = {}
        this.auth = auth
        this.getUser();
    }




    createConfig(){
        let token = window.sessionStorage.getItem("token");
        return {
            headers: {
              Authorization: 'Bearer ' + token //the token is a variable which holds the token
            }
           }
    }

    
    getUsers = () => {
        return axios.get(this.url + '/users', this.createConfig())
    }
    getPerms = () => {
        return axios.get(this.url + '/perms', this.createConfig()).then(resp => {
            this.auth.setPermissions(resp.data)
            return resp
        })
    }

    getProjects = () => {
        return axios.get(this.url + '/projects', this.createConfig())
    }

    getProject = (projectId) => {
        return axios.get(this.url + '/project/'+projectId, this.createConfig())
    }

    getProjectQuota = (projectId) => {
        return axios.get(this.url + '/project/'+projectId+'/quota', this.createConfig())
    }

    
    getProjectEvents = (projectId) => {
        return axios.get(this.url + '/project/'+projectId+'/events', this.createConfig())
    }

    deleteProject = (projectId) => {
        return axios.delete(this.url + '/project/'+projectId, this.createConfig())
    }


    getDeployment = (projectId, id) => {
        return axios.get(this.url + '/project/'+projectId+'/deployments/'+id,this.createConfig())
    }

    deleteDeployment = (projectId, id) => {
        return axios.delete(this.url + '/project/'+projectId+'/deployments/'+id,this.createConfig())
    }

    getDeploymentStatus = (projectId, id) => {
        return axios.get(this.url + '/project/'+projectId+'/deployments/'+id+"/status",this.createConfig())
    }
    getDeploymentEvents = (projectId, id) => {
        return axios.get(this.url + '/project/'+projectId+'/deployments/'+id+"/events",this.createConfig())
    }

    getDeploymentSecrets = (projectId, id) => {
        return axios.get(this.url + '/project/'+projectId+'/deployments/'+id+"/secrets",this.createConfig())
    }

    deleteDeploymentSecrets = (projectId, id) => {
        return axios.delete(this.url + '/project/'+projectId+'/deployments/'+id+"/secrets", this.createConfig())
    }
    

    getDeploymentElastic = (projectId, id) => {
        return axios.get(this.url + '/project/'+projectId+'/deployments/'+id+"/elasticsearch",this.createConfig())
    }

    getDeploymentKibana = (projectId, id) => {
        return axios.get(this.url + '/project/'+projectId+'/deployments/'+id+"/kibana",this.createConfig())
    }


    getDeployments = (projectId) => {
        return axios.get(this.url + '/project/'+projectId+'/deployments', this.createConfig())
    }

    createDeployments = (projectId, deployment) => {
        return axios.put(this.url + '/project/'+projectId+'/deployment', deployment, this.createConfig())
    }

    createProject = (project) => {
        return axios.put(this.url + '/projects', project, this.createConfig())
    }

    updateLicense = (license) => {
        return axios.put(this.url + '/license', license, this.createConfig())
    }
    getLicense = () => {
        return axios.get(this.url + '/license', this.createConfig())
    }

    getMetics = (projectId) => {
        return axios.get(this.url + '/project/'+projectId+'/metrics', this.createConfig())
    }

    login = (user) => {
        return axios.post(this.url + '/login', user).then(resp => {
            console.log("USER",resp)
            this.auth.update(resp.data)
            this.getPerms().then(() => {
                this.auth.update(resp.data)
            })
            return resp
        })
    }
    register = (user) => {
        return axios.post(this.url + '/user', user)
    }

    getUser = () => {
        return axios.get(this.url + '/user', this.createConfig()).then(resp => {
            this.getPerms().then(() => {
                this.auth.update(resp.data)
            })
            return resp
        })
    }
    deleteUser = (user) => {
        return axios.delete(this.url + '/user/'+user.username, this.createConfig())
    }
    updateUser = (user) => {
        return axios.post(this.url + '/user/'+user.username, user, this.createConfig())
    }
    createUser = (user) => {
        return axios.put(this.url + '/user', user, this.createConfig())
    }
}
