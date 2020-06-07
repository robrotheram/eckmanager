import {config} from './index'
import axios from 'axios';


export default class eckAPI {

    constructor(){
        this.data = {}
        this.url = config.baseUrl
    }


    createConfig(){
        let token = window.sessionStorage.getItem("token");
        return {
            headers: {
              Authorization: 'Bearer ' + token //the token is a variable which holds the token
            }
           }
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
        return axios.post(this.url + '/login', user)
    }
    register = (user) => {
        return axios.post(this.url + '/user', user)
    }

    getUser = () => {
        return axios.get(this.url + '/user', this.createConfig())
    }
}
