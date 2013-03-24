qwebirc.ui.Panes.Connect = {
  title: "Connect",
  command: function(session) { return null; },
  menuitem: function(session) { return null; }
};

qwebirc.ui.Panes.Connect.pclass = new Class({
  Implements: [Events],
  session: null,
  parent: null,
  connectCallback: null,
  nickBox: null,
  chanBox: null,

  initialize: function(session, w) {
    this.session = session;
    this.parent = w.lines;

    if (!conf.frontend.prompt
          && conf.frontend.initial_nick
          && conf.frontend.initial_chans)
      this.createConfirmBox();
    else
      this.createLoginBox(null);
  },

  connectChannel: function(channel) {
    if (conf.frontend.chan_autoconnect
        && (conf.frontend.initial_nick
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
    while(this.parent.childNodes.length > 0)
      this.parent.removeChild(this.parent.firstChild);

    var data = {};

    if (this.nickBox != null)
      data["nickname"] = this.nickBox.value;
    else
      data["nickname"] = conf.frontend.initial_nick;

    if (channel != null)
      data["autojoin"] = channel;
    else if (this.chanBox != null)
      data["autojoin"] = this.chanBox.value;
    else
      data["autojoin"] = conf.frontend.initial_chans;

    if (this.session.atheme.state) {
      data["authUser"] = this.session.atheme.user;
      data["authSecret"] = this.session.atheme.secret;
    }

    this.connectCallback(data);
  },

  createConfirmBox: function() {
    while(this.parent.childNodes.length > 0)
      this.parent.removeChild(this.parent.firstChild);

    var outerbox = new Element("table");
    outerbox.addClass("qwebirc-centrebox");
    this.parent.appendChild(outerbox);
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
    nick.set("text", conf.frontend.initial_nick);

    var c = conf.frontend.initial_chans.split(" ")[0].split(",");

    text.appendChild(document.createTextNode("To connect to " + conf.frontend.network_name + " IRC and join channel" + ((c.length>1)?"s":"") + " "));

    for(var i=0;i<c.length;i++) {
      if((c.length > 1) && (i == c.length - 1)) {
        text.appendChild(document.createTextNode(" and "));
      } else if(i > 0) {
        text.appendChild(document.createTextNode(", "));
      }
      text.appendChild(new Element("b").set("text", c[i]));
    }

    if(!conf.frontend.initial_nick_rand) {
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

    var form = new Element("form");
    td.appendChild(form);

    var yes = new Element("input", {"type": "submit", "value": "Connect"});
    form.appendChild(yes);
    yes.focus();

    form.addEvent("submit", function(e) {
      new Event(e).stop();
      this.connect(null);
    }.bind(this));

  },

  createLoginBox: function(channel) {
    while(this.parent.childNodes.length > 0)
      this.parent.removeChild(this.parent.firstChild);

    var outerbox = new Element("table");
    outerbox.addClass("qwebirc-centrebox");
    this.parent.appendChild(outerbox);
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
    td.set("html", "<h1>Connect to " + conf.frontend.network_name + " IRC</h1>");

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

    if (conf.atheme.nickserv_login) {
      var srvbutton = new Element("input");
      srvbutton.set("type", "checkbox");
      srvbutton.set("checked", false);
      createRow("Login to Services:", srvbutton);

      var user = new Element("input");
      var userRow = createRow("Username:", user, {})[0];
      userRow.setStyle("display", "none");

      var pass = new Element("input");
      pass.set("type", "password");
      var passRow = createRow("Password:", pass, {})[0];
      passRow.setStyle("display", "none");

      var syncInput = function (e) {
        user.value = this.nickBox.value;
      }.bind(this);

      /* the 'input' event is buggy in IE9, but this isn't a very
       * important feature.
       */
      user.addEvent("input", function (e) {
        this.nickBox.removeEvent("input", syncInput, false);
      }.bind(this), false);

      srvbutton.addEvent("click", function(e) {
        var visible = srvbutton.checked;
        var display = visible ? null : "none";
        userRow.setStyle("display", display);
        passRow.setStyle("display", display);
        if (visible) {
          this.nickBox.addEvent("input", syncInput, false);
          user.focus();
          /* setting the value after calling focus() will place the cursor at
           * the end of the text.
           */
          user.value = this.nickBox.value;
        } else {
          this.nickBox.removeEvent("input", syncInput, false);
          this.nickBox.focus();
        }
      }.bind(this));

    }

    if (channel || conf.frontend.chan_prompt ||
        !conf.frontend.initial_chans) {
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

      if(!this.nickBox.value.match(/^[a-zA-Z0-9`^\-_\[\]{}|\\]+$/)) {
        alert("Invalid nickname entered; only characters in the list \"A-Z a-z 0-9 ` ^ - \\ [ ] { } |\" are allowed.");
        this.nickBox.focus();
        return;
      }
      if(this.nickBox.value.match(/^\d/) || this.nickBox.value[0] == '-') {
        alert("Invalid nickname entered; nicknames may not start with - or a number.");
        this.nickBox.focus();
        return;
      }
      Cookie.write("iris-nick", this.nickBox.value, {"duration": 3650});

      if (conf.atheme.nickserv_login) {
        if (srvbutton.checked) {
          if (!user.value) {
            alert("You must supply a username.");
            user.focus();
            return;
          }
          if (!pass.value) {
            alert("You must supply a password.");
            pass.focus();
            return;
          }
        }

        if (srvbutton.checked && conf.atheme.sasl_type == "AUTHCOOKIE") {
          qwebirc.irc.AthemeQuery.login(function(token) {
            if (token == null)
              alert("Authentication failed");
            else
              qwebirc.ui.Atheme.handleLogin(this.session, user.value, token);
            this.connect(null);
          }.bind(this), user.value, pass.value);
        }
        else if (srvbutton.checked && conf.atheme.sasl_type == "PLAIN") {
          this.session.atheme.state = true;
          this.session.atheme.user = user.value;
          this.session.atheme.secret = pass.value;
          this.connect(null);
        }
        else {
          qwebirc.ui.Atheme.handleLogout(this.session);
          this.connect(null);
        }
      }
      else {
        this.connect(null);
      }

    }.bind(this));

    if (Cookie.read("iris-nick") != null)
      this.nickBox.set("value", Cookie.read("iris-nick"));
    else if (conf.frontend.initial_nick)
      this.nickBox.set("value", conf.frontend.initial_nick);

    if (this.chanBox != null && channel)
      this.chanBox.set("value", channel);
    else if (this.chanBox != null)
      this.chanBox.set("value", conf.frontend.initial_chans);

    this.nickBox.focus();
  }
});


