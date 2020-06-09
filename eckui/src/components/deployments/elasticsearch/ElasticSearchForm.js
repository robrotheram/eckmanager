import React, { Component } from "react";

import {
  EuiHorizontalRule,
  EuiAccordion,
  EuiButton,
  EuiSpacer,
  EuiFlexItem,
  EuiCodeEditor,
  EuiText,
  EuiFlexGrid,
  EuiFormRow,
  EuiFlexGroup,
  EuiFieldText,
  EuiButtonIcon,
} from "@elastic/eui";

import "brace/theme/tomorrow";
import "brace/mode/yaml";
import "brace/snippets/yaml";
import "brace/ext/language_tools";

import AccordinanIconButton from "../AccordianIconButton";
import ElasticInstance, { ElasticInstanceConfig } from "./ElasicInstance";
import { Notifications } from "../../../store";

const yaml = require("js-yaml");

class ElasticSearchForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      checked: false,
      value: "",
      data: {
        Nodes: [],
        ConfigString: "",
        Config: {},
        Secrets: [],
      },
    };
  }

  componentWillReceiveProps(nextProps) {
    // You don't have to do this check first, but it can help prevent an unneeded render
    if (nextProps.data !== this.state.data) {
      if (nextProps.data.Secrets === undefined) {
        nextProps.data.Secrets = [];
      }
      console.log(nextProps.data);
      this.setState({ data: nextProps.data });
    }
  }

  addNode = () => {
    let data = this.state.data;
    data.Nodes = [...this.state.data.Nodes, ElasticInstanceConfig()];
    this.props.onConfigChange(data);
  };

  removeNode = (i) => {
    let data = this.state.data;
    var array = [...data.Nodes]; // make a separate copy of the array
    let index = array.map((e) => e.id).indexOf(i);
    console.log(data, array, index, i);
    if (index !== -1) {
      array.splice(index, 1);
      data.Nodes = array;
      this.props.onConfigChange(data);
    }
  };

  onNodeConfigChange = (config) => {
    config.InstanceCount = parseInt(config.InstanceCount);
    let data = this.state.data;
    console.log(data.Nodes, config);
    let index = data.Nodes.map((e) => e.id).indexOf(config.id);

    data.Nodes[index] = config;
    console.log(data);
    this.props.onConfigChange(data);
  };

  onChange = (e) => {
    this.setState({
      checked: e.target.checked,
    });
  };

  onCodeChange = (value) => {
    let data = this.state.data;
    try {
      let doc = yaml.load(value);
      data.ConfigString = value;
      data.Config = doc;
      this.props.onConfigChange(data);
    } catch (err) {
      Notifications.addToast();
    }
  };

  newSecret() {
    var newInput = {
      name: "",
      value: "",
    };
    let data = this.state.data;
    data.Secrets.push(newInput);
    this.setState({ data: data });
    this.props.onConfigChange(data);
  }

  deleteSecret(id) {
    let data = this.state.data;
    data.Secrets.splice(id, 1);
    this.setState({ data: data });
    this.props.onConfigChange(data);
  }

  onSecretChange = (event, idx) => {
    let data = this.state.data;
    data.Secrets[idx][event.target.name] = event.target.value;
    this.setState({ data: data });
    this.props.onConfigChange(data);
  };

  render() {
    return (
      <EuiAccordion
        id="accordionForm1"
        className="euiAccordionForm"
        buttonClassName="euiAccordionForm__button"
        buttonContent={AccordinanIconButton(
          "Elasticsearch",
          "logoElasticsearch"
        )}
        paddingSize="m"
      >
        <EuiButton
          iconSide="right"
          iconType="plusInCircle"
          color="primary"
          size="s"
          fill
          onClick={() => this.addNode()}
        >
          Add Node
        </EuiButton>
        <EuiHorizontalRule margin="l" />
        <EuiFlexGrid gutterSize="l" columns={3}>
          {this.state.data.Nodes.map((item, index) => {
            return (
              <EuiFlexItem key={index}>
                <ElasticInstance
                  data={item}
                  remove={this.removeNode}
                  onConfigChange={this.onNodeConfigChange}
                />
              </EuiFlexItem>
            );
          })}
        </EuiFlexGrid>
        <EuiSpacer />
        <EuiAccordion id="accordion1" buttonContent="Add Extra Elasitic Config">
          <EuiSpacer />
          <EuiText>Add Addtional Elasticsearch yaml</EuiText>
          <EuiCodeEditor
            mode="yaml"
            theme="tommorrow"
            width="100%"
            value={this.state.data.ConfigString}
            onChange={this.onCodeChange}
            setOptions={{
              fontSize: "14px",
              enableBasicAutocompletion: true,
              enableSnippets: true,
              enableLiveAutocompletion: true,
            }}
            aria-label="Code Editor"
          />
        </EuiAccordion>
        <EuiAccordion id="accordion1" buttonContent="Add Elasitic Secrets">
          <EuiSpacer />
          <EuiButton onClick={() => this.newSecret()}>
            {" "}
            Add Elasticsearch Secret{" "}
          </EuiButton>
          <EuiSpacer />

          {this.state.data.Secrets.map((input, idx) => (
            <EuiFlexGroup>
              <EuiFlexItem fullWidth>
                <EuiFormRow fullWidth>
                  <EuiFieldText
                    fullWidth
                    placeholder="secret name"
                    name="name"
                    value={input.Name}
                    onChange={(e) => this.onSecretChange(e, idx)}
                  />
                </EuiFormRow>
              </EuiFlexItem>
              <EuiFlexItem fullWidth>
                <EuiFormRow fullWidth>
                  <EuiFieldText
                    fullWidth
                    placeholder="secret value"
                    name="value"
                    value={input.Value}
                    onChange={(e) => this.onSecretChange(e, idx)}
                  />
                </EuiFormRow>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiFormRow>
                  <EuiButtonIcon
                    iconType="trash"
                    aria-label="This is a link"
                    color={`danger`}
                    onClick={() => this.deleteSecret(idx)}
                  />
                </EuiFormRow>
              </EuiFlexItem>
            </EuiFlexGroup>
          ))}
        </EuiAccordion>
      </EuiAccordion>
    );
  }
}
export default ElasticSearchForm;
