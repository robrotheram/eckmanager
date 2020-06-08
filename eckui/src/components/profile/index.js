import React, { Component } from 'react';
import { withRouter } from "react-router-dom"
import {
    EuiCodeBlock,
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiPageContentBody,
  EuiTitle,
  EuiFormRow,
  EuiSwitch,
  EuiButton,
  EuiAvatar,
  EuiFlexItem,
  EuiFlexGroup,
  EuiSpacer,
  EuiText,
  EuiCard,
  EuiIcon,
  EuiFieldText,
  EuiFieldPassword,
  EuiForm,
  EuiPage,
  EuiPageBody,
  EuiHorizontalRule

} from '@elastic/eui';
import eckApi from "../../store";
import {Warning, Success, Danger} from "../../store/notification"
import Users from '../settings/users'
class UserProfile extends Component {
    constructor(props) {
      super(props);
  
      this.state = {
        user : {
          username:"",
          first_name: "",
          last_name: "",
          password: "",
          password_confirm: ""
        }
      };
    }
      
     onTextChange = (e) =>{
       let user = this.state.user
        user[e.target.name] =  e.target.value
        this.setState({user: user})
      }
      
      isStrongPwd = (password) => {
          var regExp = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%&*()]).{8,}/;
          var validPassword = regExp.test(password);
          return validPassword;
      }
      
      updateUser = () => {
          let user = this.state.user;
          if(user.password){
            if (user.password !== user.password_confirm && user.password.length > 0) {
              Warning("User Profile","Passwords do not match")
              return
            }
            if (!this.isStrongPwd(user.password) && user.password.length > 0){
              Warning("User Profile", "Passwords not strong enough. Must contain 8 character a uppercase, digit and symbol")
              return
            }
          }

          eckApi.updateUser(user).then(resp =>{
            Success("User Profile", "User Updated");
          }).catch(error =>{
            console.log(error.response.data)
            Danger("User Profile", error.response.data);
          })
        }
            
        componentDidMount() {
      eckApi.getUser().then((response) => {
        this.setState({user: response.data})
      })  
      .catch(function (error) {
        console.log(error);
      });
    }



    render() {
        const user = this.state.user;
        return (
                <EuiPageContent>
                  <EuiPageContentHeader>
                  <EuiFlexGroup justifyContent="spaceBetween">
                        <EuiFlexItem grow={false}>
                    <EuiPageContentHeaderSection>
                          <EuiTitle>
                            <h1>User Profile</h1>
                          </EuiTitle>
                    </EuiPageContentHeaderSection>
                    </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiPageContentHeader>
                  <EuiPageContentBody>


                  <EuiFlexGroup>
                    <EuiFlexItem grow={false}>
                      <EuiFormRow display="center">
                        <EuiAvatar name={user.username} size="xl" />
                      </EuiFormRow>
                    </EuiFlexItem>
                    <EuiFlexItem>
                    <EuiFormRow label="Email:" fullWidth>
                            <EuiFieldText placeholder="Email"  name="username" value={user.username}  fullWidth aria-label="Email / Username" onChange={this.onTextChange} />
                          </EuiFormRow>
                    </EuiFlexItem>
                  </EuiFlexGroup>
    

            <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFormRow label="First Name:" fullWidth>
            <EuiFieldText placeholder="First name" name="first_name" value={user.first_name} fullWidth aria-label="First Name" onChange={this.onTextChange} />
          </EuiFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFormRow label="Last Name:" fullWidth>
            <EuiFieldText placeholder="Last name" name="last_name"  value={user.last_name} fullWidth aria-label="Last Name" onChange={this.onTextChange} />
          </EuiFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>
     
      <EuiSpacer/>
      <EuiHorizontalRule size="quarter" />
          <h3> Update Passwords:</h3>
          <EuiSpacer/>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFormRow label="Password:" fullWidth>
            <EuiFieldPassword fullWidth
              name="password"
              aria-label="Password"
              value={user.password}
              onChange={this.onTextChange}
            />
          </EuiFormRow>
          <EuiFormRow label="Confirm Password:" fullWidth>
            <EuiFieldPassword
              placeholder="Password"
              fullWidth
              name="password_confirm"
              value={user.password_confirm}
              aria-label="Password"
              onChange={this.onTextChange}
            />
          </EuiFormRow>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="l" />
      <EuiFlexGroup justifyContent="spaceEvenly">
        <EuiFlexItem grow={false} style={{ minWidth: 300 }}>
          <EuiButton type="submit" onClick={this.updateUser}>Update</EuiButton>
        </EuiFlexItem>
        
      </EuiFlexGroup>


















                
                  </EuiPageContentBody>
                </EuiPageContent>
        )}
                    }

export default (withRouter(UserProfile));