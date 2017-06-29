import React from 'react';
import { Link } from 'react-router-dom';


export default class Header extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showAuth: false
    }
  }

  render() {
    return (
      <div id='header'>
        <Link id='logo' to={'/'}>GoRep</Link>
        { this.state.showAuth ? <SignInButtons /> : null }
      </div>
    )
  }
}


function SignInButtons(props) {
  return (
    <div id='auth-buttons'>
      <Link to='/signup' id='sign-up'><button>Sign Up </button></Link> 
      <Link to='/login' id='sign-in'><button> Sign In </button></Link>
    </div>
  )
}