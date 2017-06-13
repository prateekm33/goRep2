import React from 'react';
import io from 'socket.io-client';
import P2PConn from './P2PConn';

export default class VideoComp extends P2PConn {
  constructor(props) {
    super(props);

    this.state = {
      localStream: null
    }

    this.startStream = this.startStream.bind(this);
    this.endStream = this.endStream.bind(this);
    this.gotStream = this.gotStream.bind(this);
    this.joinStream = this.joinStream.bind(this);
    this.setInput = this.setInput.bind(this);
  }

  setInput() {
    this.setState({
      user: this.inputEl.value
    });
  }

  startStream(evt) {
    navigator.mediaDevices.getUserMedia({
      audio: false, video: true
    })
      .then(this.gotStream)
      .catch(e => { 
        console.warn('getUserMedia() error: ', e) 
      });
  }

  gotStream(stream) {
    this.localStream = stream;
    this.setState({
      localStream: URL.createObjectURL(this.localStream),
      stream
    });

    this.MediaStream = stream.getTracks()[0];

    this.sendStreamToServer(this.props.streamingUser, this.state.user);
  }

  endStream(evt) {
    this.setState({
      localStream: null
    });

    this.MediaStream && this.MediaStream.stop();
  }

  joinStream() {
    const socket = io(`/streams/${this.props.streamingUser}`).connect();
    this.initRoomSocket(socket, this.props.streamingUser, this.state.user, this.state.localStream);
  }

  render() {
    return (
      <div id='video-comp'>
        <input ref={el => this.inputEl = el} onChange={this.setInput}/>
        <video autoPlay src={this.state.localStream} id='video' />
        <VideoControls 
          startStream={this.startStream} 
          endStream={this.endStream}
          joinStream={this.joinStream} />
      </div>
    )
  }
}


function VideoControls(props) {
  return (
      <div id='video-controls'>
        <button onClick={props.startStream}>stream</button>
        <button onClick={props.endStream}>end</button>
        <button onClick={props.joinStream}>Join</button>
      </div>
    )
}