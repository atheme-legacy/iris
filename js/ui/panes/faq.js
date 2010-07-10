qwebirc.ui.Panes.FAQ = {
  title: "FAQ",
  command: function(session) { return "FAQ"; },
  menuitem: function(session) { return "Frequently asked questions"; },
  menupos: 400
};

qwebirc.ui.Panes.FAQ.pclass = new Class({
  Implements: [Events],
  session: null,
  initialize: function(session, parent) {
    this.session = session;

    var delayfn = function() { parent.set("html", "<div class=\"loading\">Loading. . .</div>"); };
    var cb = delayfn.delay(500);
    
    var r = qwebirc.ui.RequestTransformHTML(session, {url: this.session.config.frontend.static_base_url + "panes/faq.html", update: parent, onSuccess: function() {
      $clear(cb);
      parent.getElement("input[class=close]").addEvent("click", function() {
        this.fireEvent("close");
      }.bind(this));
    }.bind(this)});
    r.get();
  }
});
