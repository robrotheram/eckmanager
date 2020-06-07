import { createBrowserHistory } from 'history';

import eckApi from './api'

export const history = createBrowserHistory();
export {default as Notifications} from './notification';

const Constants = {
    prod : {
      baseUrl: "/api",
     },
     dev : {
      baseUrl: "http://localhost:8888/api",
     }
  }
  
export const config = process.env.NODE_ENV === 'development' ? Constants["dev"] :Constants["prod"];

export default new eckApi() 
