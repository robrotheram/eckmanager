import React, { Component } from "react";

import {
  EuiFieldNumber,
  EuiSwitch,
  EuiButton,
  EuiSpacer,
  EuiCard,
  EuiFormRow,
  EuiFlexGroup,
  EuiFlexItem,
} from "@elastic/eui";

import makeId from "@elastic/eui/lib/components/form/form_row/make_id";

export function ElasticInstanceConfig() {
  return {
    Name: makeId(),
    Master: true,
    Data: true,
    Ingest: true,
    InstanceCount: 1,
    Cpu: "1",
    Memory: "2",
  };
}

export default class ElasticInstance extends Component {
  constructor(props) {
    super(props);
    this.state = props.data;
  }
  onChange = (e) => {
    let data = this.state;
    data[e.target.name] = e.target.checked;
    this.props.onConfigChange(data);
  };

  onSelectChange = (e) => {
    let data = this.state;
    data.version = e.target.value;
    this.props.onConfigChange(data);
  };

  onTextChange = (e) => {
    let data = this.state;
    data[e.target.name] = e.target.value;
    this.props.onConfigChange(data);
  };

  render() {
    return (
      <EuiCard
        title=""
        description=""
        betaBadgeLabel={this.props.data.Name}
        betaBadgeTooltipContent=""
        footer={
          <EuiButton
            iconSide="right"
            iconType="trash"
            color="danger"
            size="s"
            fill
            fullWidth
            onClick={() => this.props.remove(this.props.data.id)}
          >
            Delete Node
          </EuiButton>
        }
      >
        <EuiFormRow label="Instance Count" fullWidth>
          <EuiFieldNumber
            fullWidth
            name="InstanceCount"
            min={1}
            max={10}
            value={this.state.InstanceCount}
            onChange={this.onTextChange}
          />
        </EuiFormRow>

        <EuiSpacer />

        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFormRow label="Cpu">
              <EuiFieldNumber
                fullWidth
                name="Cpu"
                min={1}
                max={10}
                value={this.state.Cpu}
                onChange={this.onTextChange}
              />
            </EuiFormRow>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiFormRow label="Memory">
              <EuiFieldNumber
                fullWidth
                name="Memory"
                min={1}
                max={10}
                value={this.state.Memory}
                onChange={this.onTextChange}
              />
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiSpacer />

        <EuiFormRow label="Node Types:" hasChildLabel={false}>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiSwitch
                label="Master"
                name="Master"
                checked={this.state.Master}
                onChange={this.onChange}
              />
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiSwitch
                label="Data"
                name="Data"
                checked={this.state.Data}
                onChange={this.onChange}
              />
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiSwitch
                label="Ingest"
                name="Ingest"
                checked={this.state.Ingest}
                onChange={this.onChange}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFormRow>
        <EuiSpacer />
      </EuiCard>
    );
  }
}
