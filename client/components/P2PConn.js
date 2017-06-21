import React from 'react';
import io from 'socket.io-client';
// import components
import VideoComp from './videocomp';

export default class P2PConn extends React.Component {
  constructor(props) {
    super(props);

    this.peers = {};

    this.sendStreamToServer = this.sendStreamToServer.bind(this);
    this.initBroadcasterSocket = this.initBroadcasterSocket.bind(this);
    this.initRoomSocket = this.initRoomSocket.bind(this);
  } 

  sendStreamToServer(roomName, user) {
    const socket = io('/streams/broadcast').connect();
    this.initBroadcasterSocket(socket, roomName, user);
  }

  initBroadcasterSocket(socket, roomName, user) {
    socket.on('connect', () => {
      socket.emit('broadcast', JSON.stringify({ roomName }), data => {
          if (data !== 'ready') return;
          this.socket = io(`/streams/${roomName}`).connect();
          this.initRoomSocket(this.socket, roomName, user);
        });
    }, (e) => {
      console.log('error?', e)
    });
  }

  initRoomSocket(socket, roomName, user) {
    this.setState({
      streamStarted: true
    });
    const self = this;
    const peers = this.peers;
    // const username = user ? user : streamingUser;

    socket.on('connect', () => {
      if (!this.state.streamer) {
        socket.emit('peer', JSON.stringify({
          roomName
        }));
      }
      // if (username !== streamingUser) {
      //   socket.emit('peer', JSON.stringify({
      //     username,
      //     streamingUser
      //   }));
      // }

      socket.emit('user', JSON.stringify({ 
        roomName,
        userIsStreamer: this.state.streamer, //username === streamingUser
        password: this.streamPassword
      }));

      // socket.emit('user', JSON.stringify({ 
      //   username,
      //   streamingUser,
      //   userIsStreamer: username === streamingUser
      // }));
    });

    socket.on('peer', _message => {
      const message = JSON.parse(_message);
      console.log("Peer received: ", message);
      // Create offer
      const peer = new RTCPeerConnection();
      peers[message.peer] = peer;

      peer.addStream(this.state.stream);
      peer.onicecandidate = event => {
        const iceCandidate = { 
          candidate: event.candidate,
          sendTo: message.peer
        };
        // send candidate info to server socket
        socket.emit('ice candidate', JSON.stringify(iceCandidate));
      }

      peer.createOffer({
        offerToReceiveAudio: 1, 
        offerToReceiveVideo: 1
      }).then(desc => {
        // set localDescription to this desc
        peer.setLocalDescription(desc)
          .then(() => { console.log('success setting local description for viewer')})
          .catch(e => { console.log('error setting local description for viewer : ', e)});

        const offer = {
          desc,
          sendTo: message.peer
        };

        socket.emit('offer', JSON.stringify(offer));
      })
        .catch(e => { console.log('error making offer : ', e)});

    });

    socket.on('ice candidate', _message => {
      const message = JSON.parse(_message);
      const candidate = message.candidate;
      const peer = peers[message.sendTo];

      if (!candidate) return;

      peer.addIceCandidate(new RTCIceCandidate(candidate))
        .then(() => { 
          console.log('Successfully added ICE candidate');
        })
        .catch(e => {
          console.log('Error adding ICE candidate : ', e);
        });
    })

    socket.on('offer', _message => {
      const message = JSON.parse(_message);
      console.log("offer received: ", message);
      self.connectedParentPeer = message.sendTo;

      // Create new RTCPeerConn
      const peer = new RTCPeerConnection();
      peers[message.sendTo] = peer;

      peer.onaddstream = event => {
        self.setState({
          localStream: URL.createObjectURL(event.stream),
          stream: event.stream
        });
      }

      // Create Answer
      peer.setRemoteDescription(message.desc)
        .then(() => { console.log('success setting remote description to broadcaster')})
        .catch(e => { console.log('error setting remote description to broadcaster : ', e)});
      // create an answer and send back description
      peer.createAnswer()
        .then(desc => {
          // set local desc to this desc
          peer.setLocalDescription(desc)
          .then(() => { console.log('success setting local description for viewer')})
          .catch(e => { console.log('error setting local desc for viewer : ', e)});

          const answer = {
            desc,
            sendTo: message.sendTo
          }

          socket.emit('answer', JSON.stringify(answer));
        })
        .catch(e => { console.log('error creating answer : ', e)});
    });

    socket.on('answer', _message => {
      const message = JSON.parse(_message);
      const peer = peers[message.sendTo];
      peer.setRemoteDescription(message.desc)
        .then(() => { console.log('success setting remote description to broadcaster')})
        .catch(e => { console.log('error setting remote description to broadcaster : ', e)});
    });

    socket.on('disconnected', _message => {
      /*
      ** A socket has disconnected. Check if the stream
      ** has ended (ie: broadcaster disconnected). Check if the 
      ** peer this socket is connected to has disconnected. 
      */
      const message = JSON.parse(_message);
      if (message.streamEnd) {
        console.log("Stream has ended...");
        self.resetState();

        for (let conn in self.peers) {
          self.peers[conn].close();
        }

        self.peers = {};
        return;
      }

      // if disconnected socket is not the connected parent peer to this socket, do nothing
      if (message.socketID !== self.connectedParentPeer) return;

      // attempt to reconnect 
      console.log("Lost connection to peer. Attempting to reestablish...");
      peers[message.socketID].close();
      delete peers[message.socketID];
      // handle UI while client waits to connect to next available peer 
      socket.emit('peer', JSON.stringify({
        username,
        streamingUser
      }));

    });


  }
}