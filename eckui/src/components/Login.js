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
  EuiForm,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiHorizontalRule,
} from "@elastic/eui";

import eckApi from "../store";
import { withRouter } from "react-router-dom";
import InnerBgImg from "../img/background.jpg";

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
      username: "admin",
      password: "y1cs3SPu",
    };
  }

  handleInputChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value,
    });
  };

  submitForm = () => {
    console.log(this.state);
    eckApi
      .login(this.state)
      .then((response) => {
        let token = response.data.token;
        console.log(response);
        if (token !== undefined) {
          this.props.updateRoute();
        }
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  render = () => {
    return (
      <Fragment>
        <EuiForm
          onKeyUp={(e) => {
            if (e.keyCode === 13) {
              e.preventDefault();
              this.submitForm();
            }
          }}
        >
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
              <EuiButton type="submit" onClick={this.submitForm}>
                Login
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem
              grow={false}
              style={{ minWidth: 300 }}
              onClick={() => this.props.switch()}
            >
              <EuiButton type="cancel" fill color="secondary">
                Register
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiForm>
      </Fragment>
    );
  };
}

const RegisterForm = (props) => {
  let user = {
    username: "",
    first_name: "",
    last_name: "",
    password: "",
    password_confirm: "",
  };

  let onTextChange = (e) => {
    user[e.target.name] = e.target.value;
  };

  function isStrongPwd(password) {
    var regExp = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%&*()]).{8,}/;

    var validPassword = regExp.test(password);

    return validPassword;
  }

  let register = () => {
    if (user.password !== user.password_confirm) {
      alert("Passwords do not match");
    } else {
      if (!isStrongPwd(user.password)) {
        alert(
          "Passwords not strong enough. Must contain 8 character a uppercase, digit and symbol"
        );
      } else {
        eckApi
          .createUser(user)
          .then((resp) => {
            props.switch();
          })
          .catch((error) => {
            console.log(error);
          });
      }
    }
  };

  return (
    <Fragment>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFormRow label="First Name:" fullWidth>
            <EuiFieldText
              placeholder="First name"
              name="first_name"
              fullWidth
              aria-label="Email"
              onChange={onTextChange}
            />
          </EuiFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFormRow label="Last Name:" fullWidth>
            <EuiFieldText
              placeholder="Last name"
              name="last_name"
              fullWidth
              aria-label="Email"
              onChange={onTextChange}
            />
          </EuiFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFormRow label="Email:" fullWidth>
            <EuiFieldText
              placeholder="Email"
              name="username"
              fullWidth
              aria-label="Email"
              onChange={onTextChange}
            />
          </EuiFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFormRow label="Password:" fullWidth>
            <EuiFieldPassword
              placeholder="Password"
              fullWidth
              name="password"
              aria-label="Password"
              onChange={onTextChange}
            />
          </EuiFormRow>
          <EuiFormRow label="Confirm Password:" fullWidth>
            <EuiFieldPassword
              placeholder="Password"
              fullWidth
              name="password_confirm"
              aria-label="Password"
              onChange={onTextChange}
            />
          </EuiFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="l" />
      <EuiFlexGroup justifyContent="spaceEvenly">
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
        <EuiFlexItem grow={false} style={{ minWidth: 300 }}>
          <EuiButton type="submit" onClick={register}>
            Register
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
    this.props.history.push("/projects");
  };

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
                <RegisterForm
                  switch={this.switch}
                  updateRoute={this.updateRoute}
                />
              ) : (
                <LoginForm
                  switch={this.switch}
                  updateRoute={this.updateRoute}
                />
              )}
            </EuiCard>
          </EuiPageContent>
        </EuiPageBody>
      </EuiPage>
    );
  }
}

export default withRouter(AuthForm);
