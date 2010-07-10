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

    window.addEvent("domready", function() {

      /* Define login function. */
      var callback = function(connOptions) {
        this.session.irc = new qwebirc.irc.IRCClient(this.session, connOptions);
        this.session.irc.connect();
        window.onbeforeunload = qwebirc_ui_onbeforeunload;
        window.addEvent("unload", function() {
          this.session.irc.quit("Web client closed");
        }.bind(this));
      }.bind(this);

      /* Create UI. */
      this.session.ui = new ui(this.session, $(element));

      /* Create login window. */ 
      this.session.ui.connectWindow(callback);

      /* If enabled, open channel list. */
      if (this.session.config.atheme.chan_list_on_start) {
        if (qwebirc.ui.Panes.List)
          this.session.ui.addPane("List");
      }
    }.bind(this));
  }
});
