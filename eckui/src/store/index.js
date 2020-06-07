import { createBrowserHistory } from 'history';

import auth from './auth'
import eckAPI from './api'

export const history = createBrowserHistory();


const Constants = {
    prod : {
      baseUrl: "/api",
     },
     dev : {
      baseUrl: "http://localhost:8888/api",
     }
  }

export const config = process.env.NODE_ENV === 'development' ? Constants["dev"] :Constants["prod"];
export const Auth = new auth()
export default new eckAPI(config, Auth);


export {default as Notifications} from './notification';