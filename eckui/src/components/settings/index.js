import React, { Component } from 'react';
import { withRouter } from "react-router-dom"
import {
    EuiCodeBlock,
  EuiPageContent,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiPageContentBody,
  EuiTitle,
  EuiFormRow,
  EuiSwitch,
  EuiButton,
  EuiFilePicker,
  EuiFlexItem,
  EuiFlexGroup,
  EuiSpacer,
  EuiText
} from '@elastic/eui';
import eckApi from "../../store";

class Settings extends Component {
    constructor(props) {
      super(props);
  
      this.state = {
        Trial: false,
        License: "",
        Data: {}
      };
    }
      
    componentDidMount() {
      eckApi.getLicense().then((response) => {
        let data = response.data
        if (data.eck_license_level !== undefined){
            if (data.eck_license_level === "enterprise_trial") {
                this.setState({Trial: true, Data: data})
                return
            }
        }
        this.setState({Trial: false, Data: data})



      })
      .catch(function (error) {
        console.log(error);
      });
    }

    onTrialChange = e => {
        this.setState({Trial: e.target.checked})
    }

    onLicenceChange = license => {
        
        if  (license[0] === undefined ){
            this.setState({License: ""})
        }else{
            license[0].text().then( data => {
                this.setState({License: data})
            },this)
        }
    }


    onLicenseUpdate = () => {
        let license = this.state;
        console.log(license)
        eckApi.updateLicense(license).then(resp => {
            console.log(resp);
        })
    }


    render() {
        return (
                <EuiPageContent>
                  <EuiPageContentHeader>
                  <EuiFlexGroup justifyContent="spaceBetween">
                        <EuiFlexItem grow={false}>
                    <EuiPageContentHeaderSection>
                          <EuiTitle>
                            <h1>Settings</h1>
                          </EuiTitle>
                    </EuiPageContentHeaderSection>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                          <EuiButton fill onClick={this.onLicenseUpdate} >
                            Update License
                          </EuiButton>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                  </EuiPageContentHeader>
                  <EuiPageContentBody>
                  <EuiText>
  <h2>License</h2>
</EuiText>

{this.state.Data !== undefined ?(<div>
                  <EuiSpacer/>
                  Current License status:
                  <EuiCodeBlock language="json">
                { JSON.stringify(this.state.Data, null, 2)}
                </EuiCodeBlock>              
                <EuiSpacer/>
                </div>
):null}


                      <EuiFormRow
    label="Enable Trial License"
    fullWidth>
    <EuiSwitch
        label=""
        checked={this.state.Trial}
        onChange={this.onTrialChange}
      />
  </EuiFormRow>
{/* 
  <a href="https://www.elastic.co/guide/en/cloud-on-k8s/master/k8s-licensing.html"> https://www.elastic.co/guide/en/cloud-on-k8s/master/k8s-licensing.html</a>  */}
              <EuiSpacer/>
{!this.state.Trial?
              <EuiFormRow
    label="Upload Enterprise Licence"
    fullWidth>
    <EuiFilePicker
              id="asdf2"
              
                fullWidth
              initialPromptText="Select elastic Enterprise license"
              onChange={this.onLicenceChange}
              display='large'
              aria-label="Use aria labels when no actual label is in use"
            />
  </EuiFormRow>
  : null}

                
                  </EuiPageContentBody>
                </EuiPageContent>
        )}
                    }

export default (withRouter(Settings));