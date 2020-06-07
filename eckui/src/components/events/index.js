import React, { Component } from 'react';

import {
  EuiCallOut,
  EuiAccordion,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiTitle,
  EuiTextColor,
  EuiText
  
} from '@elastic/eui';
import { withRouter } from "react-router-dom"
import moment from 'moment'
import eckApi from "../../store";



const buttonContent =(title) =>{ 
  return (
    <div>
      <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiIcon type="logoWebhook" size="m" />
        </EuiFlexItem>

        <EuiFlexItem>
          <EuiTitle size="s" className="euiAccordionForm__title">
            <h3>{title}</h3>
          </EuiTitle>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiText size="s">
        <p>
          <EuiTextColor color="subdued">
            List Events form Kuberneties
          </EuiTextColor>
        </p>
      </EuiText>
    </div>
  );
}


class EventsView extends Component {
    constructor(props) {
      super(props);
  
      this.state = {
        events: []
      };
    }
  
    componentDidMount() {
      if (this.props.project !== undefined){
        if(this.props.deployment !== undefined){
          eckApi.getDeploymentEvents(this.props.project, this.props.deployment).then((response) => {
            if (Array.isArray(response.data)){
              console.log(response.data)
              this.setState({events: response.data.reverse()})
            }
          })
          .catch(function (error) {
            console.log(error);
          });
        }
        else {
          eckApi.getProjectEvents(this.props.match.params.id).then((response) => {
            if (Array.isArray(response.data)){
              console.log(response.data)
              this.setState({events: response.data.reverse()})
            }
          })
          .catch(function (error) {
            console.log(error);
          });
        }
      }



    }

    render() {
        let parseDate = (date) => {
          return moment(date).format('DD-MM-YYYY HH:mm');
        }

        return (
          <EuiAccordion
      id="accordionForm1"
      className="euiAccordionForm"
      buttonClassName="euiAccordionForm__button"
      buttonContent={buttonContent(this.props.title)}
      >
      <div style={{"max-height": "300px", "overflow": "auto"}}>
                
                { this.state.events.map((item, index) => {
                  return (
                    <EuiCallOut
                    title={item.component}
                    iconType={item.type === "Normal" ? "check" : "alert"}
                    color={item.type === "Normal" ? "success" : "warning"}
                  >
                    <p>{parseDate(item.last_timestamp)} | {item.message}</p>
                    </EuiCallOut>
                  );
                  })}
                
            </div>
    </EuiAccordion>
                
        )}
                    }

export default withRouter(EventsView);