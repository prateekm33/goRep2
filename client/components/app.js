import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';

// import components
import Landing from './landing';
import Home from './home';
import Header from './header';
import Footer from './footer';
import UserPage from './userpage';
import { SignUp, LogIn } from './signin';
import DNE from './DNE';

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
            <Route exact path='/' render={props => onEnter(props, UserPage)} />
            <Route path='/signup' render={props => onEnter(props, SignUp)} />
            <Route path='/login' render={props => onEnter(props, LogIn)} />
            <Route path='*' component={DNE} />
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