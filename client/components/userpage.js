import React from 'react';

// import components
import VideoComp from './videocomp';
import Chat from './chat';

export default class UserPage extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    console.log(this.props)
    return (
      <div id='user-page'>
        <VideoComp streamingUser={this.props.match.params.userid}/>
        <Chat />
      </div>
    )
  }
}