qwebirc.ui.MENU_ITEMS = function() {
  var maybeOpped = function(nick) {
    var channel = this.name; /* window name */
    var myNick = this.session.irc.nickname;

    return this.session.irc.nickOnChanHasAtLeastPrefix(myNick, channel, "+", true);
  };

  var isOpped = function(nick) {
    var channel = this.name; /* window name */
    var myNick = this.session.irc.nickname;

    return this.session.irc.nickOnChanHasAtLeastPrefix(myNick, channel, "@", false);
  };

  var isVoiced = function(nick) {
    var channel = this.name;
    var myNick = this.session.irc.nickname;

    return this.session.irc.nickOnChanHasPrefix(myNick, channel, "+");
  };

  var targetOpped = function(nick) {
    var channel = this.name;
    return this.session.irc.nickOnChanHasPrefix(nick, channel, "@");
  };

  var targetVoiced = function(nick) {
    var channel = this.name;
    return this.session.irc.nickOnChanHasPrefix(nick, channel, "+");
  };

  var invert = qwebirc.util.invertFn, compose = qwebirc.util.composeAnd;

  var command = function(cmd) {
    return function(nick) { this.session.irc.exec("/" + cmd + " " + nick); };
  };

  return [
    {
      text: "PM",
      fn: command("query"),
      predicate: true
    },
    {
      text: "whois",
      fn: command("whois"),
      predicate: true
    },
    {
      text: "kick", /* TODO: disappear when we're deopped */
      fn: function(nick) { this.session.irc.exec("/KICK " + nick + " wibble"); },
      predicate: maybeOpped
    },
    {
      text: "op",
      fn: command("op"),
      predicate: compose(isOpped, invert(targetOpped))
    },
    {
      text: "deop",
      fn: command("deop"),
      predicate: compose(isOpped, targetOpped)
    },
    {
      text: "voice",
      fn: command("voice"),
      predicate: compose(maybeOpped, invert(targetVoiced))
    },
    {
      text: "devoice",
      fn: command("devoice"),
      predicate: compose(maybeOpped, targetVoiced)
    }
  ];
};
