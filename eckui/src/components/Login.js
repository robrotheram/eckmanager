import React, { Component, Fragment } from "react";

import {
  EuiCard,
  EuiIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiFieldText,
  EuiFieldPassword,
  EuiFormRow,
  EuiSpacer,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiHorizontalRule,
} from "@elastic/eui";

import eckApi from "../store";
import { withRouter } from "react-router-dom"
import InnerBgImg from "../img/background.jpg";
import { Auth } from "../App";

const style = {
  width: "100%",
  height: "100%",
  background: `#000000 url(${InnerBgImg}) no-repeat left top`,
  backgroundSize: "cover",
  position: "fixed",
  top: "0px",
  bottom: "0px",
  left: "0px",
  right: "0px",
};

const pageStyle = {
  backgroundColor: "#fff0",
  border: "none",
  boxShadow: "none",
};

class LoginForm extends Component {

  constructor(props) {
    super(props);    
    this.state = {
      username: "test",
      password: "test",
    }; 
  }

  handleInputChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value
    });
  }

  submitForm = () => {
    console.log(this.state)
    eckApi.login(this.state).then((response) => {
      let token = response.data.token
      if (token !== undefined) {
        window.sessionStorage.setItem("token", token);
        Auth.user = response.data
        this.props.updateRoute()
      }
    
      console.log(response.data)
  
    
  })
  .catch(function (error) {
    console.log(error);
  });
  }

  render = () => {
  return (
    <Fragment>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFieldText
            placeholder="Username"
            fullWidth
            aria-label="Username"
            name="username"
            value={this.state.username}
            onChange={this.handleInputChange}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFieldPassword
            placeholder="Password"
            fullWidth
            aria-label="Password"
            name="password"
            value={this.state.password}
            onChange={this.handleInputChange}
          />
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="l" />
      <EuiFlexGroup justifyContent="spaceEvenly">
        <EuiFlexItem grow={false} style={{ minWidth: 300 }}>
          <EuiButton type="submit" onClick={this.submitForm} >Login</EuiButton>
        </EuiFlexItem>
        <EuiFlexItem
          grow={false}
          style={{ minWidth: 300 }}
          onClick={() => this.props.switch()}
        >
          <EuiButton type="submit" fill color="secondary">
            Register
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </Fragment>
  );
}
}

const RegisterForm = (props) => {
  return (
    <Fragment>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFormRow label="Email:" fullWidth>
            <EuiFieldText placeholder="Email" fullWidth aria-label="Email" />
          </EuiFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFormRow label="Password:" fullWidth>
            <EuiFieldPassword
              placeholder="Password"
              fullWidth
              aria-label="Password"
            />
          </EuiFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFormRow label="Repeat Password:" fullWidth>
            <EuiFieldPassword
              placeholder="Password"
              fullWidth
              aria-label="Password"
            />
          </EuiFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="l" />
      <EuiFlexGroup justifyContent="spaceEvenly">
        <EuiFlexItem grow={false} style={{ minWidth: 300 }}>
          <EuiButton type="submit">Register</EuiButton>
        </EuiFlexItem>
        <EuiFlexItem grow={false} style={{ minWidth: 300 }}>
          <EuiButton
            type="submit"
            fill
            color="secondary"
            onClick={() => props.switch()}
          >
            Back to login
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </Fragment>
  );
};

class AuthForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showRegister: false,
    };
  }

  switch = () => {
    this.setState({ showRegister: !this.state.showRegister });
  };

  updateRoute = () => {
    this.props.history.push("/projects")
  }  

  render() {
    const showRegister = this.state.showRegister;
    let title = "Log into ECK Manager";
    if (showRegister) {
      title = "Register for ECK Manager";
    }

    return (
      <EuiPage style={style}>
        <EuiPageBody component="div">
          <EuiPageContent
            verticalPosition="center"
            horizontalPosition="center"
            style={pageStyle}
          >
            <EuiCard
              icon={<EuiIcon size="xxl" type={`logoKubernetes`} />}
              title={title}
              description=""
            >
              <EuiHorizontalRule />
              {showRegister ? (
                <RegisterForm switch={this.switch} updateRoute={this.updateRoute}/>
              ) : (
                <LoginForm switch={this.switch} updateRoute={this.updateRoute}/>
              )}
            </EuiCard>
          </EuiPageContent>
        </EuiPageBody>
      </EuiPage>
    );
  }
}

export default withRouter(AuthForm)