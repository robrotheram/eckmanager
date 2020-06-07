import React, { Component } from 'react';

import {
  EuiFieldSearch,
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiPageContentBody,
  EuiIcon,
  EuiTitle,
  EuiSpacer,
  EuiFlexGrid,
  EuiCard,
  EuiFlexItem,
  EuiText,
  EuiProgress,
  EuiFlexGroup,
  EuiButton,
  EuiFieldText
  
} from '@elastic/eui';
import { withRouter } from "react-router-dom"

import eckApi, {Auth }from "../../store";
import { EuiHorizontalRule } from '@elastic/eui';
import EventsView from './../events'


const cardStatusStyle =  {
  "position": "absolute",
  "top": "10px",
  "right": "10px",
  "padding": "2px",
  "border": "1px solid #D3DAE6",
  "borderRadius": "5px",
}
class DeploymentCard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      status : {}
    };
  }
  componentDidMount() {
    eckApi.getDeploymentStatus(this.props.project, this.props.item.name).then((response) => {
  
        console.log(response.data)
        this.setState({status: response.data})

    })
    .catch(function (error) {
      console.log(error);
    });
   
  }
  render() {
  const item = this.props.item;
  let status = "green"
  for (let element of Object.values(this.state.status)) {
    const result = element.filter(node => node.health !== "green");
    if (result.length > 0) {
      status = result[0].health;
      break
    }
  }
    


  return (
    <EuiCard
      title={item.name}
      style={{"position": "relative"}}
      >
      <div style={cardStatusStyle}>{status==="green"? <EuiIcon type="check" size="xl" color="success"/> : <EuiIcon type="alert" size="xl" color="warning"/>}</div>
      {item.version}
      <EuiHorizontalRule size="quarter" />
      <EuiFieldText value={"https://"+item.elasticsearch.Id+"."+item.base_url} prepend={[<EuiIcon type="logoElasticsearch" />]} readOnly={true} />
      <EuiSpacer size="s" />
      <EuiFieldText value={"https://"+item.kibana.Id+"."+item.base_url}  prepend={[<EuiIcon type="logoKibana" />]} readOnly={true} />


      </EuiCard>
  )
}
}














class Deployments extends Component {
    constructor(props) {
      super(props);
  
      this.state = {
        isSideNavOpenOnMobile: false,
        selectedItemName: 'Lion stuff',
        deployments: [],
        quota:{
          Percentage:{}
        }
      };
    }
  
    componentDidMount() {
      if (this.props.match.params.id !== undefined){
        console.log(this.props.match.params)
        eckApi.getDeployments(this.props.match.params.id).then((response) => {
          if (Array.isArray(response.data)){
            console.log(response.data)
            this.setState({deployments: response.data})
          }
        })
        .catch(function (error) {
          console.log(error);
        });

        eckApi.getProjectQuota(this.props.match.params.id).then((response) => {
          if (Array.isArray(response.data)){
            let quota = response.data[0]

            quota.Used.CPU = quota.Used.CPU.replace(/\D/g,'');
            quota.Used.Memory = quota.Used.Memory.replace(/\D/g,'');
            quota.Limits.CPU = quota.Limits.CPU.replace(/\D/g,'');
            quota.Limits.Memory = quota.Limits.Memory.replace(/\D/g,'');



            let cpu = quota.Used.CPU / (quota.Limits.CPU * 1000)
            let memory = quota.Used.Memory / (quota.Limits.Memory)

            let cpuStatus = "success"
            let memoryStatus = "success"
            if (cpu > 0.75){ cpuStatus = "warning" }
            if (cpu > 0.9){ cpuStatus = "danger" }
            if (memory > 0.75){ memoryStatus = "warning" }
            if (memory > 0.9){ memoryStatus = "danger" }



            quota.Percentage = {
              CPU: cpu.toFixed(2),
              CPUStatus: cpuStatus,
              Memory: memory.toFixed(2),
              MemoryStatus: memoryStatus
            }
            
            this.setState({quota: quota})
          }
        })
        .catch(function (error) {
          console.log(error);
        });




      }
    }

    toggleOpenOnMobile = () => {
      this.setState({
        isSideNavOpenOnMobile: !this.state.isSideNavOpenOnMobile,
      });
    };

    deleteProject = () => {
      eckApi.deleteProject(this.props.match.params.id).then(() => {
        this.props.history.push("/projects")
      })
      .catch(function (error) {
        console.log(error);
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
        let quota  = this.state.quota
        return (
                <EuiPageContent>
                  <EuiPageContentHeader>
                  <EuiFlexGroup fullWidth justifyContent="spaceBetween">
                        <EuiFlexItem grow={false}>
                          <EuiPageContentHeaderSection>
                                <EuiTitle>
                                  <h2>Deployment list</h2>
                                </EuiTitle>
                          </EuiPageContentHeaderSection>
                    </EuiFlexItem>

                       <EuiFlexItem grow={false}>
                          <EuiFlexGroup fullWidth justifyContent="spaceBetween">
                          {Auth.hasProjectPermission(this.props.match.params.id, "Edit") &&
                          <EuiFlexItem grow={false}>
                          <EuiButton fill onClick={() => this.props.history.push("/projects/"+this.props.match.params.id+"/create")}>
                            Create Deployment
                          </EuiButton>
                          </EuiFlexItem>
    } 
                          {Auth.hasProjectAdmin() &&
                          <EuiFlexItem grow={false}>
                          <EuiButton fill onClick={() => this.props.history.push("/projects/"+this.props.match.params.id+"/edit")}>
                            Edit Project
                          </EuiButton>
                          </EuiFlexItem>
                          }
                          {Auth.hasProjectAdmin() &&
                          <EuiFlexItem grow={false}>
                          <EuiButton fill  color="danger" onClick={this.deleteProject}>
                            Delete Project
                          </EuiButton>
                          </EuiFlexItem>
                          }
                         
                    
                          </EuiFlexGroup>
                        </EuiFlexItem>

                      </EuiFlexGroup>
       
     


                  </EuiPageContentHeader>
                  <EuiPageContentBody>

                  <div style={{ maxWidth: 400, marginTop: "-25px", marginBottom: "30px" }}>
                    <EuiFlexGroup alignItems="center"  >
                      <EuiFlexItem grow={2} style={{ margin: 7 }}>
                        <EuiText size="xs">
                          <p style={{ textAlign: "right" }}>CPU: {(quota.Percentage.CPU*100)}%</p>
                        </EuiText>
                      </EuiFlexItem>
                      <EuiFlexItem grow={8} style={{ margin: 7 }}>
                        <EuiProgress value={(quota.Percentage.CPU*100)} max={100} size="l" color={quota.Percentage.CPUStatus} />
                      </EuiFlexItem>
                    </EuiFlexGroup>

                    <EuiFlexGroup alignItems="center">
                      <EuiFlexItem grow={2} style={{ margin: 7 }}>
                        <EuiText  size="xs">
                          <p style={{ textAlign: "right" }}>Memory: {(quota.Percentage.Memory*100)}%</p>
                        </EuiText>
                      </EuiFlexItem>
                      <EuiFlexItem grow={8} style={{ margin: 7 }}>
                        <EuiProgress value={(quota.Percentage.Memory*100)} max={100} size="l" color={quota.Percentage.MemoryStatus}  />
                      </EuiFlexItem>
                    </EuiFlexGroup>
          </div>



                  <EuiFieldSearch
                    placeholder="Search this"
                    value={this.state.value}
                    onChange={this.onChange}
                    fullWidth={true}
                    aria-label="Use aria labels when no actual label is in use"
                  />
                 <EuiSpacer size="m" />
                    <EuiFlexGrid gutterSize="l" columns={4}>
                    { this.state.deployments.map((item, index) => {
                      return (
                        <EuiFlexItem key={index} onClick={() =>  this.props.history.push("/project/"+this.props.match.params.id+"/"+item.name)}>
                          <DeploymentCard item={item} project={this.props.match.params.id}/>
                        </EuiFlexItem>
                      );
                      })}
                    </EuiFlexGrid>
                    <EuiSpacer size="m" />

                    <EventsView project={this.props.match.params.id} title="Project Events"/>
   

                  </EuiPageContentBody>

                  
                </EuiPageContent>
        )}
                    }

export default withRouter(Deployments);