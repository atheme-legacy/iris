qwebirc.ui.Panes.Feedback = {
  title: "Feedback",
  command: function(session) { return "FEEDBACK"; },
  menuitem: function(session) { return "Feedback"; },
  menupos: 500
};

qwebirc.ui.Panes.Feedback.pclass = new Class({
  Implements: [Events],
  session: null,
  initialize: function(session, parent) {
    this.session = session;
    this.textboxVisible = false;

    var delayfn = function() { parent.set("html", "<div class=\"loading\">Loading. . .</div>"); };
    var cb = delayfn.delay(500);
    
    this.addEvent("select", this.onSelect);
    
    var r = qwebirc.ui.RequestTransformHTML(session, {url: this.session.config.frontend.static_base_url + "panes/feedback.html", update: parent, onSuccess: function() {
      $clear(cb);
      parent.getElement("input[class=close]").addEvent("click", function() {
        this.fireEvent("close");
      }.bind(this));
      parent.getElement("input[class=close2]").addEvent("click", function() {
        this.fireEvent("close");
      }.bind(this));
      
      var textbox = parent.getElement("textarea");
      this.textbox = textbox;
      parent.getElement("input[class=submitfeedback]").addEvent("click", function() {
        this.sendFeedback(parent, textbox, textbox.value);
      }.bind(this));
      
      this.textboxVisible = true;
      this.onSelect();
    }.bind(this)});
    r.get();
  },
  onSelect: function() {
    if(this.textboxVisible)
      this.textbox.focus();
  },
  sendFeedback: function(parent, textbox, text) {
    text = text.replace(/^\s*/, "").replace(/\s*$/, "");
    var mainText = parent.getElement("p[class=maintext]");
    
    if(text.length < 25) {
      /* TODO: lie and throw away */
      mainText.set("text", "I don't suppose you could enter a little bit more? Thanks!");
      textbox.focus();
      return;
    }
    
    this.textboxVisible = false;
    var mainBody = parent.getElement("div[class=enterarea]");
    mainBody.setStyle("display", "none");
    
    var messageBody = parent.getElement("div[class=messagearea]");
    var messageText = parent.getElement("p[class=messagetext]");
    var messageClose = parent.getElement("input[class=close2]");
    
    messageText.set("text", "Submitting. . .");
    messageBody.setStyle("display", "");
    
    /* basic checksum to stop really lame kiddies spamming */
    var checksum = 0;
    var esctext = encodeURIComponent(text);
    for(var i=0;i<text.length;i++)
      checksum = ((checksum + 1) % 256) ^ (text.charCodeAt(i) % 256);

    var r = new Request({url: this.session.config.frontend.dynamic_base_url + "feedback", onSuccess: function() {
      messageText.set("text", "Submitted successfully, thanks for the feedback!");
      messageClose.setStyle("display", "");
    }, onFailure: function() {
      this.textboxVisible = true;
      messageBody.setStyle("display", "none");
      mainBody.setStyle("display", "");
      mainText.set("text", "Looks like something went wrong submitting :(");
    }.bind(this)}).send("feedback=" + text + "&c=" + checksum);
  }
});
