qwebirc.ui.GenericLoginBox = function(parentElement, callback, initialNickname, initialChannels, autoConnect, autoNick, networkName) {
  if(autoConnect) {
    qwebirc.ui.ConfirmBox(parentElement, callback, initialNickname, initialChannels, autoNick, networkName);
  } else {
    qwebirc.ui.LoginBox(parentElement, callback, initialNickname, initialChannels, networkName);
  }
}

qwebirc.ui.ConfirmBox = function(parentElement, callback, initialNickname, initialChannels, autoNick, networkName) {
  var outerbox = new Element("table");
  outerbox.addClass("qwebirc-centrebox");
  parentElement.appendChild(outerbox);
  var tbody = new Element("tbody");
  outerbox.appendChild(tbody);

  var tr = new Element("tr");
  tbody.appendChild(tr);
  var td = new Element("td");
  tr.appendChild(td);
  qwebirc.ui.AccBox(td);

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
  nick.set("text", initialNickname);
  
  var c = initialChannels.split(" ")[0].split(",");
  
  text.appendChild(document.createTextNode("To connect to " + networkName + " IRC and join channel" + ((c.length>1)?"s":"") + " "));

  for(var i=0;i<c.length;i++) {
    if((c.length > 1) && (i == c.length - 1)) {
      text.appendChild(document.createTextNode(" and "));
    } else if(i > 0) {
      text.appendChild(document.createTextNode(", "));
    }
    text.appendChild(new Element("b").set("text", c[i]));
    
  }
  
  if(!autoNick) {
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
    callback({"nickname": initialNickname, "autojoin": initialChannels});
  });
}

qwebirc.ui.LoginBox = function(parentElement, callback, initialNickname, initialChannels, networkName) {
  var outerbox = new Element("table");
  outerbox.addClass("qwebirc-centrebox");
  parentElement.appendChild(outerbox);
  var tbody = new Element("tbody");
  outerbox.appendChild(tbody);

  var tr = new Element("tr");
  tbody.appendChild(tr);
  var td = new Element("td");
  tr.appendChild(td);
  qwebirc.ui.AccBox(td);

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
  td.set("html", "<h1>Connect to " + networkName + " IRC</h1>");  
    
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
    if(chans == "#") /* sorry channel "#" :P */
      chans = "";

    if(!nickname) {
      alert("You must supply a nickname.");
      nick.focus();
      return;
    }

    var data = {"nickname": nickname, "autojoin": chans};

    /* If the user is logged in via Atheme, try to pass this onto IRC.
     * Attempt it even if we've yet to confirm the token is valid. */
    if (qwebirc.ui.Atheme.state) {
        data["authUser"] = qwebirc.ui.Atheme.user;
        data["authToken"] = qwebirc.ui.Atheme.token;
    }
    else if (qwebirc.ui.Atheme.state == null && qwebirc.ui.Atheme.user) {
        data["authUser"] = qwebirc.ui.Atheme.user;
        data["authToken"] = qwebirc.ui.Atheme.token;
    }

    parentElement.removeChild(outerbox);
    
    callback(data);
  }.bind(this));
    
  nick.set("value", initialNickname);
  chan.set("value", initialChannels);

  nick.focus();
}
