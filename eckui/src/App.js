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
import eckAPI, {Notifications, Auth} from "./store";
import Settings from "./components/settings";

function PrivateRoute({ children, ...rest }) {
  // async function asyncCall() {
  //   eckAPI.getUser().then().catch(function (error) {
  //     Auth.signout();
  //   });
  // }

  // if(Auth.isAuthenticated()){asyncCall()}
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

  componentDidMount() {
    this.interval = setInterval(() => {
      if(Auth.isAuthenticated()){
        eckAPI.getUser();
      }
    }, 10000);
  }
  componentWillUnmount() {
    clearInterval(this.interval);
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