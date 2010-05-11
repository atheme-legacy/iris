qwebirc.ui.LoginPane = new Class({
  Implements: [Events],
  session: null,
  parentElement: null,
  connectCallback: null,
  initialize: function(session, parentElement) {
    this.session = session;
    this.parentElement = parentElement;
    this.createPane();
    
    if (!this.session.config.ui.prompt && this.session.config.ui.initial_nick
          && this.session.config.ui.initial_chans)
      qwebirc.ui.ConfirmBox(this.session, this.parentElement, this);
    else
      qwebirc.ui.LoginBox(this.session, this.parentElement, this);
  },
  createPane: function() {
  },
  setChannel: function(channel) {
    this.session.config.ui.initial_chans = channel;

    while(this.parentElement.childNodes.length > 0)
      this.parentElement.removeChild(this.parentElement.firstChild);

    if (!this.session.config.ui.prompt && this.session.config.ui.initial_nick
          && this.session.config.ui.initial_chans) {
      this.connectCallback({"nickname": this.session.config.ui.initial_nick, "autojoin": this.session.config.ui.initial_chans});
      return true;
    }
    else {
      qwebirc.ui.LoginBox(this.session, this.parentElement, this);
      return false;
    }
  }
});

qwebirc.ui.ConfirmBox = function(session, parentElement, pane) {
  var outerbox = new Element("table");
  outerbox.addClass("qwebirc-centrebox");
  parentElement.appendChild(outerbox);
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
  nick.set("text", session.config.ui.initial_nick);
  
  var c = session.config.ui.initial_chans.split(" ")[0].split(",");
  
  text.appendChild(document.createTextNode("To connect to " + session.config.ui.network_name + " IRC and join channel" + ((c.length>1)?"s":"") + " "));

  for(var i=0;i<c.length;i++) {
    if((c.length > 1) && (i == c.length - 1)) {
      text.appendChild(document.createTextNode(" and "));
    } else if(i > 0) {
      text.appendChild(document.createTextNode(", "));
    }
    text.appendChild(new Element("b").set("text", c[i]));
    
  }
  
  if(!session.config.ui.random_nick) {
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
    parentElement.removeChild(outerbox);
    pane.connectCallback({"nickname": session.config.ui.initial_nick, "autojoin": session.config.ui.initial_chans});
  });
}

qwebirc.ui.LoginBox = function(session, parentElement, pane) {
  var outerbox = new Element("table");
  outerbox.addClass("qwebirc-centrebox");
  parentElement.appendChild(outerbox);
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
  td.set("html", "<h1>Connect to " + session.config.ui.network_name + " IRC</h1>");  
    
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

  var nick = new Element("input");
  createRow("Nickname:", nick);
    
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

  var chanStyle = null;
  var chan = new Element("input");
  createRow("Channels:", chan, chanStyle);

  var connbutton = new Element("input", {"type": "submit"});
  connbutton.set("value", "Connect");
  var r = createRow(undefined, connbutton);

  form.addEvent("submit", function(e) {
    new Event(e).stop();
    var nickname = nick.value;
    var chans = chan.value;
    var password = pass.value;
    if(chans == "#") /* sorry channel "#" :P */
      chans = "";

    if(!nickname) {
      alert("You must supply a nickname.");
      nick.focus();
      return;
    }

    var data = {"nickname": nickname, "autojoin": chans};

    if (password) {
      qwebirc.irc.AthemeQuery.login(function(token) {
        if (token == null) {
          alert("Authentication failed");
        }
        qwebirc.ui.Atheme.handleLogin(nick.value, token);
        data["authUser"] = nick.value;
        data["authToken"] = token;
        parentElement.removeChild(outerbox);
    
        pane.connectCallback(data);
      }, nick.value, pass.value);
    } else {
      parentElement.removeChild(outerbox);
    
      pane.connectCallback(data);
    }
  }.bind(this));
    
  if (session.config.ui.initial_nick)
    nick.set("value", session.config.ui.initial_nick);
  if (session.config.ui.initial_chans)
    chan.set("value", session.config.ui.initial_chans);

  nick.focus();
}
