qwebirc.irc.PMODE_LIST = 0;
qwebirc.irc.PMODE_SET_UNSET = 1;
qwebirc.irc.PMODE_SET_ONLY = 2;
qwebirc.irc.PMODE_REGULAR_MODE = 3;

qwebirc.irc.RegisteredCTCPs = {
  "VERSION": function(x) {
    return "iris v" + qwebirc.VERSION + " -- " + qwebirc.util.browserVersion();
  },
  "USERINFO": function(x) { return "qwebirc"; },
  "TIME": function(x) { return qwebirc.irc.IRCDate(new Date()); },
  "PING": function(x) { return x; },
  "CLIENTINFO": function(x) { return "PING VERSION TIME USERINFO CLIENTINFO WEBSITE"; },
  "WEBSITE": function(x) { return window == window.top ? "direct" : document.referrer; }
};

qwebirc.irc.BaseIRCClient = new Class({
  session: null,
  initialize: function(session, connOptions) {
    this.session = session;

    this.toIRCLower = qwebirc.irc.RFC1459toIRCLower;

    this.nickname = connOptions.nickname;
    this.authUser = connOptions.authUser;
    this.authSecret = connOptions.authSecret;
    this.lowerNickname = this.toIRCLower(this.nickname);

    this.__signedOn = false;
    this.__connected = false;
    this.caps = {};
    this.sasl_timeout = false;
    this.pmodes = {b: qwebirc.irc.PMODE_LIST, l: qwebirc.irc.PMODE_SET_ONLY, k: qwebirc.irc.PMODE_SET_UNSET, o: qwebirc.irc.PMODE_SET_UNSET, v: qwebirc.irc.PMODE_SET_UNSET};
    this.channels = {}
    this.nextctcp = 0;

    this.connections = [];
    for(var x = 0; x < conf.frontend.connections.length; x++) {
      switch(conf.frontend.connections[x]) {
      case "ajax":  this.connections.unshift(qwebirc.irc.IRCConnection); break;
      case "flash": this.connections.unshift(qwebirc.irc.FlashConnection); break;
      case "websocket": this.connections.unshift(qwebirc.irc.WSConnection); break;
      }
    }

    this.setupGenericErrors();
  },
  send: function(data) {
    return this.connection.send(data);
  },
  connect: function() {
    this.tryConnect();
  },
  disconnect: function() {
    this.connection.disconnect();
  },
  tryConnect: function() {
    var options = {};
    var Connection = this.connections.pop();
    if(Connection) {
      options.initialNickname = this.nickname;
      options.onRecv = this.dispatch.bind(this);
      this.connection = new Connection(this.session, options);
      this.connection.connect();
    } else {
      this.disconnected("Unable to connect")
    }
  },
  dispatch: function(data) {
    var message = data[0];
    if(message == "connect") {
      this.__connected = true;
      this.connected();
    } else if(message == "disconnect") {
      if(data.length == 0) {
        this.disconnected("No error!");
      } else {
        this.disconnected(data[1]);
      }
      if(this.__connected) {
        this.disconnect();
      } else {
        this.tryConnect();
      }
    } else if(message == "c") {
      var line = data[1];
      var command = "";
      var prefix = "";
      var params = [];
      var trailing = "";

      if (line[0] == ":") {
          var index = line.indexOf(" ");
          prefix = line.substring(1, index);
          line = line.substring(index + 1);
      }
      if (line.indexOf(" :") != -1) {
          var index = line.indexOf(" :");
          trailing = line.substring(index + 2);
          params = line.substring(0, index).split(" ");
          params.push(trailing);
      } else {
          params = line.split(" ");
      }
      command = params.splice(0, 1)[0].toUpperCase();

      var n = qwebirc.irc.Numerics[command];

      var x = n;
      if(!n)
        n = command;

      var o = this["irc_" + n];

      if(o) {
        var r = o.run([prefix, params], this);
        if(!r)
          this.rawNumeric(command, prefix, params);
      } else {
        this.rawNumeric(command, prefix, params);
      }
    }
  },
  isChannel: function(target) {
    var c = target.charAt(0);
    return c == '#';
  },
  supported: function(key, value) {
    if(key == "CASEMAPPING") {
      if(value == "ascii") {
        this.toIRCLower = qwebirc.irc.ASCIItoIRCLower;
      } else if(value == "rfc1459") {
        /* IGNORE */
      } else {
        /* TODO: warn */
      }
      this.lowerNickname = this.toIRCLower(this.nickname);
    } else if(key == "CHANMODES") {
      var smodes = value.split(",");
      for(var i=0;i<smodes.length;i++)
        for(var j=0;j<smodes[i].length;j++)
          this.pmodes[smodes[i].charAt(j)] = i;
    } else if(key == "PREFIX") {
      var l = (value.length - 2) / 2;

      var modeprefixes = value.substr(1, l).split("");
      modeprefixes.each(function(modeprefix) {
        this.pmodes[modeprefix] = qwebirc.irc.PMODE_SET_UNSET;
      }, this);
    }
  },
  irc_AUTHENTICATE: function(prefix, params) {
    this.send("AUTHENTICATE "+btoa([this.authUser, this.authUser, this.authSecret].join('\0')));
    return true;
  },
  irc_saslFinished: function(prefix, params) {
    this.send("CAP END");
    $clear(this.sasl_timeout);
    return false;
  },
  __saslTimeout: function() {
    this.send("CAP END");
  },
  irc_CAP: function(prefix, params) {
    var caplist;
    switch(params[1]) {
    case "ACK":
      if (params[2] == "*") {
        caplist = params[3].split(" ");
      } else {
        caplist = params[2].split(" ");
      }

      for (i = 0; i < caplist.length; i++)
        this.caps[caplist[i]] = true

      if (params[2] != "*") {
        if(this.caps.sasl && this.authUser) {
          this.send("AUTHENTICATE "+conf.atheme.sasl_type);
          this.sasl_timeout = this.__saslTimeout.delay(15000, this);
        } else {
          this.send("CAP END");
        }
      }
      break;
    case "NAK":
      this.send("CAP END");
      break;
    case "LS":
      if (params[2] == "*") {
        caplist = params[3].split(" ");
      } else {
        caplist = params[2].split(" ");
      }

      for (i = 0; i < caplist.length; i++) {
        if (caplist[i] == "sasl")
          this.caps[caplist[i]] = false;
        if (caplist[i] == "multi-prefix")
          this.caps[caplist[i]] = false;
      }

      if (params[2] != "*") {
        caplist = Object.keys(this.caps);
        if(caplist.length) {
          this.send("CAP REQ :"+caplist.join(" "));
        } else {
          this.send("CAP END");
        }
      }
    }

    return true;
  },
  irc_RPL_WELCOME: function(prefix, params) {
    this.nickname = params[0];
    this.lowerNickname = this.toIRCLower(this.nickname);
    this.__signedOn = true;
    this.signedOn(this.nickname);
  },
  irc_NICK: function(prefix, params) {
    var user = prefix;
    var oldnick = user.hostToNick();
    var newnick = params[0];

    if(this.nickname == oldnick) {
      this.nickname = newnick;
      this.lowerNickname = this.toIRCLower(this.nickname);
    }

    this.nickChanged(user, newnick);

    return true;
  },
  irc_QUIT: function(prefix, params) {
    var user = prefix;

    var message = params.indexFromEnd(-1);

    this.userQuit(user, message);

    return true;
  },
  irc_PART: function(prefix, params) {
    var user = prefix;
    var channel = params[0];
    var message = params[1];

    var nick = user.hostToNick();

    if((nick == this.nickname) && this.__getChannel(channel))
      this.__killChannel(channel);

    this.userPart(user, channel, message);

    return true;
  },
  __getChannel: function(name) {
    return this.channels[this.toIRCLower(name)];
  },
  __killChannel: function(name) {
    delete this.channels[this.toIRCLower(name)];
  },
  __nowOnChannel: function(name) {
    this.channels[this.toIRCLower(name)] = 1;
  },
  irc_KICK: function(prefix, params) {
    var kicker = prefix;
    var channel = params[0];
    var kickee = params[1];
    var message = params[2];

    if((kickee == this.nickname) && this.__getChannel(channel))
      this.__killChannel(channel);

    this.userKicked(kicker, channel, kickee, message);

    return true;
  },
  irc_PING: function(prefix, params) {
    this.send("PONG :" + params.indexFromEnd(-1));

    return true;
  },
  irc_JOIN: function(prefix, params) {
    var channel = params[0];
    var user = prefix;
    var nick = user.hostToNick();

    if(nick == this.nickname)
      this.__nowOnChannel(channel);

    this.userJoined(user, channel);

    return true;
  },
  irc_TOPIC: function(prefix, params) {
    var user = prefix;
    var channel = params[0];
    var topic = params.indexFromEnd(-1);

    this.channelTopic(user, channel, topic);

    return true;
  },
  processCTCP: function(message) {
    if(message.charAt(0) != "\x01")
      return;

    if(message.charAt(message.length - 1) == "\x01") {
      message = message.substr(1, message.length - 2);
    } else {
      message = message.substr(1);
    }
    return message.splitMax(" ", 2);
  },
  irc_PRIVMSG: function(prefix, params) {
    var user = prefix;
    var target = params[0];
    var message = params.indexFromEnd(-1);

    var ctcp = this.processCTCP(message);
    if(ctcp) {
      var type = ctcp[0].toUpperCase();

      var replyfn = qwebirc.irc.RegisteredCTCPs[type];
      if(replyfn) {
        var t = new Date().getTime() / 1000;
        if(t > this.nextctcp)
          this.send("NOTICE " + user.hostToNick() + " :\x01" + type + " " + replyfn(ctcp[1]) + "\x01");
        this.nextctcp = t + 5;
      }

      if(target == this.nickname) {
        this.userCTCP(user, type, ctcp[1]);
      } else {
        this.channelCTCP(user, target, type, ctcp[1]);
      }
    } else {
      if(target == this.nickname) {
        this.userPrivmsg(user, message);
      } else {
        this.channelPrivmsg(user, target, message);
      }
    }

    return true;
  },
  irc_NOTICE: function(prefix, params) {
    var user = prefix;
    var target = params[0];
    var message = params.indexFromEnd(-1);

    /* Handle globals, channel notices, server notices, and other notices. */
    if (target[0] == "$") {
      if (user != "")
        this.userNotice(user, message);
      else
        this.serverNotice(user, message);
    } else if (target != this.nickname && this.__signedOn) {
      this.channelNotice(user, target, message);
    } else if((user == "") || (user.indexOf("!") == -1)) {
      this.serverNotice(user, message);
    } else {
      var ctcp = this.processCTCP(message);
      if(ctcp) {
        this.userCTCPReply(user, ctcp[0], ctcp[1]);
      } else {
        this.userNotice(user, message);
      }
    }

    return true;
  },
  irc_INVITE: function(prefix, params) {
    var user = prefix;
    var channel = params.indexFromEnd(-1);

    this.userInvite(user, channel);

    return true;
  },
  irc_ERROR: function(prefix, params) {
    var message = params.indexFromEnd(-1);

    this.serverError(message);

    return true;
  },
  irc_MODE: function(prefix, params) {
    var user = prefix;
    var target = params[0];
    var args = params.slice(1);

    if(target == this.nickname) {
      this.userMode(args);
    } else {
      var modes = args[0].split("");
      var xargs = args.slice(1);

      var data = []
      var carg = 0;
      var pos = 0;
      var cmode = "+";

      modes.each(function(mode) {
        if((mode == "+") || (mode == "-")) {
          cmode = mode;
          return;
        }

        var d;
        var pmode = this.pmodes[mode];
        if(pmode == qwebirc.irc.PMODE_LIST || pmode == qwebirc.irc.PMODE_SET_UNSET || (cmode == "+" && pmode == qwebirc.irc.PMODE_SET_ONLY)) {
          d = [cmode, mode, xargs[carg++]]
        } else {
          d = [cmode, mode]
        }

        data.push(d);
      }, this);

      this.channelMode(user, target, data, args);
    }

    return true;
  },
  irc_RPL_ISUPPORT: function(prefix, params) {
    var supported = params.slice(1, -1);

    var items = {};
    for(var i=0;i<supported.length;i++) {
      var l = supported[i].splitMax("=", 2);
      items[l[0]] = true;
    }

    if(items.CHANMODES && items.PREFIX) /* nasty hack */
      this.pmodes = {};

    for(var i=0;i<supported.length;i++) {
      var l = supported[i].splitMax("=", 2);
      this.supported(l[0], l[1]);
    }
  },
  irc_RPL_NAMREPLY: function(prefix, params) {
    var channel = params[2];
    var names = params[3];

    this.channelNames(channel, names.split(" "));

    return true;
  },
  irc_RPL_ENDOFNAMES: function(prefix, params) {
    var channel = params[1];

    this.channelNames(channel, []);
    return true;
  },
  irc_RPL_NOTOPIC: function(prefix, params) {
    var channel = params[1];

    if(this.__getChannel(channel)) {
      this.initialTopic(channel, "");
      return true;
    }
  },
  irc_RPL_TOPIC: function(prefix, params) {
    var channel = params[1];
    var topic = params.indexFromEnd(-1);

    if(this.__getChannel(channel)) {
      this.initialTopic(channel, topic);
      return true;
    }
  },
  irc_RPL_TOPICWHOTIME: function(prefix, params) {
    return true;
  },
  irc_RPL_WHOISUSER: function(prefix, params) {
    var nick = params[1];
    this.whoisNick = nick;

    return this.whois(nick, "user", {ident: params[2], hostname: params[3], realname: params.indexFromEnd(-1)});
  },
  irc_RPL_WHOISSERVER: function(prefix, params) {
    var nick = params[1];
    var server = params[2];
    var serverdesc = params.indexFromEnd(-1);

    return this.whois(nick, "server", {server: params[2], serverdesc: params.indexFromEnd(-1)});
  },
  irc_RPL_WHOISOPERATOR: function(prefix, params) {
    var nick = params[1];
    var text = params.indexFromEnd(-1);

    return this.whois(nick, "oper", {opertext: params.indexFromEnd(-1)});
  },
  irc_RPL_WHOISIDLE: function(prefix, params) {
    var nick = params[1];

    return this.whois(nick, "idle", {idle: params[2], connected: params[3]});
  },
  irc_RPL_WHOISCHANNELS: function(prefix, params) {
    var nick = params[1];

    return this.whois(nick, "channels", {channels: params.indexFromEnd(-1)});
  },
  irc_RPL_WHOISACCOUNT: function(prefix, params) {
    var nick = params[1];

    return this.whois(nick, "account", {account: params[2]});
  },
  irc_RPL_WHOISACTUALLY: function(prefix, params) {
    var nick = params[1];

    return this.whois(nick, "actually", {hostmask: params[2], ip: params[3]});
  },
  irc_RPL_WHOISOPERNAME: function(prefix, params) {
    var nick = params[1];
    var opername = params[2];

    return this.whois(nick, "opername", {opername: params[2]});
  },
  irc_RPL_WHOISAVAILHELP: function(prefix, params) {
    var nick = params[1];
    return this.whois(nick, "availhelp", {});
  },
  irc_RPL_WHOISREGGED: function(prefix, params) {
    var nick = params[1];
    return this.whois(nick, "regged", {});
  },
  irc_RPL_WHOISMODES: function(prefix, params) {
    var nick = params[1];
    var text = params.indexFromEnd(-1);
    var modes = text.split(" ").slice(3).join(" ");

    return this.whois(nick, "modes", {modes: modes});
  },
  irc_RPL_WHOISREALHOST: function(prefix, params) {
    var nick = params[1];
    var text = params.indexFromEnd(-1);
    var hostname = text.split(" ")[3];
    var ip = text.split(" ")[4];
    return this.whois(nick, "realhost", {hostname: hostname, ip: ip});
  },
  irc_RPL_WHOISGENERICTEXT: function(prefix, params) {
    var nick = params[1];
    var text = params.indexFromEnd(-1);

    return this.whois(nick, "generictext", {text: text});
  },
  irc_RPL_WHOISWEBIRC: function(prefix, params) {
    var nick = params[1];
    var text = params.indexFromEnd(-1);

    return this.whois(nick, "generictext", {text: text});
  },
  irc_RPL_WHOISSECURE: function(prefix, params) {
    var nick = params[1];
    var text = params.indexFromEnd(-1);

    return this.whois(nick, "generictext", {text: text});
  },
  irc_RPL_ENDOFWHOIS: function(prefix, params) {
    var nick = params[1];
    var text = params.indexFromEnd(-1);
    this.whoisNick = null;

    return this.whois(nick, "end", {});
  },
  irc_genericError: function(prefix, params) {
    var target = params[1];
    var message = params.indexFromEnd(-1);

    this.genericError(target, message);
    return true;
  },
  irc_genericQueryError: function(prefix, params) {
    var target = params[1];
    var message = params.indexFromEnd(-1);

    this.genericQueryError(target, message);
    return true;
  },
  irc_genericNickInUse: function(prefix, params) {
    this.genericError(params[1], params.indexFromEnd(-1).replace("in use.", "in use"));

    if(this.__signedOn)
      return true;

    /* this also handles ERR_UNAVAILRESOURCE, which can be sent for both nicks and
     * channels, but since this.__signedOn is false, we can safely assume it means
     * a nick. */
    var newnick = params[1] + "_";
    if(newnick == this.lastnick)
      newnick = "iris" + Math.floor(Math.random() * 1024 * 1024);

    this.send("NICK " + newnick);
    this.lastnick = newnick;
    return true;
  },
  setupGenericErrors: function() {
    this.irc_ERR_CHANOPPRIVSNEEDED = this.irc_ERR_CANNOTSENDTOCHAN = this.irc_genericError;
    this.irc_ERR_NOSUCHNICK = this.irc_genericQueryError;
    this.irc_ERR_NICKNAMEINUSE = this.irc_ERR_UNAVAILRESOURCE = this.irc_genericNickInUse;
    this.irc_RPL_LOGGEDIN = this.irc_ERR_NICKLOCKED = this.irc_saslFinished;
    this.irc_ERR_SASLFAIL = this.irc_ERR_SASLTOOLONG = this.irc_saslFinished;
    this.irc_ERR_SASLABORTED = this.irc_ERR_SASLALREADY = this.irc_saslFinished;
    return true;
  },
  irc_RPL_AWAY: function(prefix, params) {
    var nick = params[1];
    var text = params.indexFromEnd(-1);

    if(this.whoisNick && (this.whoisNick == nick))
      return this.whois(nick, "away", {"away": text});

    this.awayMessage(nick, text);
    return true;
  },
  irc_RPL_NOWAWAY: function(prefix, params) {
    this.awayStatus(true, params.indexFromEnd(-1));
    return true;
  },
  irc_RPL_UNAWAY: function(prefix, params) {
    this.awayStatus(false, params.indexFromEnd(-1));
    return true;
  },
  irc_WALLOPS: function(prefix, params) {
    var user = prefix;
    var text = params.indexFromEnd(-1);

    this.wallops(user, text);
    return true;
  },
  irc_RPL_CREATIONTIME: function(prefix, params) {
    var channel = params[1];
    var time = params[2];

    this.channelCreationTime(channel, time);
    return true;
  },
  irc_RPL_CHANNELMODEIS: function(prefix, params) {
    var channel = params[1];
    var modes = params.slice(2);

    this.channelModeIs(channel, modes);
    return true;
  }
});
