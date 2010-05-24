qwebirc.ui.ConnectPane = new Class({
  Implements: [Events],
  session: null,
  parentElement: null,
  connectCallback: null,
  nickBox: null,
  chanBox: null,

  initialize: function(session, parentElement) {
    this.session = session;
    this.parentElement = parentElement;

    if (!this.session.config.frontend.prompt
          && this.session.config.frontend.initial_nick
          && this.session.config.frontend.initial_chans)
      this.createConfirmBox();
    else
      this.createLoginBox(null);
  },

  connectChannel: function(channel) {
    if (this.session.config.frontend.chan_autoconnect 
        && (this.session.config.frontend.initial_nick
         || (this.nickBox && this.nickBox.value))) {
      this.connect(channel);
      return true;
    }
    else {
      if (this.chanBox != null)
        this.chanBox.set("value", channel);
      else
        this.createLoginBox(channel);

      return false;
    }
  },

  connect: function(channel) {
    while(this.parentElement.childNodes.length > 0)
      this.parentElement.removeChild(this.parentElement.firstChild);

    var data = {};

    if (this.nickBox != null)
      data["nickname"] = this.nickBox.value;
    else
      data["nickname"] = this.session.config.frontend.initial_nick;

    if (channel != null)
      data["autojoin"] = channel;
    else if (this.chanBox != null)
      data["autojoin"] = this.chanBox.value;
    else
      data["autojoin"] = this.session.config.frontend.initial_chans;

    if (this.session.atheme.state) {
      data["authUser"] = this.session.atheme.user;
      data["authToken"] = this.session.atheme.token;
    }

    this.connectCallback(data);
  },

  createConfirmBox: function() {
    while(this.parentElement.childNodes.length > 0)
      this.parentElement.removeChild(this.parentElement.firstChild);

    var outerbox = new Element("table");
    outerbox.addClass("qwebirc-centrebox");
    this.parentElement.appendChild(outerbox);
    var tbody = new Element("tbody");
    outerbox.appendChild(tbody);

    var tr = new Element("tr");
    tbody.appendChild(tr);
    var td = new Element("td");
    tr.appendChild(td);

    var box = new Element("table");
    box.addClass("qwebirc-confirmbox");
    td.appendChild(box);

    var tbody = new Element("tbody");
    box.appendChild(tbody);

    var tr = new Element("tr");
    tbody.appendChild(tr);
    tr.addClass("tr1");

    var text = new Element("td");
    tr.appendChild(text);

    var nick = new Element("b");
    nick.set("text", this.session.config.frontend.initial_nick);

    var c = this.session.config.frontend.initial_chans.split(" ")[0].split(",");

    text.appendChild(document.createTextNode("To connect to " + this.session.config.frontend.network_name + " IRC and join channel" + ((c.length>1)?"s":"") + " "));

    for(var i=0;i<c.length;i++) {
      if((c.length > 1) && (i == c.length - 1)) {
        text.appendChild(document.createTextNode(" and "));
      } else if(i > 0) {
        text.appendChild(document.createTextNode(", "));
      }
      text.appendChild(new Element("b").set("text", c[i]));
    }

    if(!this.session.config.frontend.initial_nick_rand) {
      text.appendChild(document.createTextNode(" as "));
      text.appendChild(nick);
    }

    text.appendChild(document.createTextNode(" click 'Connect'."));
    text.appendChild(new Element("br"));

    var tr = new Element("tr");
    tbody.appendChild(tr);
    tr.addClass("tr2");

    var td = new Element("td");
    tr.appendChild(td);

    var yes = new Element("input", {"type": "submit", "value": "Connect"});
    td.appendChild(yes);
    yes.focus();
    yes.addEvent("click", function(e) {
      this.connect(null);
    }.bind(this));
  },

  createLoginBox: function(channel) {
    while(this.parentElement.childNodes.length > 0)
      this.parentElement.removeChild(this.parentElement.firstChild);

    var outerbox = new Element("table");
    outerbox.addClass("qwebirc-centrebox");
    this.parentElement.appendChild(outerbox);
    var tbody = new Element("tbody");
    outerbox.appendChild(tbody);

    var tr = new Element("tr");
    tbody.appendChild(tr);
    var td = new Element("td");
    tr.appendChild(td);

    var box = new Element("table");
    box.addClass("qwebirc-loginbox");
    td.appendChild(box);

    var tbody = new Element("tbody");
    box.appendChild(tbody);

    var tr = new Element("tr");
    tbody.appendChild(tr);
    tr.addClass("tr1");

    var td = new Element("td");
    tr.appendChild(td);
    td.set("html", "<h1>Connect to " + this.session.config.frontend.network_name + " IRC</h1>");

    var tr = new Element("tr");
    tbody.appendChild(tr);
    tr.addClass("tr2");

    var td = new Element("td");
    tr.appendChild(td);

    var form = new Element("form");
    td.appendChild(form);

    var boxtable = new Element("table");
    form.appendChild(boxtable);

    var tbody = new Element("tbody");
    boxtable.appendChild(tbody); /* stupid IE */

    function createRow(label, e2, style) {
      var r = new Element("tr");
      tbody.appendChild(r);

      var d1 = new Element("td");
      if(label)
        d1.set("text", label);
      r.appendChild(d1);

      var d2 = new Element("td");
      r.appendChild(d2);

      if($defined(e2))
        d2.appendChild(e2);
      if($defined(style)) {
        r.setStyles(style);
        return [r, d2];
      }

      return d2;
    }

    this.nickBox = new Element("input");
    createRow("Nickname:", this.nickBox);

    if (this.session.config.atheme.nickserv_login) {
      var srvbutton = new Element("input");
      srvbutton.set("type", "checkbox");
      srvbutton.set("checked", false);
      createRow("Login to Services:", srvbutton);

      var pass = new Element("input");
      pass.set("type", "password");
      var passRow = createRow("Password:", pass, {})[0];
      passRow.setStyle("display", "none");
      passRow.visible = false;

      srvbutton.addEvent("click", function(e) {
        passRow.visible = !passRow.visible;
        passRow.setStyle("display", passRow.visible ? null : "none");
      }.bind(this));
    }

    if (channel || this.session.config.frontend.chan_prompt ||
        !this.session.config.frontend.initial_chans) {
      this.chanBox = new Element("input");
      createRow("Channels:", this.chanBox);
    }

    var connbutton = new Element("input", {"type": "submit"});
    connbutton.set("value", "Connect");
    var r = createRow(undefined, connbutton);

    form.addEvent("submit", function(e) {
      new Event(e).stop();

      if(!this.nickBox.value) {
        alert("You must supply a nickname.");
        this.nickBox.focus();
        return;
      }

      if (this.session.config.atheme.nickserv_login && pass.value) {
        qwebirc.irc.AthemeQuery.login(function(token) {
          if (token == null)
            alert("Authentication failed");
          else
            qwebirc.ui.Atheme.handleLogin(this.session, this.nickBox.value, token);
          this.connect(null);
        }.bind(this), this.nickBox.value, pass.value);
      }
      else {
        qwebirc.ui.Atheme.handleLogout(this.session);
        this.connect(null);
      }

    }.bind(this));

    if (this.session.config.frontend.initial_nick)
      this.nickBox.set("value", this.session.config.frontend.initial_nick);

    if (this.chanBox != null && channel)
      this.chanBox.set("value", channel);
    else if (this.chanBox != null)
      this.chanBox.set("value", this.session.config.frontend.initial_chans);

    this.nickBox.focus();
  }
});


