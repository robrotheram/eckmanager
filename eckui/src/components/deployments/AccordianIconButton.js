import React from "react";

import {
  EuiTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiText,
  EuiTextColor,
} from "@elastic/eui";

const AccordinanIconButton = (title, icon) => {
  return (
    <div>
      <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiIcon type={icon} size="m" />
        </EuiFlexItem>

        <EuiFlexItem>
          <EuiTitle size="s" className="euiAccordionForm__title">
            <h6>{title}</h6>
          </EuiTitle>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiText size="s">
        <p>
          <EuiTextColor color="subdued">Setup {title}</EuiTextColor>
        </p>
      </EuiText>
    </div>
  );
};
export default AccordinanIconButton;
