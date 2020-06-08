import React, { Component } from 'react';
import { withRouter } from "react-router-dom"
import {
  EuiConfirmModal,
    EuiOverlayMask,
    EuiBasicTable,
    EuiModal,
    EuiModalHeaderTitle,
    EuiFlexGroup,
    EuiCopy,
    EuiButtonIcon,
    EuiFlexItem,
  EuiModalHeader,
  EuiModalBody,
  EuiButton,
  EuiModalFooter,
  EuiButtonEmpty,
  EuiFormRow,
  EuiForm,
  EuiFieldText,
  EuiSelect
} from '@elastic/eui';
import eckApi from "../../store";
import moment from 'moment'

function generatePassword (length) {
	var password = '', character; 
	while (length > password.length) {
		if (password.indexOf(character = String.fromCharCode(Math.floor(Math.random() * 94) + 33), Math.floor(password.length / 94) * 94) < 0) {
			password += character;
		}
	}
	return password;
}

class Users extends Component {
    constructor(props) {
      super(props);
  
      this.state = {
        users: [],
        user: {},
        isDestroyModalVisible : false,
        isEditModalVisible  : false,
        
      };
    }
      
    closeModal = () => {
      this.setState({isDestroyModalVisible: false, isEditModalVisible  : false})
    };

    showDestroyModal = (item) => {
      this.setState({isDestroyModalVisible: true, user: item})
    };
    showEditModal = (item) => {
      this.setState({isEditModalVisible: true, user: item})
    };

    saveEditModal = () =>{
      eckApi.updateUser(this.state.user).then((response) => {
        this.setState({isDestroyModalVisible: false, isEditModalVisible  : false})
        this.getUserList()
      })
      .catch(function (error) {
        console.log(error);
      });
    }

    DeleteModal = () =>{
      eckApi.deleteUser(this.state.user).then((response) => {
        this.setState({isDestroyModalVisible: false, isEditModalVisible  : false})
        this.getUserList()
      })
      .catch(function (error) {
        console.log(error);
      });
    }
    componentDidMount() {
      this.getUserList()
    }

    getUserList = () =>{
      eckApi.getUsers().then((response) => {
        let data = response.data
        this.setState({users: data})
      })
      .catch(function (error) {
        console.log(error);
      });
    }

    onUserTextChange = (e) =>{
      let user = this.state.user
      user[e.target.name] =  e.target.value
      this.setState({
        user: user
      });

    }
    onUserSelectChange = (e) =>{
      let user = this.state.user
      user.role.ID = e.target.value
      this.setState({
        user: user
      });
    }

    onUserNewPassword = () =>{
      let user = this.state.user
      user["password"] =  generatePassword(20)

      console.log(user)
      this.setState({
        user: user
      });

    }
    

    render() {
      let destroyModal;
      if (this.state.isDestroyModalVisible) {
        destroyModal = (
          <EuiOverlayMask>
            <EuiConfirmModal
              title={"Do Delete User: "+this.state.user.username}
              onCancel={this.closeModal}
              onConfirm={this.DeleteModal}
              cancelButtonText="Cancel"
              confirmButtonText="Delete User"
              buttonColor="danger"
              defaultFocusedButton="confirm">
              <p>Are you sure you want to delete this user </p>
            </EuiConfirmModal>
          </EuiOverlayMask>
        );
      }
      let modal;
      if (this.state.isEditModalVisible) {
        modal = (
          <EuiOverlayMask>
            <EuiModal onClose={this.closeModal} initialFocus="[name=popswitch]" style={{width:"800px"}}>
              <EuiModalHeader>
              <EuiModalHeaderTitle>Edit User: {this.state.user.username}</EuiModalHeaderTitle>
              </EuiModalHeader>

              <EuiModalBody>
                <EuiForm component="form">
                  <EuiFormRow fullWidth label="First Name" helpText="Edit users first name.">
                    <EuiFieldText value={this.state.user.first_name} name="first_name" onChange={this.onUserTextChange} fullWidth />
                  </EuiFormRow>
                  <EuiFormRow  fullWidth label="Last Name" helpText="Edit users last name.">
                    <EuiFieldText value={this.state.user.last_name} name="last_name" onChange={this.onUserTextChange} fullWidth/>
                  </EuiFormRow>
          
                  <EuiFormRow fullWidth label="Select Role">
        <EuiSelect
          fullWidth
          value={this.state.user.role.ID}
          onChange={this.onUserSelectChange}
          options={[
            { value: 'Platform_ADMIN', text: 'Platform Admin Role' },
             {value: 'Platform_VIEWER', text: 'Platform Viewer Role' },
            { value: 'Editor', text: 'Project Editor Role' },
            { value: 'Viewer', text: 'Project Viewer Role' },
          ]}
        />
      </EuiFormRow>
      <EuiFormRow fullWidth>

      <EuiFlexGroup>
      <EuiFlexItem grow={false}>
        <EuiFormRow display="center">
        <EuiButton onClick={this.onUserNewPassword} fill>
                  Reset Password
                </EuiButton>
        </EuiFormRow>
      </EuiFlexItem>
      {(this.state.user.password !== undefined && this.state.user.password !== "") && 
      <EuiFlexItem>
        <EuiFormRow fullWidth>
          <EuiFieldText placeholder="password"  name="password" value={this.state.user.password}  fullWidth aria-label="password" disabled />
        </EuiFormRow>
       </EuiFlexItem>
      }
      {(this.state.user.password !== undefined && this.state.user.password !== "") && 
       <EuiFlexItem grow={false}>
        <EuiFormRow fullWidth>
        <EuiCopy textToCopy={this.state.user.password}>
        {copy => <EuiButtonIcon iconType="copy" onClick={copy} style={{"marginTop":"10px"}}/>}
      </EuiCopy>
        </EuiFormRow>
       </EuiFlexItem>
     
      }

    </EuiFlexGroup>

    </EuiFormRow>

                </EuiForm>  
              </EuiModalBody>

              

              <EuiModalFooter>
                <EuiButtonEmpty onClick={this.closeModal}>Cancel</EuiButtonEmpty>

                <EuiButton onClick={this.saveEditModal} fill>
                  Save
                </EuiButton>
              </EuiModalFooter>
            </EuiModal>
          </EuiOverlayMask>
        );
      }


        const columns = [
          {
            field: 'username',
            name: 'Username',
          },
            {
              field: 'first_name',
              name: 'First Name',
              sortable: true,
              'data-test-subj': 'firstNameCell',

            },
            {
              field: 'last_name',
              name: 'Last Name',
            },
            
            {
              field: 'created_time',
              name: 'Date Created',
              dataType: 'date',
              render: d => moment(d).format('DD-MM-YYYY HH:mm')
            },
            {
              field: 'last_active',
              name: 'Last Active Created',
              dataType: 'date',
              render: d => moment(d).format('DD-MM-YYYY HH:mm')
            },
            {
              field: 'role',
              name: 'Role',
              render: role => role.Name
            },
            {
              name: 'Actions',
              actions: [
                  
                  {
                    name: 'Edit',
                    isPrimary: true,
                    description: 'Edit this user',
                    icon: 'pencil',
                    type: 'icon',
                    onClick: this.showEditModal,
                    'data-test-subj': 'action-edit',
                  },
                  {
                    name: 'Delete',
                    description: 'Delete this user',
                    icon: 'trash',
                    color: 'danger',
                    type: 'icon',
                    onClick: this.showDestroyModal,
                    isPrimary: true,
                    'data-test-subj': 'action-delete',
                  }
                ]
            },
            
          ];
        const getRowProps = item => {
            const { id } = item;
            return {
              'data-test-subj': `row-${id}`,
              className: 'customRowClass',
              
            };
          };
        
          const getCellProps = (item, column) => {
            const { id } = item;
            const { field } = column;
            return {
              className: 'customCellClass',
              'data-test-subj': `cell-${id}-${field}`,
              textOnly: true,
            };
          };

        return (
          <div>
            <EuiBasicTable
            items={this.state.users}
            rowHeader="firstName"
            columns={columns}
            rowProps={getRowProps}
            cellProps={getCellProps}
          />
          {destroyModal}
          {modal}
          </div>
        )
    }
}

export default (withRouter(Users));