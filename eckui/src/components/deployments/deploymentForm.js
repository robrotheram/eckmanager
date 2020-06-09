import React, { Component } from "react";

import {
  EuiPageContentHeader,
  EuiPageContent,
  EuiTitle,
  EuiForm,
  EuiPageContentHeaderSection,
  EuiPageContentBody,
  EuiButton,
  EuiSpacer,
  EuiFormRow,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldText,
  EuiCodeBlock,
  EuiSelect,
} from "@elastic/eui";

import { withRouter } from "react-router-dom";

import ElasticSearchForm from "./elasticsearch/ElasticSearchForm";
import KibanaForm from "./kibana/KibanaForm";

import eckApi from "../../store";
import { versions } from "./versions";
const initialState = {
  checked: false,
  name: "",
  base_url: "",
  Version: versions[0].value,
  elasticsearch: {
    Nodes: [],
    ConfigString: "",
    Config: {},
  },
  kibana: {
    ConfigString: "",
    Config: {},
    Enabled: true,
    InstanceCount: "1",
    Cpu: "0.5",
    Memory: "1",
  },
};
class DeploymentForm extends Component {
  constructor(props) {
    super(props);
    this.state = initialState;
  }

  componentDidMount() {
    console.log(this.props.match);
    if (
      this.props.match.params.id !== undefined &&
      this.props.match.params.depoyment_id
    ) {
      eckApi
        .getDeployment(
          this.props.match.params.id,
          this.props.match.params.depoyment_id
        )
        .then((response) => {
          this.setState(response.data);
        })
        .catch(function (error) {
          console.log(error);
        });
    }
  }

  clearForm = () => {
    const keys = Object.keys(this.state);
    const stateReset = keys.reduce(
      (acc, v) => ({ ...acc, [v]: undefined }),
      {}
    );
    this.setState({ ...stateReset, ...initialState });
    this.setState({
      elasticsearch: {
        Nodes: [],
        ConfigString: "",
        Config: {},
      },
      kibana: {
        Nodes: [],
        ConfigString: "",
        Config: {},
      },
    });
  };

  onElasticChange = (config) => {
    console.log(config);
    this.setState({
      elasticsearch: config,
    });
  };
  onKibanaChange = (config) => {
    console.log(config);
    this.setState({
      kibana: config,
    });
  };

  onChange = (e) => {
    this.setState({
      checked: e.target.checked,
    });
  };

  onlicenseChange = (e) => {
    this.setState({
      License: e.target.checked,
    });
  };

  onVersionChange = (e) => {
    let elasticsearch = this.state.elasticsearch;
    let kibana = this.state.kibana;

    kibana.Version = e.target.value;
    elasticsearch.Version = e.target.value;

    this.setState({
      Version: e.target.value,
      kibana: kibana,
      elasticsearch: elasticsearch,
    });
  };

  onTextChange = (e) => {
    this.setState({
      [e.target.name]: e.target.value,
    });
  };

  onFormSave = () => {
    let deployment = this.state;

    deployment.elasticsearch.Name = deployment.name;
    deployment.elasticsearch.Version = deployment.Version;

    deployment.elasticsearch.Config = JSON.stringify(
      this.state.elasticsearch.Config
    );

    deployment.kibana.Config = JSON.stringify(this.state.kibana.Config);
    deployment.kibana.Name = deployment.name;
    deployment.kibana.ESRef = deployment.elasticsearch.Name;

    if (!deployment.kibana.Enabled) {
      delete deployment.kibana;
    } else {
      deployment.kibana.Version = deployment.Version;
      deployment.kibana.InstanceCount = parseInt(
        deployment.kibana.InstanceCount,
        10
      );
    }

    console.log(deployment);

    eckApi
      .createDeployments(this.props.match.params.id, deployment)
      .then((response) => {
        console.log(response.data);
        this.props.history.push(
          "/projects/" + this.props.match.params.id + "/" + deployment.name
        );
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  render() {
    let saveButtonText = "Save Form";
    if (this.props.match.params.depoyment_id) {
      saveButtonText = "Update Form";
    }

    return (
      <EuiPageContent>
        <EuiPageContentHeader>
          <EuiPageContentHeaderSection>
            <EuiTitle>
              {this.props.match.params.id !== undefined &&
              this.props.match.params.depoyment_id ? (
                <h2>Deployment Edit</h2>
              ) : (
                <h2>Deployment Create</h2>
              )}
            </EuiTitle>
          </EuiPageContentHeaderSection>
        </EuiPageContentHeader>
        <EuiPageContentBody>
          <EuiForm>
            <EuiFormRow
              label="Deployment Name:"
              fullWidth
              helpText="Note that the fullWidth prop is not passed to the form row's child"
            >
              <EuiFieldText
                fullWidth
                name="name"
                value={this.state.name}
                onChange={this.onTextChange}
              />
            </EuiFormRow>

            <EuiFormRow
              label="Base Domain Name:"
              fullWidth
              helpText="Base Domain Name ie example.com. Clusters will then be created with id.example.com"
            >
              <EuiFieldText
                fullWidth
                name="base_url"
                value={this.state.base_url}
                onChange={this.onTextChange}
              />
            </EuiFormRow>

            <EuiFormRow label="Version" fullWidth>
              <EuiSelect
                fullWidth
                options={versions}
                value={this.state.Version}
                onChange={this.onVersionChange}
                aria-label="Use aria labels when no actual label is in use"
              />
            </EuiFormRow>

            {/*   
    <EuiFormRow
      label="Set Connection Whitelist:"
      fullWidth
      helpText="Enable Whitelist">
      <EuiSwitch label="" checked={this.state.checked} onChange={this.onChange}        />
    </EuiFormRow>
    {this.state.checked &&
        <EuiFormRow label="Enter Whitelist CDIR:"  fullWidth  helpText="Whitelist CDIR">
                  <EuiFieldText fullWidth name="WhitelistCDIR" value={this.state.WhitelistCDIR} onChange={this.onTextChange} />
      </EuiFormRow>
      } */}
            <EuiSpacer />
            <ElasticSearchForm
              data={this.state.elasticsearch}
              onConfigChange={this.onElasticChange}
            />
            <KibanaForm
              data={this.state.kibana}
              onConfigChange={this.onKibanaChange}
            />
            <EuiSpacer />
            <EuiFlexGroup justifyContent="spaceBetween">
              <EuiFlexItem grow={false}>
                <EuiButton type="submit" fill onClick={this.onFormSave}>
                  {saveButtonText}
                </EuiButton>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton type="clear" color="danger" onClick={this.clearForm}>
                  {" "}
                  Reset form{" "}
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>

            <EuiSpacer />
            <EuiSpacer />
            <EuiCodeBlock
              language="js"
              fontSize="m"
              paddingSize="m"
              color="dark"
              overflowHeight={300}
              isCopyable
            >
              {JSON.stringify(this.state, null, 2)}
            </EuiCodeBlock>
          </EuiForm>
        </EuiPageContentBody>
      </EuiPageContent>
    );
  }
}

export default withRouter(DeploymentForm);
