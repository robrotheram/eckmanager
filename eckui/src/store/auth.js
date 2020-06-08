class Auth {
    user = {
        username: "",
    }
    cb = {}

    perms = {}

    setPermissions = (data) => {
        console.log("PERM",data)
        this.perms = data
    }

    setCallback = (id, cbf) => {
        this.cb[id] = (cbf)
    }
    removeCallback = (id) => {
        let cb = this.cb
        if (this.cb !== undefined ){
            console.log(cb)
            delete cb[id];
            this.cb = cb
        }
        
    }

    callAllCallbacks = () => {
        Object.keys(this.cb).forEach(key => {
            this.cb[key](this.user)
        });
    }

    update(user){
        console.log("updating User:",user)
        this.user = user;
        window.sessionStorage.setItem("token", user.token);
        this.callAllCallbacks()
    }

    getUsername = () => {
        return this.user.username;
    }
    
    hasPermission = (role) => {
     if(this.user.role === undefined){
       return false
     }
     console.log(this.user.role)
     return(role === this.user.role.Name)

    }


    hasProjectAdmin = () => {
     return this.hasPermission("Project Admin Role")
    }

    
    hasProjectPermission = (project, action) => {
        if (this.hasProjectAdmin){
            return true;
        }
        if (this.perms[project] === undefined) {
            return false
        }
        return this.perms[project].filter(a => a === action).length === 1
    }
    
    hasEditor = () => {
        console.log("PERM", this.perms)
        return this.hasPermission("Project Admin Role") || this.hasPermission("Editor")
    }

    isAuthenticated = () =>{
     let token = window.sessionStorage.getItem("token");
     console.log("token", token)
     if (token !== undefined && token !== null) {
       return true;
     }
       return false
    }
 
   signout = () => {
     window.sessionStorage.removeItem("token");
     window.location.href = "/login";
     this.user = {}
   }
 };
 
export default Auth;