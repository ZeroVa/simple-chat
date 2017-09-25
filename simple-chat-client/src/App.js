import React, { Component } from 'react';
import './App.css';
import openSocket from 'socket.io-client';
import qs from 'query-string';

const socket = openSocket(window.location.hostname+':3005');

var ChatMessage = (props) => (
  <li><p>
    <span className="text-primary">{new Date(props.message.sent).toLocaleTimeString("en-US", {hour: '2-digit', minute:'2-digit'})}</span>
    : {props.message.messageText}
  </p></li>
);

class App extends Component {


  constructor(props) {
    super(props);
    var query = qs.parse(props.location.search);
    this.state = {
      chat: undefined,
      shouldScrollToBottom: false,
    }
    socket.on('startChat', chat => {
      this.setState({ chat: chat, shouldScrollToBottom: true });
      var old = qs.parse(this.props.location.search);
      old.chat = chat._id;
      this.props.history.replace({
        search: qs.stringify(old)
      });
    });

    socket.on('newMessage', message => {
      var chat = this.state.chat;
      chat.messages.push(message);
      this.setState({ chat: chat, shouldScrollToBottom: true });
    });

    socket.emit('startChat', query.chat);
    this.newMessage = this.newMessage.bind(this);
  }

  newMessage(e) {
    if (e) e.preventDefault();
    if (!this.state.chat || !this.state.newMessage || !this.state.newMessage.length) {
      return;
    }

    socket.emit('newMessage', {
      chatId: this.state.chat._id,
      messageText: this.state.newMessage,
      sent: new Date(),
    });

    this.setState({ newMessage: '' });
  }

  componentWillMount() {

  }


  componentDidUpdate() {
    if (this.state.shouldScrollToBottom) {
      this.messagesWindow.scrollTop = this.messagesWindow.scrollHeight;
      this.setState({ shouldScrollToBottom: false });
    }
  }


  render() {
    return (
      <div className="App">
        <div className="header py-1 px-1">
          <img src="https://cdn.crickethealth.com/1/img/logos/logo-lg-peach.svg" alt="" />
        </div>
        <div className="chat-window mx-auto px-2">
          <div className="messages-window bg-white rounded px-2" ref={(elem) => { this.messagesWindow = elem }}>
            <ul className="list-unstyled">
              {this.state.chat && this.state.chat.messages ? this.state.chat.messages.map(message => {
                if (message) {
                  return (
                    <ChatMessage key={message._id} message={message}></ChatMessage>
                  );
                }
                return '';
              }) : 'This conversation has no messages so far. Why not send one?'}
            </ul>
          </div>
          <form onSubmit={this.newMessage} className="new-message-box d-flex mt-2">
            <input className="w-100 px-2 py-3 rounded" value={this.state.newMessage} onChange={(event) => { this.setState({ newMessage: event.target.value }) }} />
            <button type="submit" className="ml-2 px-3 rounded" onClick={this.newMessage} style={{ flexShrink: 0 }}>Send</button>
          </form>
        </div>
      </div>
    );
  }
}

export default App;
