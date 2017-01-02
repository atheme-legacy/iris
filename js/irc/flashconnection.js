
qwebirc.irc.FlashConnection = new Class({
  Implements: [Events, Options],
  options: {
    initialNickname: "ircconnX",
    server: "irc.example.com",
    port: 6667,
    xmlport: 8430,
    timeout: 45000,
    maxRetries: 5,
    serverPassword: null
  },
  initialize: function(session, options) {
    this.setOptions(options, conf.flash);
  },
  connect: function() {
    this.buffer = [];
    if(!FlashSocket.connect) {
      this.fireEvent("recv", [["disconnect", "No Flash support"]]);
      return;
    }
    FlashSocket.state = this.__state.bind(this);
    FlashSocket.connect(this.options.server, this.options.port, this.options.xmlport);
  },
  connected: function() {
    this.send("CAP LS");
    this.send("USER "+this.options.initialNickname+" 0 * :qwebirc");
    if(this.options.serverPassword)
      this.send("PASS :"+this.options.serverPassword);
    this.send("NICK "+this.options.initialNickname);
    this.fireEvent("recv", [["connect"]]);
  },
  disconnect: function() {
    FlashSocket.disconnect();
  },
  disconnected: function(reason) {
    reason = reason || "Connection Closed";
    this.fireEvent("recv", [["disconnect", reason]]);
  },
  send: function(data, synchronous) {
    FlashSocket.write(String(data)+"\r\n");
    return true;
  },
  recv: function(data) {
    var LF = 10;
    var buffer = this.buffer.concat(data);
    var i = buffer.indexOf(LF);
    while(i != -1) {
      var msg = buffer.splice(0, i+1);
      msg.pop(); //LF
      msg.pop(); //CR
      this.fireEvent("recv", [["c", this.decode(msg)]]);
      i = buffer.indexOf(LF);
    }
    this.buffer = buffer;
  },
  decode: function(buffer) {
    var replace = 65533; //U+FFFD 'REPLACEMENT CHARACTER'
    var points = [];
    var i = 0;
    while(i < buffer.length) {
      var len = 0;
      var point = 0;
      if ((buffer[i] & 0x80) == 0x00) {
        point = buffer[i++]
      } else if((buffer[i] & 0xE0) == 0xC0) {
        len = 1;
        point = (buffer[i++] & 0x1F);
      } else if((buffer[i] & 0xF0) == 0xE0) {
        len = 2;
        point = (buffer[i++] & 0x0F)
      } else if((buffer[i] & 0xF8) == 0xF0) {
        len = 3;
        point = (buffer[i++] & 0x07)
      } else {
        point = replace;
        i++;
      }
      for(x = 0; x < len && i < buffer.length; x++) {
        var octet = buffer[i++];
        if((octet & 0xC0) != 0x80)
          break;
        point = (point << 6) | (octet & 0x3F);
      }
      /* Prevent ascii being snuck past in unicode */
      if(len != 0 && point < 0x80)
        point = replace;
      /* Replace partial characters */
      if(x != len)
        point = replace;

      if(point >= 0x10000) {
        point -= 0x10000;
        points.push((point >>   10) + 0xD800);
        points.push((point % 0x400) + 0xDC00);
      } else {
        points.push(point);
      }
    }
    return String.fromCharCode.apply(null, points);
  },
  __state: function(state, msg) {
    if(state == 1 /* OPEN */)
      this.connected();
    if(state == 3 /* CLOSED */)
      this.disconnected();
    if(state == 4 /* ERROR */)
      this.disconnected(msg);
    if(state == 5 /* MESSAGE */) {
      this.recv(JSON.parse(msg));
    }
  }
});
