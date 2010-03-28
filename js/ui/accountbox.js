/* This file adds the account box functions for an Atheme login box. */

/**
 * Turn parent element into an account box.
 * The only method in here that external code needs to touch.
 *
 * \param parentElement The element to become the login/logout box.
 */
qwebirc.ui.AccBox = function(parentElement) {
  parentElement.setAttribute("id", "qwebirc-accbox");
  parentElement.setAttribute("valign", "top");
  qwebirc.ui.AccBoxCheckToken();
}

qwebirc.ui.AccBoxLoggedIn = function(user) {
  var box = document.getElementById("qwebirc-accbox");
  if (box.hasChildNodes()) {
    while (box.childNodes.length >= 1) {
      box.removeChild(box.firstChild);
    }
  }
  var textbox = new Element("div");
  textbox.set("class", "qwebirc-acctextbox");
  textbox.appendChild(document.createTextNode("You are logged in as "));
  textbox.appendChild(new Element("b").set("text", user));
  textbox.appendChild(document.createTextNode(". "));

  var link = new Element("a");
  link.set("class", "qwebirc-acclink");
  link.setAttribute("href", "javascript:void(0);");
  link.setAttribute("onclick", "qwebirc.ui.AccBoxLogout();");
  link.appendChild(document.createTextNode("(Logout)"));
  textbox.appendChild(link);

  box.appendChild(textbox);
}

qwebirc.ui.AccBoxLoggedOut = function(user) {
  var box = document.getElementById("qwebirc-accbox");
  if (box.hasChildNodes()) {
    while (box.childNodes.length >= 1) {
      box.removeChild(box.firstChild);
    }
  }
  
  var acclogin = new Element("input", {"type": "submit", "value": "Login"});
  acclogin.addEvent("click", qwebirc.ui.AccBoxLogin);
  box.appendChild(acclogin);

  var input = new Element("input");
  input.setAttribute("id", "qwebirc-accuser");
  box.appendChild(input);

  var input = new Element("input", {type: "password"});
  input.setAttribute("id", "qwebirc-accpass");
  box.appendChild(input);

  box.appendChild(new Element("br"));
  box.appendChild(document.createTextNode("Login above, or create an account after connecting."));
}

qwebirc.ui.AccBoxLogin = function(e) {
  var user = document.getElementById('qwebirc-accuser').value;
  var password = document.getElementById('qwebirc-accpass').value;

  qwebirc.irc.AthemeQuery.login(function(t) {
    if (t == null)
      alert("Connection failed.");
    else if (t == " ")
      alert("Incorrect username or password.");
    else {
      var cookie = Cookie.write("tl-ircaccount", user);
      var cookie = Cookie.write("tl-ircauthcookie", t);
      qwebirc.ui.AccBoxLoggedIn(user);
    }
  }, user, password);
  new Event(e).stop();
}

qwebirc.ui.AccBoxLogout = function(e) {
  var user = Cookie.read("tl-ircaccount");
  var token = Cookie.read("tl-ircauthcookie");

  qwebirc.irc.AthemeQuery.logout(function(success) {
    if (success) {
      Cookie.dispose("tl-ircaccount");
      Cookie.dispose("tl-ircauthcookie");
      qwebirc.ui.AccBoxLoggedOut();
    }
    else {
      alert("Connection failed; unable to logout.");
    }
  }, user, token);
}

qwebirc.ui.AccBoxCheckToken = function () {
  var user = Cookie.read("tl-ircaccount");
  var token = Cookie.read("tl-ircauthcookie");

  if (user && token) {
    qwebirc.irc.AthemeQuery.checkLogin(function(valid) {
      if (valid == null)
        return;
      else if (valid)
        qwebirc.ui.AccBoxLoggedIn(user);
      else
        qwebirc.ui.AccBoxLoggedOut();
    }, user, token);
  }
  else
    qwebirc.ui.AccBoxLoggedOut();
}
