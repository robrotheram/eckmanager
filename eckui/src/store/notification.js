import React, { useState, Fragment } from 'react';

import {
  EuiCode,
  EuiGlobalToastList,
  EuiLink,
} from '@elastic/eui';

let addToastHandler;
let removeAllToastsHandler;
let toastId = 0;


export function Warning(title, message){
  addToast("warning", title, message)
}
export function Danger(title, message){
  addToast("danger", title, message)
}
export function Success(title, message){
  addToast("success", title, message)
}

export function Info(title, message){
  addToast("info", title, message)
}


function addToast(type, title, message) {
  addToastHandler({
    title: title,
    color: type,
    text: <p>{message}</p>,
  });
}

export function removeAllToasts() {
  removeAllToastsHandler();
}

export default () => {
  const [toasts, setToasts] = useState([]);

  addToastHandler = (toast) => {
    setToasts(toasts.concat(toast));
  };

  const removeToast = removedToast => {
    setToasts(toasts.filter(toast => toast.id !== removedToast.id));
  };

  removeAllToastsHandler = () => {
    setToasts([]);
  };

  return (
    <EuiGlobalToastList
      style={{bottom: "auto", top:"55px", width:"600px"}}
      toasts={toasts}
      dismissToast={removeToast}
      toastLifeTimeMs={6000}
    />
  );
};