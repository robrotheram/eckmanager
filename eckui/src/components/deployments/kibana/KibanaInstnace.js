import React, { Component } from 'react';

import {
  EuiFieldNumber,
  EuiButton,
  EuiSpacer,
  EuiCard,
  EuiFormRow,

} from '@elastic/eui';

import makeId from '@elastic/eui/lib/components/form/form_row/make_id';

export function KibanaInstanceConfig(){
    return {
        id: makeId(),
        Master: true,
        Data: true,
        Ingest: true,
        NodeName: '',
        InstanceCount: 1
    }
}

export default class KinanaInstance extends Component {
    constructor(props) {
        super(props);
        this.state = props.data
      }
      onChange = e => {
          let data = this.state; 
          data[e.target.name] = e.target.checked;
          this.props.onConfigChange(data)
      };
    
      onSelectChange = e => {
          let data = this.state; 
          data.version = e.target.value;
          this.props.onConfigChange(data)
        };
  
      onTextChange = e => {
        let data = this.state; 
        data[e.target.name] = e.target.value;
        console.log(data)
        this.props.onConfigChange(data)
      };
  
    render(){
      return(
        <EuiCard
    title=""
    description=""
    betaBadgeLabel={this.props.data.id}
    betaBadgeTooltipContent=""
    footer={
      <EuiButton
      iconSide="right"
      iconType="trash"
      color="danger"
      size="s"
      fill
      fullWidth
      onClick={() => this.props.remove(this.props.data.id)}>
      Delete Node
    </EuiButton>
    }
  >
  <EuiFormRow
    label="Instance Count"
    fullWidth>
    <EuiFieldNumber fullWidth name="InstanceCount" min={1} max={10} value={this.state.InstanceCount} onChange={this.onTextChange}  />
  </EuiFormRow>
  
  <EuiSpacer/>
  </EuiCard>
      );
    }
  }
  
  
  
  