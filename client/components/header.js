import React from 'react';
import { Link } from 'react-router-dom';


export default class Header extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div id='header'>
        <Link id='logo' to={'/'}>GoRep</Link>
        <SignInButtons />
      </div>
    )
  }
}


function SignInButtons(props) {
  return (
    <div id='auth-buttons'>
      <Link to='/signup' id='sign-up'> Sign Up </Link> 
      <Link to='/login' id='sign-in'> Sign In </Link>
    </div>
  )
}