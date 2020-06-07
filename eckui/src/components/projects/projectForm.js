import React, { Component, Fragment } from "react";

import {
  EuiPageContentHeader,
  EuiPageContent,
  EuiTitle,
  EuiButtonEmpty,
  EuiForm,
  EuiPageContentHeaderSection,
  EuiPageContentBody,
  EuiFieldNumber,
  EuiSpacer,
  EuiTextArea,
  EuiFormRow,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldText,
  EuiButton,
  EuiIcon,
  EuiLink,
  EuiPopover,
  EuiBasicTable,
  EuiHorizontalRule,
  EuiSelect

} from "@elastic/eui";

import eckApi  from "../../store";
import { withRouter } from "react-router-dom";

const options = [
  { value: 'Viewer', text: 'Viewer' },
  { value: 'Editor', text: 'Editor' },
];


const blankState = {
  "CPU": "",
  "Memory": "",
  "Disk": "",
  "Description": "",
  "Name": ""
}

class ProjectForm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      popOpen: false,
      Roles: [],
      role: {
        username: "",
        role: ""
      }
    };
  }

  componentDidMount() {
    console.log(this.props.match);
    if (this.props.match.params.id !== undefined ) {
      eckApi
        .getProject(
          this.props.match.params.id
        )
        .then((response) => {
          delete response.data.Deployment
          delete response.data.RoleMappings
          this.setState(response.data );
        })
        .catch(function (error) {
          console.log(error);
        });
      }
    }

  onTextChange = e => {
    this.setState({
      [e.target.name]: e.target.value,
    });
  };

  openPopUP = () => {
      this.setState({popOpen: true, role: {
        "username": "",
        "role" : options[0].value
      }});   
  }
  closePopUP = () => {
    this.setState({popOpen: false});
  }

  editUser = (user) => {
    console.log(user)
    if (user.role === ""){
      user.role = options[0].value 
    }
    this.setState({popOpen: true, role: user});
  }
  addUser = (user) => {
    function findIndexByProperty(data, key, value) {
        for (var i = 0; i < data.length; i++) {
            if (data[i][key] === value) {
                return i;
            }
        }
        return -1;
    }
    let users = this.state.Roles;
    var index = findIndexByProperty(users, 'username', user.username);
    if (index > -1) {
      users[index] = user;
    } else {
      users.push(user)
    }
    this.setState({Roles: users});
  }

  deleteUser = (user) => {
    let users = this.state.Roles;
    users = users.filter( obj => {return obj.username !== user.username})
    this.setState({Roles: users});
  }

  changeRoleUsername = e => {
    let role = this.state.role;
    role.username =  e.target.value
    this.setState({role: role});
  }

  changeRoleRole = e => {
    let role = this.state.role;
    role.role =  e.target.value
    this.setState({role: role});
  }

  clearForm = () => {
    this.setState(blankState);
  }
  onFormSave = () =>{
    let project = this.state;

    project.Cpu = parseInt(project.Cpu, 10);
    project.Memory = parseInt(project.Memory, 10)
    project.Disk = parseInt(project.Disk, 10)

    eckApi.createProject(project).then((response) => {
        console.log(response.data)
        this.props.history.push("/projects")
    })
    .catch(function (error) {
      console.log(error);
    });
  }


  

  render() {

    const actions = [
      {
        render: item => {
          return (
            <EuiLink  color="warning">
              <EuiIcon onClick= { () => this.editUser(item)} type="documentEdit" />
            </EuiLink>
          );
        },
      },
      {
        render: item => {
          return (
            <EuiLink  color="danger">
              <EuiIcon onClick= { () => this.deleteUser(item)} type="trash" />
            </EuiLink>
          );
        },
      },
      
    ]

    const columns = [
      {
        field: 'username',
        name: 'Username',
      },
      {
        field: 'role',
        name: 'Role',
      },
      {
        name: 'Actions',
        actions,
      },
    ];
  
  
    const getCellProps = (item, column) => {
      const { id } = item;
      const { field } = column;
      return {
        className: 'customCellClass',
        'data-test-subj': `cell-${id}-${field}`,
        textOnly: true,
      };
    };

    const button = (
      <EuiButtonEmpty
        iconSide="right"
        
        iconType="plusInCircle"
        onClick={this.openPopUP}>
        Add User
      </EuiButtonEmpty>
    );
 
    const formSample = (
      <EuiForm>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFormRow label="Username">
              <EuiFieldText icon="user" placeholder="John Doe" value={this.state.role.username} name="username" onChange={this.changeRoleUsername} />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFormRow label="Role">
            <EuiSelect id="selectDocExample" options={options} value={this.state.role.role} name="role" onChange={this.changeRoleRole}/>
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFormRow hasEmptyLabelSpace>
              <EuiButton onClick={() => {this.addUser(this.state.role); this.closePopUP()}}>Save</EuiButton>
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiForm>
    );

     return (
      <EuiPageContent>
        <EuiPageContentHeader>
          <EuiPageContentHeaderSection>
            <EuiTitle>
     {this.props.match.params.id !== undefined ? <h2>Project Edit</h2> : <h2>Project Create</h2> }
            </EuiTitle>
          </EuiPageContentHeaderSection>
        </EuiPageContentHeader>
        <EuiPageContentBody>
          <EuiForm>
            <EuiFormRow
              label="Project Name:"
              fullWidth
              helpText="Name of the project"
            >
              <EuiFieldText fullWidth name="Name" value={this.state.Name} onChange={this.onTextChange} />
            </EuiFormRow>

            <EuiFormRow
              label="Project Description:"
              fullWidth
              helpText="A few words to describe the project"
            >
              <EuiTextArea fullWidth name="Description" value={this.state.Description} onChange={this.onTextChange} />
            </EuiFormRow>
            <EuiSpacer size="m" />
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiFormRow
                  label="Project CPU Quota:"
                  fullWidth
                  helpText="Project CPU Quota"
                >
                  <EuiFieldNumber
                    placeholder="Placeholder text"
                    prepend="Cpu"
                    aria-label="Use aria labels when no actual label is in use"
                    name="Cpu" value={this.state.Cpu} onChange={this.onTextChange} 
                  />
                </EuiFormRow>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiFormRow
                  label="Project Memory Quota:"
                  fullWidth
                  helpText="Project Memory Quota in Gigabyes"
                >
                  <EuiFieldNumber
                    placeholder="Placeholder text"
                    prepend="Memory"
                    aria-label="Project Memory Quota in Gigabyes"
                    name="Memory" value={this.state.Memory} onChange={this.onTextChange} 
                  />
                </EuiFormRow>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiFormRow
                  label="Project Disk Quota:"
                  fullWidth
                  helpText="Project Disk Quota in Gigabyes"
                >
                  <EuiFieldNumber
                    placeholder="Placeholder text"
                    prepend="Disk"
                    aria-label="Use aria labels when no actual label is in use"
                    name="Disk" value={this.state.Disk} onChange={this.onTextChange} 
                  />
                </EuiFormRow>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer/>
            <EuiHorizontalRule />
           <Fragment> 
             <EuiPopover button={button} isOpen={this.state.popOpen} closePopover={this.closePopUP}><div style={{ width: 500 }}>{formSample}</div></EuiPopover>  
            <EuiBasicTable 
              items={this.state.Roles}
              rowHeader="firstName"
              columns={columns}
              cellProps={getCellProps}
            />
            </Fragment>
            <EuiSpacer />
            <EuiFlexGroup justifyContent="spaceBetween">
              <EuiFlexItem grow={false}>
                <EuiButton type="submit" fill onClick={this.onFormSave}>
                  Create Project
                </EuiButton>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton type="clear" color="danger" onClick={this.clearForm}>
                  Reset form
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiForm>
        </EuiPageContentBody>
      </EuiPageContent>
    );
  }
}

export default withRouter(ProjectForm)