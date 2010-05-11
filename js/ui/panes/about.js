qwebirc.ui.AboutPane = new Class({
  Implements: [Events],
  session: null,
  initialize: function(session, parent) {
    this.session = session;

    var delayfn = function() { parent.set("html", "<div class=\"loading\">Loading. . .</div>"); };
    var cb = delayfn.delay(500);
    
    var r = qwebirc.ui.RequestTransformHTML(session, {url: this.session.config.tunefront.static_base_url + "panes/about.html", update: parent, onSuccess: function() {
      $clear(cb);
      parent.getElement("input[class=close]").addEvent("click", function() {
        this.fireEvent("close");
      }.bind(this));
      parent.getElement("div[class=version]").set("text", "v" + qwebirc.VERSION);
    }.bind(this)});
    r.get();
  }
});
