import React from 'react';
import io from 'socket.io-client';
import P2PConn from './P2PConn';

export default class VideoComp extends P2PConn {
  constructor(props) {
    super(props);

    this.state = {
      localStream: null,
      roomName: '',
      roomActive: false,
      streamStarted: false
    }

    this.startStream = this.startStream.bind(this);
    this.endStream = this.endStream.bind(this);
    this.gotStream = this.gotStream.bind(this);
    this.joinStream = this.joinStream.bind(this);
    this.handleJoinClick = this.handleJoinClick.bind(this);
    this.handleCreateClick = this.handleCreateClick.bind(this);
    this.roomFormSubmit = this.roomFormSubmit.bind(this);
    this.userMessageClick = this.userMessageClick.bind(this);
  }

  roomFormSubmit(evt) {
    evt.preventDefault();
  }

  handleCreateClick(evt) {
    // check to see if room name has been entered
    if (!this.inputEl.value) {
      // if not, handle UI. Return
      console.log("--- no room name entered...");
      return;
    }

    const roomName = this.inputEl.value.split(" ").join("+");
    // check to see if room is available (as in not yet created)
    fetch('/streams/' + roomName)
      .then(res => res.json())
      .then(res => {
        if (res.err) { return; }
        if (res.room) {
          console.log("Room exists...or there is an error: ");
          this.setState({
            renderMessage: true,
            userMessage: `Room ${this.state.roomName} already exists. Do you want to join?`,
            userButtonText: "JOIN"
          });
          return;
        }
        console.log("can create room...creating...");
        this.setState({
          roomActive: true,
          streamer: true,
          roomName,
          userMessage: "Room created. Start streaming.",
          userButtonText: "STREAM",
          renderMessage: true
        });
      })
      .catch(err => {
        console.log("Error fetching room name...", err);
      })
      // if available, then create room
      // else handle UI, return
  }

  startStream(evt) {
    this.setState({
      renderMessage: false
    });

    navigator.mediaDevices.getUserMedia({
      audio: true, video: { width: { max: 1280 }, height: { max: 720} }
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

    this.sendStreamToServer(this.state.roomName, this.state.user);
  }

  resetState() {
    this.setState({
      localStream: null,
      stream: null,
      roomActive: false,
      streamer: false,
      streamStarted: false,
      roomName: null,
      renderMessage: '',
      userMessage: '',
      userButtonText: ''
    });

    this.inputEl.value = '';
  }

  endStream(evt) {
    this.socket.close();
    for (let peer in this.peers) {
      this.peers[peer].close();
    }
    this.resetState();

    this.MediaStream && this.MediaStream.stop();
  }

  joinStream() {
    this.setState({
      renderMessage: false
    });
    // check to see if room requires a password
      // handle UI for password input
        // if password fails, handle UI and return
    fetch('/streams/auth/' + this.state.roomName, {
      method: 'post',
      body: JSON.stringify({ pw: this.streamPassword }),
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then(res => {
        if (res.err || !res.ok) {
          console.log("password invalid...");
          return;
        }

        this.socket = io(`/streams/${this.state.roomName}`).connect();
        this.initRoomSocket(this.socket, this.state.roomName, this.state.user);
      })
      .catch(err => {
        console.log("error with password stuff...", err);
      });
  }

  handleJoinClick(evt) {
    // check to see if room name has been entered
    if (!this.inputEl.value) {
      // if not, then handle UI. Return
      console.log('--- roomname has not been entered...')
      return;
    }

    const roomName = this.inputEl.value.split(" ").join("+");
    // check to see if room is available
    fetch("/streams/" + roomName)
      .then(res => res.json())
      .then(res => {
        if (res.err) {
          return;
        }
        if (!res.room) {
          console.log("Either there was an error or the room does not exist...");
          this.setState({
            renderMessage: true,
            userMessage: "Room does not exist. Do you want to start it?",
            userButtonText: "CREATE"
          });
          return;
        }

        this.setState({
          roomName,
          streamer: false,
          roomActive: true
        }, this.joinStream);
      })
      .catch(err => {
        console.log("Error finding room...", err);
      })
      // if available then join room
      // else handle UI, return

  }

  userMessageClick(evt) {
    this.setState({
      renderMessage: false
    }, () => {
      switch(this.state.userButtonText.toLowerCase()) {
        case 'join':
          this.handleJoinClick(evt);
          break;
        case 'create':
          this.handleCreateClick(evt);
          break;
        case 'stream':
          this.startStream(evt);
          break;
        default:
          break;
      }
    });
  }

  render() {
    return (
      <div id='video-comp'>
        <video autoPlay src={this.state.localStream} id='video'/>
        {
          this.state.renderMessage && (
            <div id="user-message">
              <div>{this.state.userMessage}</div>
              <button className="active" id="user-message-button" onClick={this.userMessageClick}>{this.state.userButtonText}</button>
            </div>
          )
        }
        <div id='user-controls'>
          <form onSubmit={this.roomFormSubmit}>
            <input ref={el => this.inputEl = el} placeholder=" Enter a new room name or join an existing one."/>
          </form>
          {
            // room has not been created/joined yet then show these
            !this.state.roomActive ? 
              (
                <div id='video-controls'>
                  <button className="active" onClick={this.handleCreateClick}> CREATE </button>
                  <button className="active" onClick={this.handleJoinClick}> JOIN </button>
                </div>
              ) :
              (
                <div id='video-controls'>
                  {
                    this.state.streamer ? 
                      <button className={this.state.streamStarted ? "inactive" : "active"} disabled={this.state.streamStarted} onClick={this.startStream}>STREAM</button>
                      : null
                  }
                  <button className={this.state.streamStarted ? "active" : "inactive"} disabled={!this.state.streamStarted} onClick={this.endStream}>END</button>
                </div>
              )
          }
        </div>
      </div>
    )
  }
}