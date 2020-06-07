import React, { Component } from "react";

import {
  EuiPanel,
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiPageContentBody,
  EuiIcon,
  EuiProgress,
  EuiTitle,
  EuiSpacer,
  EuiFlexGrid,
  EuiText,
  EuiCard,
  EuiFlexItem,
  EuiFlexGroup,
  EuiButton,
  EuiFieldText,
  EuiCodeBlock,
  EuiAccordion,
  EuiTextColor,
  EuiButtonEmpty
} from "@elastic/eui";
import eckApi from "../../store";
import { EuiHorizontalRule } from "@elastic/eui";
import { withRouter } from "react-router-dom"
import EventsView from './../events'

const cardStatusStyle =  {
  "position": "relative",
  "padding": "2px",
  "border": "1px solid #D3DAE6",
  "borderRadius": "5px",
  "marginRight": "10px",
  "display":"inline"

}

class DevelopmentCard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      deployment: {
        DeploymentName: "",
        Version: "",
      },
    };
  }
  componentDidMount() {}

  render() {
    let name, es_version = ""
    let cpu, memory = 0
    let icon = `logoElasticsearch`
    if (this.props.node !== undefined){
      name = this.props.node.name
      icon = this.props.icon
      es_version = this.props.node.es_version
      if (this.props.node.metrics[0] !== undefined){
      if (this.props.node.metrics[0].Metrics[0] !== undefined){
      cpu = (this.props.node.metrics[0].Metrics[0].Metrics[0].CPU/2)*100
      memory = ((this.props.node.metrics[0].Metrics[0].Metrics[0].Memory / (1024*1024*1024))/2)*100
      }
    }
    }
    

    return (
      <EuiCard
        title={name}
        icon={<EuiIcon size="xxl" type={icon} />}
        description={es_version}
      >
        <EuiFlexGroup alignItems="center">
          <EuiFlexItem grow={2}>
            <EuiText>
              <p>CPU</p>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={8}>
            <EuiProgress value={cpu} max={100} size="l" />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup alignItems="center">
          <EuiFlexItem grow={2}>
            <EuiText>
              <p>Memory</p>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={8}>
            <EuiProgress value={memory} max={100} size="l" />
          </EuiFlexItem>
        </EuiFlexGroup>
        {/* <EuiFlexGroup alignItems="center">
          <EuiFlexItem grow={2}>
            <EuiText>
              <p>Disk</p>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={8}>
            <EuiProgress value={this.state.value} max={100} size="l" />
          </EuiFlexItem>
        </EuiFlexGroup> */}
      </EuiCard>
    );
  }
}

const buttonContent = (logo, title) => {
  return (
    <div>
      <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiIcon type={logo} size="m" />
        </EuiFlexItem>

        <EuiFlexItem>
          <EuiTitle size="s" className="euiAccordionForm__title">
            <h3>{title}</h3>
          </EuiTitle>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiText size="s">
        <p>
          <EuiTextColor color="subdued">{logo} Nodes</EuiTextColor>
        </p>
      </EuiText>
    </div>
  );
};

class DeploymentView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      projects: [{}, {}, {}, {}, {}, {}, {}],
      status : {},
      elasticsearch: {
        status:{},
        pods: []
      },
      kibana: {
        status:{},
        pods: []
      },

      secrets: [],
      deployment: {
        DeploymentName: "",
        Version: "",
        elasticsearch: {},
        kibana: {}
      },
    };
  }

  componentDidMount() {
    console.log(this.props.match);
    if (this.props.match.params.id !== undefined) {
      eckApi
        .getDeployment(
          this.props.match.params.id,
          this.props.match.params.depoyment_id
        )
        .then((response) => {
          this.setState({ deployment: response.data });
        })
        .catch(function (error) {
          console.log(error);
        });

        eckApi.getDeploymentSecrets(
          this.props.match.params.id,
          this.props.match.params.depoyment_id
        ).then((response) => {
          console.log(response.data)
          this.setState({ secrets: response.data });
        })

        eckApi.getDeploymentElastic(
          this.props.match.params.id,
          this.props.match.params.depoyment_id
        ).then((response) => {
          console.log(response.data)
          let elasticsearch = {
            status:response.data.status,
            pods: response.data.pods
          }
          this.setState({ elasticsearch: elasticsearch});
        })

        eckApi.getDeploymentKibana(
          this.props.match.params.id,
          this.props.match.params.depoyment_id
        ).then((response) => {
          console.log(response.data)
          let kibana = {
            status:response.data.status,
            pods: response.data.pods
          }
          this.setState({ kibana: kibana});
        })

        eckApi.getDeploymentStatus(
          this.props.match.params.id,
          this.props.match.params.depoyment_id
        ).then((response) => {
  
          console.log(response.data)
          this.setState({status: response.data})
  
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

  selectItem = (name) => {
    this.setState({
      selectedItemName: name,
    });
  };

  regenSecrets = () => {
    eckApi.deleteDeploymentSecrets(
      this.props.match.params.id,
      this.props.match.params.depoyment_id
    ).then(() => {
      setTimeout(() => {
        eckApi.getDeploymentSecrets(
          this.props.match.params.id,
          this.props.match.params.depoyment_id
        ).then((response) => {
          console.log(response.data)
          this.setState({ secrets: response.data });
        })
      }, 2000);
      
    })
  }


  deleteDeployment = () => {
    eckApi.deleteDeployment(
      this.props.match.params.id,
      this.props.match.params.depoyment_id
    ).then(() => {
      this.props.history.push(
        "/project/" + this.props.match.params.id
      )
    });
  }



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
    let deployment = this.state.deployment;
    console.log(deployment)

    let secrets = []
    if (this.state.secrets[0] !== undefined){
      secrets = Object.values(this.state.secrets[0])[0];
    }
    let status = "green"
    for (let element of Object.values(this.state.status)) {
      const result = element.filter(node => node.health !== "green");
      if (result.length > 0) {
        status = result[0].health;
        break
      }
    }
      
    



    return (
      <EuiPageContent>
        <EuiPageContentHeader>
          <EuiFlexGroup fullWidth justifyContent="spaceBetween">
            <EuiFlexItem grow={false}>
              <EuiPageContentHeaderSection>
                <EuiTitle>
                <span><div style={cardStatusStyle} >{status==="green"? <EuiIcon type="check" size="xl" color="success"/> : <EuiIcon type="alert" size="xl" color="warning"/>}</div>{deployment.name}</span>
                </EuiTitle>
                
                <p style={{ paddingTop: "5px" }}>{deployment.version}</p>
                
              </EuiPageContentHeaderSection>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
                          <EuiFlexGroup fullWidth justifyContent="spaceBetween">
                          <EuiFlexItem grow={false}>
              <EuiButton
                fill
                onClick={() =>
                  this.props.history.push(
                    "/project/" + this.props.match.params.id + "/"+deployment.name+"/edit"
                  )
                }
              >
                Edit Deployment
              </EuiButton>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton
                fill
                color="danger"
                onClick={this.deleteDeployment}
              >
                Delete Deployment
              </EuiButton></EuiFlexItem>
                          </EuiFlexGroup>
                        </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPageContentHeader>
        <EuiHorizontalRule />
        <EuiPageContentBody>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiPanel>
                <EuiFieldText
                  value={"https://"+deployment.elasticsearch.Id+"."+deployment.base_url}
                  prepend={[<EuiIcon type="logoElasticsearch" />]}
                  readOnly={true}
                  fullWidth
                />
                <EuiSpacer size="s" />
                <EuiFieldText
                  value={"https://"+deployment.kibana.Id+"."+deployment.base_url}
                  prepend={[<EuiIcon type="logoKibana" />]}
                  readOnly={true}
                  fullWidth
                />
                <EuiSpacer size="s" />
              </EuiPanel>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiPanel>
                Elastic Secrets
                <EuiButtonEmpty  style={{float:"right"}} iconSide="left" iconType="refresh" onClick={this.regenSecrets} color="danger"> Regenerate Secrets </EuiButtonEmpty>
                <EuiSpacer />
                <EuiCodeBlock language="json">
                { (secrets)}
                </EuiCodeBlock>
              </EuiPanel>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiHorizontalRule />

          <EuiAccordion
            className="euiAccordionForm"
            buttonClassName="euiAccordionForm__button"
            buttonContent={buttonContent("logoElasticsearch", "Elasticsearch")}
            paddingSize="l"
          >
            <EuiFlexGrid gutterSize="l" columns={4}>
              {this.state.elasticsearch.pods.map((item, index) => {
                return (
                  <EuiFlexItem key={index}>
                    <DevelopmentCard  node={item} icon={"logoElasticsearch"}/>
                  </EuiFlexItem>
                );
              })}
            </EuiFlexGrid>
          </EuiAccordion>

          <EuiAccordion
            className="euiAccordionForm"
            buttonClassName="euiAccordionForm__button"
            buttonContent={buttonContent("logoKibana", "Kibana")}
            paddingSize="l"
          >
            <EuiFlexGrid gutterSize="l" columns={4}>
              {this.state.kibana.pods.map((item, index) => {
                return (
                  <EuiFlexItem key={index}>
                    <DevelopmentCard node={item} icon={"logoKibana"}/>
                  </EuiFlexItem>
                );
              })}
            </EuiFlexGrid>
          </EuiAccordion>

          <EventsView project={this.props.match.params.id} deployment={this.props.match.params.depoyment_id} title="Deployments Events"/>

        </EuiPageContentBody>
      </EuiPageContent>
    );
  }
}

export default (withRouter(DeploymentView));

