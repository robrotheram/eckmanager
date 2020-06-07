import React from 'react';
import useBreadcrumbs from 'use-react-router-breadcrumbs';

import HeaderUserMenu from "./headerUserProfile"
import { withRouter } from "react-router-dom"
import { Auth } from "../../store"

import {
  EuiHeader,
  EuiHeaderBreadcrumbs,
  EuiHeaderSection,
  EuiHeaderSectionItem,
  EuiHeaderLogo,
  EuiHeaderLink,
} from '@elastic/eui';

const Header =  (props) => {

  const renderBreadcrumbs = (history, breadcrumbs) => {
      console.log(breadcrumbs)
      breadcrumbs = breadcrumbs.map(({ breadcrumb }) => {
        return {
          text: breadcrumb.props.children,
          onClick: e => {
            e.preventDefault();
            history.push(breadcrumb.key)
          },
        }
      })

      console.log(breadcrumbs)

    return <EuiHeaderBreadcrumbs breadcrumbs={breadcrumbs} />;
  };

  let breadcrumbs = useBreadcrumbs();
  if (!Auth.isAuthenticated()){
            return null
          }
  return (
    <EuiHeader>
      <EuiHeaderSection grow={false}>
        <EuiHeaderSectionItem border="right">
          <EuiHeaderLogo iconType={"logoCode"} href="#">ECK Manager</EuiHeaderLogo>
        </EuiHeaderSectionItem>
        <EuiHeaderSectionItem border="right">
          
        </EuiHeaderSectionItem>
      </EuiHeaderSection>

      {renderBreadcrumbs(props.history, breadcrumbs)}

      <EuiHeaderSection side="right">
      <EuiHeaderSectionItem>
      <EuiHeaderLink iconType="gear" onClick={() =>  props.history.push("/settings")}></EuiHeaderLink>
        <HeaderUserMenu />
        
       </EuiHeaderSectionItem>
      </EuiHeaderSection>
    </EuiHeader>
  );
};
export default withRouter(Header)