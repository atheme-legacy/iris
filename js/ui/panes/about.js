qwebirc.ui.Panes.About = {
  title: "About",
  command: function(session) { return "ABOUT"; },
  menuitem: function(session) { return "About Iris"; },
  menupos: 600
};

qwebirc.ui.Panes.About.pclass = new Class({
  Implements: [Events],
  session: null,
  initialize: function(session, parent) {
    this.session = session;

    var delayfn = function() { parent.set("html", "<div class=\"loading\">Loading. . .</div>"); };
    var cb = delayfn.delay(500);
    
    var r = qwebirc.ui.RequestTransformHTML(session, {url: this.session.config.frontend.static_base_url + "panes/about.html", update: parent, onSuccess: function() {
      $clear(cb);
      parent.getElement("input[class=close]").addEvent("click", function() {
        this.fireEvent("close");
      }.bind(this));
      parent.getElement("span[class=version]").set("text", "v" + qwebirc.VERSION);
    }.bind(this)});
    r.get();
  }
});
