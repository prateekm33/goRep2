import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';

// import components
import Landing from './landing';
import Home from './home';
import Header from './header';
import Footer from './footer';
import UserPage from './userpage';

import { SignUp, LogIn } from './signin';

export default class App extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <Header />
        <div id='content'>
          <Switch>
            <Route exact path='/' component={Landing} />
            <Route path='/home' render={props => onEnter(props, Home)} />
            <Route path='/signup' render={props => onEnter(props, SignUp)} />
            <Route path='/login' render={props => onEnter(props, LogIn)} />
            <Route path='/:userid' render={props => onEnter(props, UserPage)} />
          </Switch>
        </div>
        <Footer />
      </div>
    )
  }
}


function onEnter(props, Component) {
  // if (!props.authenticated) {
  //   return (
  //     <div> not authenticated </div>
  //   )
  // }

  return <Component {...props}/>;

}