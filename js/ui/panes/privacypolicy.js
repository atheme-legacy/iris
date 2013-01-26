qwebirc.ui.Panes.PrivacyPolicy = {
  title: "Privacy Policy",
  command: function(session) {
    if (conf.ui.privacy) {
      return "PRIVACYPOLICY";
    } else {
      return null;
    }
  },
  menuitem: function(session) {
    if (conf.ui.privacy) {
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
  initialize: function(session, w) {
    this.session = session;
    var delayfn = function() { w.lines.set("html", "<div class=\"loading\">Loading. . .</div>"); };
    var cb = delayfn.delay(500);

    var r = qwebirc.ui.RequestTransformHTML(session, {url: conf.frontend.static_base_url + "panes/privacypolicy.html", update: w.lines, onSuccess: function() {
      $clear(cb);

      w.lines.getElement("input[class=close]").addEvent("click", function() {
        ui.closeWindow(w);
      }.bind(this));
    }.bind(this)});
    r.get();
  }
});
