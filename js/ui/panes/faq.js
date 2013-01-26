qwebirc.ui.Panes.FAQ = {
  title: "FAQ",
  command: function(session) { return "FAQ"; },
  menuitem: function(session) { return "Frequently asked questions"; },
  menupos: 400
};

qwebirc.ui.Panes.FAQ.pclass = new Class({
  Implements: [Events],
  session: null,
  initialize: function(session, w) {
    this.session = session;

    var delayfn = function() { w.lines.set("html", "<div class=\"loading\">Loading. . .</div>"); };
    var cb = delayfn.delay(500);

    var r = qwebirc.ui.RequestTransformHTML(session, {url: conf.frontend.static_base_url + "panes/faq.html", update: w.lines, onSuccess: function() {
      $clear(cb);
      w.lines.getElement("input[class=close]").addEvent("click", function() {
        ui.closeWindow(w);
      }.bind(this));
    }.bind(this)});
    r.get();
  }
});
