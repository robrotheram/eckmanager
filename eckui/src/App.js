import React, {Component}from "react";
import {
  BrowserRouter as Router,
  Route,
  Redirect
} from "react-router-dom";

import {
  EuiPage,
} from '@elastic/eui';

import Header from './components/header';
import {Deployments, DeploymentForm, DeploymentView} from './components/deployments';
import {ProjectList, ProjectForm} from './components/projects';


import Login from "./components/Login";
import eckAPI, {Notifications} from "./store";
import Settings from "./components/settings";
// This site has 3 pages, all of which are rendered
// dynamically in the browser (not server rendered).
//
// Although the page does not ever refresh, notice how
// React Router keeps the URL up to date as you navigate
// through the site. This preserves the browser history,
// making sure things like the back button and bookmarks
// work properly.

// A wrapper for <Route> that redirects to the login
// screen if you're not yet authenticated.




export const Auth = {
   user:{},
   hasPermission(role){
    if(this.user.role === undefined){
      return false
    }
    console.log(this.user.role)
    return(role === this.user.role.Name)
   },
   hasProjectAdmin(){
    return this.hasPermission("Project Admin Role")
   },
   isAuthenticated(){
    let token = window.sessionStorage.getItem("token");
    console.log("token", token)
    if (token !== undefined && token !== null) {
      return true;
    }
      return false
   },

  signout() {
    window.sessionStorage.removeItem("token");
    window.location.href = "/login";
  }
};



function PrivateRoute({ children, ...rest }) {
  async function asyncCall() {
    eckAPI.getUser().then((response) => {
      Auth.user = response.data; 
    }).catch(function (error) {
      Auth.signout();
    });
  }
  if(Auth.isAuthenticated()){asyncCall()}
  return (
    <Route
      {...rest}
      render={({ location }) =>
        Auth.isAuthenticated() ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: "/login",
              state: { from: location }
            }}
          />
        )
      }
    />
  );
}

export default class extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isSideNavOpenOnMobile: false,
      selectedItemName: 'Lion stuff',
    };
  }

  toggleOpenOnMobile = () => {
    this.setState({
      isSideNavOpenOnMobile: !this.state.isSideNavOpenOnMobile,
    });
  };

  selectItem = name => {
    this.setState({
      selectedItemName: name,
    });
  };

  createItem = (name, data = {}) => {
    // NOTE: Duplicate `name` values will cause `id` collisions.
    return {
      ...data,
      id: name,
      name,
      isSelected: this.state.selectedItemName === name,
      onClick: () => this.selectItem(name),
    };
  };

  render() {
    return (
      <Router >
        <Header/> 
        <EuiPage className="euiNavDrawerPage">
                  
                  <PrivateRoute path="/project/:id" exact><Deployments/></PrivateRoute>
                  <PrivateRoute path="/projects/create" exact><ProjectForm/></PrivateRoute>

                 
                  <PrivateRoute path="/projects/:id/create" ><DeploymentForm/></PrivateRoute>
                  <PrivateRoute path="/projects/:id/edit" ><ProjectForm/></PrivateRoute>
                  
                  <PrivateRoute path="/project/:id/:depoyment_id" exact><DeploymentView/></PrivateRoute>  

                  <PrivateRoute path="/project/:id/:depoyment_id/edit" ><DeploymentForm/></PrivateRoute>
                  
                  <Route path="/login" exact><Login/></Route>
                  <PrivateRoute path="/project" exact><ProjectList/></PrivateRoute>
                  <PrivateRoute path="/settings" exact><Settings/></PrivateRoute>
                  <Route path="/projects" exact>
                    <Redirect to={{pathname: "/project" }} />
                  </Route>
                  <Route path="/" exact>
                    <Redirect to={{pathname: "/projects" }} />
                  </Route>
        <Notifications/>
        </EuiPage>
      </Router>
    );
  }
}