qwebirc.irc.IRCClient = new Class({
  Extends: qwebirc.irc.BaseIRCClient,
  session: null,
  initialize: function(session, connOptions) {
    this.parent(session, connOptions);

    this.prefixes = "@+";
    this.modeprefixes = "ov";
    this.autojoin = connOptions.autojoin;

    this.commandparser = new qwebirc.irc.Commands(session);
    this.exec = this.commandparser.dispatch.bind(this.commandparser);

    this.hilightController = new qwebirc.ui.HilightController(session);
    this.statusWindow = ui.newClient();
    this.lastNicks = [];

    this.inviteChanList = [];
    this.activeTimers = {};

    this.tracker = new qwebirc.irc.IRCTracker(this);
  },
  newLine: function(window, type, data) {
    if(!data)
      data = {};

    var w = ui.getWindow(type, window);
    if(w) {
      w.addLine(type, data);
    } else {
      this.statusWindow.addLine(type, data);
    }
  },
  newChanLine: function(channel, type, user, extra) {
    if(!extra)
      extra = {};

    if($defined(user)) {
      extra["n"] = user.hostToNick();
      extra["h"] = user.hostToHost();
    }
    extra["c"] = channel;
    extra["-"] = this.nickname;

    if(!(conf.ui.nick_status))
      delete extra["@"];

    this.newLine(channel, type, extra);
  },
  newServerLine: function(type, data) {
    this.statusWindow.addLine(type, data);
  },
  newActiveLine: function(type, data) {
    this.getActiveWindow().addLine(type, data);
  },
  newTargetOrActiveLine: function(target, type, data) {
    if(ui.getWindow(type, target)) {
      this.newLine(target, type, data);
    } else {
      this.newActiveLine(type, data);
    }
  },
  updateNickList: function(channel) {
    var n1 = this.tracker.getChannel(channel);
    var names = new Array();
    var tff = String.fromCharCode(255);
    var nh = {}

    /* MEGAHACK */
    for(var n in n1) {
      var nc = n1[n];
      var nx;

      if(nc.prefixes.length > 0) {
        var c = nc.prefixes.charAt(0);
        nx = String.fromCharCode(this.prefixes.indexOf(c)) + this.toIRCLower(n);
        nh[nx] = c + n;
      } else {
        nx = tff + this.toIRCLower(n);
        nh[nx] = n;
      }
      names.push(nx);
    };

    names.sort();

    var sortednames = new Array();
    names.each(function(name) {
      sortednames.push(nh[name]);
    });

    var w = ui.getWindow(qwebirc.ui.WINDOW_CHANNEL, channel);
    if(w)
      w.updateNickList(sortednames);
  },
  newWindow: function(name, type, select) {
    var w = ui.getWindow(type, name);
    if(!w) {
      w = ui.newWindow(type, name);
    }

    if(select)
      ui.selectWindow(w);

    return w;
  },
  newQueryWindow: function(name, privmsg) {
    var e;

    if(ui.getWindow(qwebirc.ui.WINDOW_QUERY, name))
      return;

    if(privmsg)
      return this.newPrivmsgQueryWindow(name);
    return this.newNoticeQueryWindow(name);
  },
  newPrivmsgQueryWindow: function(name) {
    if(conf.ui.dedicated_msg_window) {
      if(!ui.getWindow(qwebirc.ui.WINDOW_MESSAGES, "Messages"))
        return ui.newWindow(qwebirc.ui.WINDOW_MESSAGES, "Messages");
    } else {
      return this.newWindow(name, qwebirc.ui.WINDOW_QUERY, false);
    }
  },
  newNoticeQueryWindow: function(name) {
    if(conf.ui.dedicated_notice_window)
      if(!ui.getWindow(qwebirc.ui.WINDOW_MESSAGES, "Messages"))
        return ui.newWindow(qwebirc.ui.WINDOW_MESSAGES, "Messages");
  },
  newQueryLine: function(window, type, data, privmsg, active) {
    if(ui.getWindow(qwebirc.ui.WINDOW_QUERY, window))
      return this.newLine(window, type, data);

    var w = ui.getWindow(qwebirc.ui.WINDOW_MESSAGES, "Messages");

    var e;
    if(privmsg) {
      e = conf.ui.dedicated_msg_window;
    } else {
      e = conf.ui.dedicated_notice_window;
    }
    if(e && w) {
      return w.addLine(type, data);
    } else {
      if(active) {
        return this.newActiveLine(type, data);
      } else {
        return this.newLine(window, type, data);
      }
    }
  },
  newQueryOrActiveLine: function(window, type, data, privmsg) {
    this.newQueryLine(window, type, data, privmsg, true);
  },
  getActiveWindow: function() {
    return ui.getActiveIRCWindow();
  },
  getNickname: function() {
    return this.nickname;
  },
  addPrefix: function(nickchanentry, prefix) {
    var ncp = nickchanentry.prefixes + prefix;
    var prefixes = [];

    /* O(n^2) */
    for(var i=0;i<this.prefixes.length;i++) {
      var pc = this.prefixes.charAt(i);
      var index = ncp.indexOf(pc);
      if(index != -1)
        prefixes.push(pc);
    }

    nickchanentry.prefixes = prefixes.join("");
  },
  stripPrefix: function(nick) {
    var l = nick.charAt(0);
    if(!l)
      return nick;

    if(this.prefixes.indexOf(l) != -1)
      return nick.substring(1);

    return nick;
  },
  removePrefix: function(nickchanentry, prefix) {
    nickchanentry.prefixes = nickchanentry.prefixes.replaceAll(prefix, "");
  },

  /* from here down are events */
  rawNumeric: function(numeric, prefix, params) {
    this.newServerLine("RAW", {"n": "numeric", "m": params.slice(1).join(" ")});
  },
  signedOn: function(nickname) {
    this.tracker = new qwebirc.irc.IRCTracker(this);
    this.nickname = nickname;
    this.newServerLine("SIGNON");

    if(this.autojoin) {
      this.exec("/AUTOJOIN");
    }
  },
  userJoined: function(user, channel) {
    var nick = user.hostToNick();
    var host = user.hostToHost();

    if((nick == this.nickname) && !ui.getWindow(qwebirc.ui.WINDOW_CHANNEL, channel))
      this.newWindow(channel, qwebirc.ui.WINDOW_CHANNEL, true);
    this.tracker.addNickToChannel(nick, channel);

    if(nick == this.nickname) {
      this.newChanLine(channel, "OURJOIN", user);
    } else {
      if(!conf.ui.hide_joinparts) {
        this.newChanLine(channel, "JOIN", user);
      }
    }
    this.updateNickList(channel);
  },
  userPart: function(user, channel, message) {
    var nick = user.hostToNick();
    var host = user.hostToHost();

    if(nick == this.nickname) {
      this.tracker.removeChannel(channel);
      var w = ui.getWindow(qwebirc.ui.WINDOW_CHANNEL, channel);
      if(w)
        ui.closeWindow(w);
    } else {
      this.tracker.removeNickFromChannel(nick, channel);
      if(!conf.ui.hide_joinparts) {
        this.newChanLine(channel, "PART", user, {"m": message});
      }
      this.updateNickList(channel);
    }
  },
  userKicked: function(kicker, channel, kickee, message) {
    if(kickee == this.nickname) {
      this.tracker.removeChannel(channel);
      var w = ui.getWindow(qwebirc.ui.WINDOW_CHANNEL, channel);
      if(w)
        ui.closeWindow(w);
    } else {
      this.tracker.removeNickFromChannel(kickee, channel);
      this.updateNickList(channel);
    }

    this.newChanLine(channel, "KICK", kicker, {"v": kickee, "m": message});
  },
  channelMode: function(user, channel, modes, raw) {
    modes.each(function(mo) {
      var direction = mo[0];
      var mode = mo[1];

      var prefixindex = this.modeprefixes.indexOf(mode);
      if(prefixindex == -1)
        return;

      var nick = mo[2];
      var prefixchar = this.prefixes.charAt(prefixindex);

      var nc = this.tracker.getOrCreateNickOnChannel(nick, channel);
      if(direction == "-") {
        this.removePrefix(nc, prefixchar);
      } else {
        this.addPrefix(nc, prefixchar);
      }
    }, this);

    this.newChanLine(channel, "MODE", user, {"m": raw.join(" ")});

    this.updateNickList(channel);
  },
  userQuit: function(user, message) {
    var nick = user.hostToNick();

    var channels = this.tracker.getNick(nick);

    var clist = [];
    for(var c in channels) {
      clist.push(c);
      if(!conf.ui.hide_joinparts) {
        this.newChanLine(c, "QUIT", user, {"m": message});
      }
    }

    this.tracker.removeNick(nick);

    clist.each(function(cli) {
      this.updateNickList(cli);
    }, this);
  },
  nickChanged: function(user, newnick) {
    var oldnick = user.hostToNick();

    if(oldnick == this.nickname)
      this.nickname = newnick;

    this.tracker.renameNick(oldnick, newnick);

    var channels = this.tracker.getNick(newnick);
    var found = false;

    for(var c in channels) {
      var found = true;

      this.newChanLine(c, "NICK", user, {"w": newnick});
      /* TODO: rename queries */
      this.updateNickList(c);
    }

    /* this is quite horrible */
    if(!found)
      this.newServerLine("NICK", {"w": newnick, n: user.hostToNick(), h: user.hostToHost(), "-": this.nickname});
  },
  channelTopic: function(user, channel, topic) {
    this.newChanLine(channel, "TOPIC", user, {"m": topic});
    ui.getWindow(qwebirc.ui.WINDOW_CHANNEL, channel).updateTopic(topic);
  },
  initialTopic: function(channel, topic) {
    ui.getWindow(qwebirc.ui.WINDOW_CHANNEL, channel).updateTopic(topic);
  },
  channelCTCP: function(user, channel, type, args) {
    if(args == undefined)
      args = "";

    var nick = user.hostToNick();
    if(type == "ACTION") {
      this.tracker.updateLastSpoke(nick, channel, new Date().getTime());
      this.newChanLine(channel, "CHANACTION", user, {"m": args, "c": channel, "@": this.getNickStatus(channel, nick)});
      return;
    }

    this.newChanLine(channel, "CHANCTCP", user, {"x": type, "m": args, "c": channel, "@": this.getNickStatus(channel, nick)});
  },
  userCTCP: function(user, type, args) {
    var nick = user.hostToNick();
    var host = user.hostToHost();
    if(args == undefined)
      args = "";

    if(type == "ACTION") {
      this.newQueryWindow(nick, true);
      this.newQueryLine(nick, "PRIVACTION", {"m": args, "x": type, "h": host, "n": nick}, true);
      return;
    }

    this.newTargetOrActiveLine(nick, "PRIVCTCP", {"m": args, "x": type, "h": host, "n": nick, "-": this.nickname});
  },
  userCTCPReply: function(user, type, args) {
    var nick = user.hostToNick();
    var host = user.hostToHost();
    if(args == undefined)
      args = "";

    this.newTargetOrActiveLine(nick, "CTCPREPLY", {"m": args, "x": type, "h": host, "n": nick, "-": this.nickname});
  },
  getNickStatus: function(channel, nick) {
    var n = this.tracker.getNickOnChannel(nick, channel);
    if(!$defined(n))
      return "";

    if(n.prefixes.length == 0)
      return "";

    return n.prefixes.charAt(0);
  },
  channelPrivmsg: function(user, channel, message) {
    var nick = user.hostToNick();

    this.tracker.updateLastSpoke(nick, channel, new Date().getTime());
    this.newChanLine(channel, "CHANMSG", user, {"m": message, "@": this.getNickStatus(channel, nick)});
  },
  channelNotice: function(user, channel, message) {
    this.newChanLine(channel, "CHANNOTICE", user, {"m": message, "@": this.getNickStatus(channel, user.hostToNick())});
  },
  userPrivmsg: function(user, message) {
    var nick = user.hostToNick();
    var host = user.hostToHost();
    this.newQueryWindow(nick, true);
    this.pushLastNick(nick);
    this.newQueryLine(nick, "PRIVMSG", {"m": message, "h": host, "n": nick}, true);
  },
  serverNotice: function(user, message) {
    if(user == "") {
      this.newServerLine("SERVERNOTICE", {"m": message});
    } else {
      this.newServerLine("PRIVNOTICE", {"m": message, "n": user});
    }
  },
  userNotice: function(user, message) {
    var nick = user.hostToNick();
    var host = user.hostToHost();

    if(conf.ui.dedicated_notice_window) {
      this.newQueryWindow(nick, false);
      this.newQueryOrActiveLine(nick, "PRIVNOTICE", {"m": message, "h": host, "n": nick}, false);
    } else {
      this.newTargetOrActiveLine(nick, "PRIVNOTICE", {"m": message, "h": host, "n": nick});
    }
  },
  __joinInvited: function() {
    this.exec("/JOIN " + this.inviteChanList.join(","));
    this.inviteChanList = [];
    delete this.activeTimers["serviceInvite"];
  },
  userInvite: function(user, channel) {
    var nick = user.hostToNick();
    var host = user.hostToHost();

    this.newServerLine("INVITE", {"c": channel, "h": host, "n": nick});
  },
  userMode: function(modes) {
    this.newServerLine("UMODE", {"m": modes, "n": this.nickname});
  },
  channelNames: function(channel, names) {
    if(names.length == 0) {
      this.updateNickList(channel);
      return;
    }

    names.each(function(nick) {
      var prefixes = [];
      var splitnick = nick.split("");

      splitnick.every(function(c, i) {
        if(this.prefixes.indexOf(c) == -1) {
          nick = nick.substr(i);
          return false;
        }

        prefixes.push(c);
        return true;
      }, this);

      var nc = this.tracker.addNickToChannel(nick, channel);
      prefixes.each(function(p) {
        this.addPrefix(nc, p);
      }, this);
    }, this);
  },
  disconnected: function(message) {
    for(var x in session.windows) {
      var w = session.windows[x];
      if(w.type == qwebirc.ui.WINDOW_CHANNEL)
        ui.closeWindow(w);
    }
    this.tracker = undefined;

    qwebirc.connected = false;
    this.newServerLine("DISCONNECT", {"m": message});
  },
  nickOnChanHasPrefix: function(nick, channel, prefix) {
    var entry = this.tracker.getNickOnChannel(nick, channel);
    if(!$defined(entry))
      return false; /* shouldn't happen */

    return entry.prefixes.indexOf(prefix) != -1;
  },
  nickOnChanHasAtLeastPrefix: function(nick, channel, prefix, betterThan) {
    var entry = this.tracker.getNickOnChannel(nick, channel);
    if(!$defined(entry))
      return false; /* shouldn't happen */

    /* this array is sorted */
    var pos = this.prefixes.indexOf(prefix);
    if(pos == -1)
      return false;  /* shouldn't happen */

    /* If we're looking for prefixes better than the given prefix, don't
     * include it itself. Otherwise, do. */
    if (!betterThan)
      pos = pos + 1;

    var modehash = {};
    this.prefixes.slice(0, pos).split("").each(function(x) {
      modehash[x] = true;
    });

    var prefixes = entry.prefixes;
    for(var i=0;i<prefixes.length;i++)
      if(modehash[prefixes.charAt(i)])
        return true;

    return false;
  },
  supported: function(key, value) {
    if(key == "PREFIX") {
      var l = (value.length - 2) / 2;

      this.modeprefixes = value.substr(1, l);
      this.prefixes = value.substr(l + 2, l);
    }

    this.parent(key, value);
  },
  connected: function() {
    qwebirc.connected = true;
    this.newServerLine("CONNECT");
  },
  serverError: function(message) {
    this.newServerLine("ERROR", {"m": message});
  },
  quit: function(message) {
    this.send("QUIT :" + message, true);
    this.disconnect();
  },
  disconnect: function() {
    for(var k in this.activeTimers) {
      this.activeTimers[k].cancel();
    };
    this.activeTimers = {};

    this.parent();
  },
  awayMessage: function(nick, message) {
    this.newQueryLine(nick, "AWAY", {"n": nick, "m": message}, true);
  },
  whois: function(nick, type, data) {
    var ndata = {"n": nick};
    var mtype;

    var xsend = function() {
      this.newTargetOrActiveLine(nick, "WHOIS" + mtype, ndata);
    }.bind(this);

    if(type == "user") {
      mtype = "USER";
      ndata.h = data.ident + "@" + data.hostname;
      xsend();
      mtype = "REALNAME";
      ndata.m = data.realname;
    } else if(type == "server") {
      mtype = "SERVER";
      ndata.x = data.server;
      ndata.m = data.serverdesc;
    } else if(type == "oper") {
      mtype = "OPER";
    } else if(type == "idle") {
      mtype = "IDLE";
      ndata.x = qwebirc.util.longtoduration(data.idle);
      ndata.m = qwebirc.irc.IRCDate(new Date(data.connected * 1000));
    } else if(type == "channels") {
      mtype = "CHANNELS";
      ndata.m = data.channels;
    } else if(type == "account") {
      mtype = "ACCOUNT";
      ndata.m = data.account;
    } else if(type == "away") {
      mtype = "AWAY";
      ndata.m = data.away;
    } else if(type == "opername") {
      mtype = "OPERNAME";
      ndata.m = data.opername;
    } else if(type == "actually") {
      mtype = "ACTUALLY";
      ndata.m = data.hostname;
      ndata.x = data.ip;
    } else if(type == "availhelp") {
      mtype = "AVAILHELP";
    } else if(type == "regged") {
      mtype = "REGGED";
    } else if(type == "modes") {
      mtype = "MODES";
      ndata.m = data.modes;
    } else if(type == "realhost") {
      mtype = "REALHOST";
      ndata.m = data.hostname;
      ndata.x = data.ip;
    } else if(type == "generictext") {
      mtype = "GENERICTEXT";
      ndata.m = data.text;
    } else if(type == "end") {
      mtype = "END";
    } else {
      return false;
    }

    xsend();
    return true;
  },
  genericError: function(target, message) {
    this.newTargetOrActiveLine(target, "GENERICERROR", {m: message, t: target});
  },
  genericQueryError: function(target, message) {
    this.newQueryOrActiveLine(target, "GENERICERROR", {m: message, t: target}, true);
  },
  awayStatus: function(state, message) {
    this.newActiveLine("GENERICMESSAGE", {m: message});
  },
  pushLastNick: function(nick) {
    var i = this.lastNicks.indexOf(nick);
    if(i != -1) {
      this.lastNicks.splice(i, 1);
    } else {
      if(this.lastNicks.length == 10)
        this.lastNicks.pop();
    }
    this.lastNicks.unshift(nick);
  },
  wallops: function(user, text) {
    var nick = user.hostToNick();
    var host = user.hostToHost();

    this.newServerLine("WALLOPS", {t: text, n: nick, h: host});
  },
  channelModeIs: function(channel, modes) {
    this.newTargetOrActiveLine(channel, "CHANNELMODEIS", {c: channel, m: modes.join(" ")});
  },
  channelCreationTime: function(channel, time) {
    this.newTargetOrActiveLine(channel, "CHANNELCREATIONTIME", {c: channel, m: qwebirc.irc.IRCDate(new Date(time * 1000))});
  }
});
