qwebirc.ui.Panes.About = {
  title: "About",
  command: function(session) { return "ABOUT"; },
  menuitem: function(session) { return "About Iris"; },
  menupos: 600
};

qwebirc.ui.Panes.About.pclass = new Class({
  Implements: [Events],
  session: null,
  initialize: function(session, w) {
    this.session = session;

    var delayfn = function() { w.lines.set("html", "<div class=\"loading\">Loading. . .</div>"); };
    var cb = delayfn.delay(500);

    var r = qwebirc.ui.RequestTransformHTML(session, {url: conf.frontend.static_base_url + "panes/about.html", update: w.lines, onSuccess: function() {
      $clear(cb);
      w.lines.getElement("input[class=close]").addEvent("click", function() {
        ui.closeWindow(w);
      });
      w.lines.getElement("span[class=version]").set("text", "v" + qwebirc.VERSION);
    }});
    r.get();
  }
});
