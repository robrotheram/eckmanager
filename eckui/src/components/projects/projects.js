import React, { Component } from 'react';
import { withRouter } from "react-router-dom"
import {
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiPageContentBody,
  EuiTitle,
  EuiSpacer,
  EuiFlexGrid,
  EuiCard,
  EuiButton,
  EuiFlexItem,
  EuiFlexGroup,
} from '@elastic/eui';
import eckApi from "../../store";
import { Auth } from "../../App"


class Projects extends Component {
    constructor(props) {
      super(props);
  
      this.state = {
        isSideNavOpenOnMobile: false,
        selectedItemName: 'Lion stuff',
        projects:[]
      };
    }
  

    componentDidMount() {
      eckApi.getProjects().then((response) => {
        if (Array.isArray(response.data)){
          console.log(response.data)
          this.setState({projects: response.data})
        }
      })
      .catch(function (error) {
        console.log(error);
      });
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
        console.log("auth",Auth.user)
        return (
                <EuiPageContent>
                  <EuiPageContentHeader>
                  <EuiFlexGroup justifyContent="spaceBetween">
                        <EuiFlexItem grow={false}>
                    <EuiPageContentHeaderSection>
                          <EuiTitle>
                            <h2>Project list</h2>
                          </EuiTitle>
                    </EuiPageContentHeaderSection>
                    </EuiFlexItem>
                      {Auth.hasProjectAdmin() &&
                        <EuiFlexItem grow={false}>
                          <EuiButton fill onClick={() => this.props.history.push("/projects/create")}>
                            Create Project
                          </EuiButton>
                        </EuiFlexItem>
                      }
                      </EuiFlexGroup>
                  </EuiPageContentHeader>
                  <EuiPageContentBody>

                 <EuiSpacer size="m" />
                    <EuiFlexGrid gutterSize="l" columns={4}>
                    { this.state.projects.map((item, index) => {
                      return (
                        <EuiFlexItem key={index}>
                          <EuiCard
                            title={item.Name}
                            
                            description={item.Description}
                            onClick={() =>  this.props.history.push("/project/"+item.Id)}
                          />
                        </EuiFlexItem>
                      );
                      })}
                    </EuiFlexGrid>
                  </EuiPageContentBody>
                </EuiPageContent>
        )}
                    }

export default (withRouter(Projects));