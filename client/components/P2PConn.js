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

  sendStreamToServer(streamingUser, user) {
    const socket = io('/streams/broadcast').connect();
    this.initBroadcasterSocket(socket, streamingUser, user);
  }

  initBroadcasterSocket(socket, streamingUser, user) {
    socket.on('connect', () => {
      socket.emit('broadcast', JSON.stringify({ streamingUser }), data => {
          if (data !== 'ready') return;
          const roomSocket = io(`/streams/${streamingUser}`).connect();
          this.initRoomSocket(roomSocket, streamingUser, user);
        });
    }, (e) => {
      console.log('error?', e)
    });
  }

  initRoomSocket(socket, streamingUser, user) {
    const self = this;
    const peers = this.peers;

    socket.on('connect', () => {
      const username = user ? user : streamingUser;
      if (username !== streamingUser) {
        socket.emit('peer', JSON.stringify({
          username,
          streamingUser
        }));
      }

      socket.emit('user', JSON.stringify({ 
        user: username,
        streamingUser
      }));
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
  }
}