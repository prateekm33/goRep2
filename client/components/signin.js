import React from 'react';


export class AuthForm extends React.Component {
  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.validateInputs = this.validateInputs.bind(this);
  }

  handleSubmit(evt) {
    evt.preventDefault();
    const validated = this.validateInputs();
    if (!validated) return false;
    else return true;
  }

  validateInputs() {
    const children = Array.prototype.slice.call(this.formEl.children);
    const filtered = children.filter(input => input.type !== 'submit' && !input.value.split(' ').join(''));
    if (filtered.length) return false;
    return true;
  }

  render() {
    return (
      <div id={this.authFormID || 'auth-container'}>
        <form 
          ref={el => this.formEl = el}
          id={`${this.authFormID}-form` || 'auth-container-form'}
          onSubmit={this.handleSubmit}
        >
          <div id='title'>{
            this.authFormID === 'sign-up' ? "Sign Up" : "Log In"
          }</div>
          <input placeholder='Enter username' id='username' />
          <input placeholder='Enter password' id='pw' type='password'/>
          {
            this.authFormID === 'sign-up' && 
            <input id="pw-confirm" type='password' placeholder="Confirm password"/>
          }
          <input id="submit" type='submit' />
        </form>
      </div>
    )
  }
}

export class SignUp extends AuthForm {
  constructor(props) {
    super(props);
    this.authFormID = 'sign-up';
  }

  handleSubmit(evt) {
    const validated = super.handleSubmit(evt);
    if (!validated) {
      console.log('Form invalid.');
    } else {
      console.log('Sign up form submitting...');
    }
  }
}


export class LogIn extends AuthForm {
  constructor(props) {
    super(props);
    this.authFormID = 'log-in';
  }

  handleSubmit(evt) {
    const validated = super.handleSubmit(evt);
    if (!validated) {
      console.log('Form invalid.');
    } else {
      console.log('Log in form submitting...')
    }
  }
} 
