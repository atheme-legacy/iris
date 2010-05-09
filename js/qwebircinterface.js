function qwebirc_ui_onbeforeunload(e) { /* IE sucks */
  var message = "This action will close all active IRC connections.";
  var e = e || window.event;
  if(e)
    e.returnValue = message;
  return message;
}

qwebirc.ui.Interface = new Class({
  session: null,
  initialize: function(element, ui, config) {

    /* Initialise the client options and login state. */
    this.session = new qwebirc.session(config);
    qwebirc.ui.Atheme.check();

    window.addEvent("domready", function() {

      /* Define login function. */
      var callback = function() {
        this.session.irc = new qwebirc.irc.IRCClient(this.session);
        this.session.irc.connect();
        window.onbeforeunload = qwebirc_ui_onbeforeunload;
        window.addEvent("unload", function() {
          this.session.irc.quit("Page closed");
        }.bind(this));
      }.bind(this);

      /* Create UI. */
      this.session.ui = new ui(this.session, $(element));

      /* Create login window. */ 
      this.session.ui.loginBox(callback);
    }.bind(this));
  }
});
