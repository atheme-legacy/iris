var qwebirc = {ui: {themes: {}, style: {}}, irc: {}, util: {crypto: {}}, options: {}, auth: {}, sound: {}};

if(typeof QWEBIRC_BUILD != "undefined") {
  qwebirc.BUILD = QWEBIRC_BUILD;
  qwebirc.FILE_SUFFIX = "-" + QWEBIRC_BUILD;
} else {
  qwebirc.BUILD = null;
  qwebirc.FILE_SUFFIX = "";
}
