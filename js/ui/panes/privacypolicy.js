qwebirc.ui.Panes.PrivacyPolicy = {
  title: "Privacy Policy",
  command: function(session) {
    if (session.config.ui.privacy) {
      return "PRIVACYPOLICY";
    } else {
      return null;
    }
  },
  menuitem: function(session) {
    if (session.config.ui.privacy) {
      return "Privacy policy";
    } else {
      return null;
    }
  },
  menupos: 700
};

qwebirc.ui.Panes.PrivacyPolicy.pclass = new Class({
  Implements: [Events],
  session: null,
  initialize: function(session, parent) {
    this.session = session;
    var delayfn = function() { parent.set("html", "<div class=\"loading\">Loading. . .</div>"); };
    var cb = delayfn.delay(500);
    
    var r = qwebirc.ui.RequestTransformHTML(session, {url: this.session.config.frontend.static_base_url + "panes/privacypolicy.html", update: parent, onSuccess: function() {
      $clear(cb);
      
      parent.getElement("input[class=close]").addEvent("click", function() {
        this.fireEvent("close");
      }.bind(this));
    }.bind(this)});
    r.get();
  }
});
