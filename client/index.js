import 'babel-polyfill';

import React from 'react';
import { render } from 'react-dom';
import routes from './routes';
// import { syncHistoryWithStore } from 'react-router-redux';

render(routes , document.getElementById('app'));
