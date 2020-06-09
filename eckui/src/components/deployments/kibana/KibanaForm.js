import React, { Component } from "react";

import {
  EuiFieldNumber,
  EuiSwitch,
  EuiAccordion,
  EuiSpacer,
  EuiFormRow,
  EuiCodeEditor,
  EuiText,
  EuiFlexGroup,
  EuiFlexItem,
} from "@elastic/eui";

import { KibanaInstanceConfig } from "./KibanaInstnace";
import AccordinanIconButton from "../AccordianIconButton";
const yaml = require("js-yaml");

export default class extends Component {
  constructor(props) {
    super(props);
    this.state = {
      enabled: true,
      value: "",
      data: {
        Nodes: [],
        InstanceCount: 1,
        Cpu: "0.5",
        Memory: "1",
        ConfigString: "",
        Config: {},
      },
    };
  }

  componentWillReceiveProps(nextProps) {
    // You don't have to do this check first, but it can help prevent an unneeded render
    if (nextProps.data !== this.state.data) {
      nextProps.data.Enabled = true;
      this.setState({ data: nextProps.data, enabled: true });
    }
  }

  addNode = () => {
    let data = this.state.data;
    data.Nodes = [...this.state.data.Nodes, KibanaInstanceConfig()];
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
    let data = this.state.data;
    console.log(data.Nodes, config);
    let index = data.Nodes.map((e) => e.id).indexOf(config.id);
    data.Nodes[index] = config;
    console.log(data);
    this.props.onConfigChange(data);
  };

  onChange = (e) => {
    this.setState({
      enabled: e.target.checked,
    });
    let data = this.state.data;
    data.Enabled = e.target.checked;
    this.props.onConfigChange(data);
  };

  onCodeChange = (value) => {
    let data = this.state.data;
    let doc = yaml.load(value);
    data.ConfigString = value;
    data.Config = doc;
    this.props.onConfigChange(data);
  };
  onTextChange = (e) => {
    let data = this.state.data;
    data[e.target.name] = e.target.value;
    console.log(data);
    this.props.onConfigChange(data);
  };

  render() {
    return (
      <EuiAccordion
        id="accordionForm1"
        className="euiAccordionForm"
        buttonClassName="euiAccordionForm__button"
        buttonContent={AccordinanIconButton("Kibana", "logoKibana")}
        paddingSize="l"
      >
        <EuiFormRow label="Enable Kibana" fullWidth>
          <EuiSwitch
            label=""
            checked={this.state.enabled}
            onChange={this.onChange}
          />
        </EuiFormRow>
        <EuiFormRow label="Instance Count" fullWidth>
          <EuiFieldNumber
            fullWidth
            name="InstanceCount"
            min={1}
            max={10}
            value={this.state.data.InstanceCount}
            onChange={this.onTextChange}
          />
        </EuiFormRow>
        <EuiSpacer />

        <EuiFormRow label="Resources:" fullWidth>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiFormRow fullWidth label="Cpu">
                <EuiFieldNumber
                  fullWidth
                  name="Cpu"
                  min={0.5}
                  step={0.25}
                  max={10}
                  value={this.state.data.Cpu}
                  onChange={this.onTextChange}
                />
              </EuiFormRow>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiFormRow fullWidth label="Memory">
                <EuiFieldNumber
                  fullWidth
                  name="Memory"
                  min={1}
                  max={8}
                  value={this.state.data.Memory}
                  onChange={this.onTextChange}
                />
              </EuiFormRow>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFormRow>

        <EuiSpacer />
        <EuiAccordion
          id="accordionKibana"
          buttonContent="Add Extra Kibana Config"
        >
          <EuiSpacer />
          <EuiText>Add Addtional Kibana yaml</EuiText>
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
      </EuiAccordion>
    );
  }
}
