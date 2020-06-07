import React, {Component}from "react";
import {
    EuiAvatar,
    EuiFlexGroup,
    EuiFlexItem,
    EuiHeaderSectionItemButton,
    EuiLink,
    EuiText,
    EuiSpacer,
    EuiPopover,
  } from '@elastic/eui';

import eckAPI from "../../store";
import {Auth} from "../../App"
export default class extends Component {
    constructor(props) {
      super(props);
  
      this.state = {
        isOpen: false,
        username: ""
      };
    }
  
    componentDidMount() {
        eckAPI.getUser().then((response) => {
            this.setState({username: response.data.username})
        })
    }

    onMenuButtonClick = () => {
      this.setState({
        isOpen: !this.state.isOpen,
      });
    };
  
    closeMenu = () => {
      this.setState({
        isOpen: false,
      });
    };
  
    render() {
      const button = (
        <EuiHeaderSectionItemButton
          aria-controls="headerUserMenu"
          aria-expanded={this.state.isOpen}
          aria-haspopup="true"
          aria-label="Account menu"
          onClick={this.onMenuButtonClick}>
          <EuiAvatar name={this.state.username} size="s" />
        </EuiHeaderSectionItemButton>
      );
  
      return (
        <EuiPopover
          id="headerUserMenu"
          ownFocus
          button={button}
          isOpen={this.state.isOpen}
          anchorPosition="downRight"
          closePopover={this.closeMenu}
          panelPaddingSize="none">
          <div style={{ width: 320 }}>
            <EuiFlexGroup
              gutterSize="m"
              className="euiHeaderProfile"
              responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiAvatar name={this.state.username} size="xl" />
              </EuiFlexItem>
  
              <EuiFlexItem>
                <EuiText>
                    <p>{this.state.username}</p>
                </EuiText>
  
                <EuiSpacer size="m" />
  
                <EuiFlexGroup>
                  <EuiFlexItem>
                    <EuiFlexGroup justifyContent="spaceBetween">
                      {/* <EuiFlexItem grow={false}>
                        <EuiLink href="">Edit profile</EuiLink>
                      </EuiFlexItem> */}
  
                      <EuiFlexItem grow={false}>
                        <EuiLink href="" onClick={() => Auth.signout()}>Log out</EuiLink>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
            </EuiFlexGroup>
          </div>
        </EuiPopover>
      );
    }
  }