import React from 'react';
import { Link } from 'react-router-dom';

export default class Chat extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      messages: []
    }

    this.renderSiginModal = this.renderSiginModal.bind(this);
  }

  renderSiginModal() {
    return (
      <div id='signin-modal'>
        <div> Sign in to chat </div>
        <Link to='/login'><button disabled={true}>
          Sign in
        </button></Link>
      </div>
    )
  }

  render() {
    return (
      <div id='chat'>
        <div id="overlay">
        </div>
        <div id='messages'>
          <div id='disabled'>
            <div style={{"align-self": "center"}}>
              Chat is currently disabled
            </div>
          </div>
          {
            this.state.messages.map((message, idx) => {
              return <Message message={message} key={message}/>
            })
          }

          {
            !this.props.loggedIn && this.renderSiginModal()
          }
        </div>
        <form>
          <input placeholder="Enter message"/>
        </form>
      </div>
    )
  }
}


class Message extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className='message'>
        <img src={this.props.message.imageSrc} />
        <div>{this.props.message.text}</div>
        <div>{this.props.message.timeStamp}</div>
      </div>
    )
  }
}