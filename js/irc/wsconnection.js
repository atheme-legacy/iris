
qwebirc.irc.WSConnection = new Class({
  Implements: [Events, Options],
  options: {
    initialNickname: "ircconnX",
    url: "ws://irc.example.com/",
    timeout: 45000,
    maxRetries: 5,
    serverPassword: null
  },
  initialize: function(session, options) {
    this.setOptions(options, conf.websocket);
  },
  connect: function() {
    if(!window.WebSocket) {
      this.fireEvent("recv", [["disconnect", "No WebSocket Support"]]);
      return;
    }
    this.socket = new WebSocket(this.options.url, "irc");
    this.socket.onopen = this.connected.bind(this);
    this.socket.onclose = this.disconnected.bind(this);
    this.socket.onmessage = this.recv.bind(this);
  },
  connected: function(e) {
    this.send("CAP LS");
    this.send("USER "+this.options.initialNickname+" 0 * :qwebirc");
    if(this.options.serverPassword)
      this.send("PASS :"+this.options.serverPassword);
    this.send("NICK "+this.options.initialNickname);
    this.fireEvent("recv", [["connect"]]);
  },
  disconnect: function() {
    this.socket.close();
  },
  disconnected: function(e) {
    this.fireEvent("recv", [["disconnect", e.reason ? e.reason : "Unknown reason"]]);
  },
  send: function(data, synchronous) {
    this.socket.send(String(data));
    return true;
  },
  recv: function recv(message) {
    this.fireEvent("recv", [["c", message.data]]);
  }
});
