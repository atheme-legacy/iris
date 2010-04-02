/* This file adds the account box functions for an Atheme login box. */

/**
 * Turn parent table cell into an account box.
 * The only method in here that external code needs to touch.
 *
 * \param parentElement The element to become the login/logout box.
 */
qwebirc.ui.AccBox = function(parentElement) {
	parentElement.setAttribute("id", "qwebirc-accbox");
	parentElement.setAttribute("valign", "top");
	qwebirc.ui.AccBoxCheckToken();
}

qwebirc.ui.AccBoxLoggedIn = function() {
	var user = qwebirc.ui.Atheme.user;

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

qwebirc.ui.AccBoxLoggedOut = function() {
	var box = document.getElementById("qwebirc-accbox");
	if (box.hasChildNodes()) {
		while (box.childNodes.length >= 1) {
			box.removeChild(box.firstChild);
		}
	}

	var form = new Element("form")

	var input = new Element("input", { value: "Username"});
	input.setAttribute("id", "qwebirc-accuser");
	form.appendChild(input);

	var input = new Element("input", {type: "password"});
	input.setAttribute("id", "qwebirc-accpass");
	form.appendChild(input);

	var acclogin = new Element("input", {"type": "submit", "value": "Login to NickServ"});
	acclogin.addEvent("click", qwebirc.ui.AccBoxLogin);
	form.appendChild(acclogin);

	box.appendChild(form);
	
	box.appendChild(document.createTextNode("If you have a NickServ account, put your username and password in above to login."));
}

qwebirc.ui.AccBoxLogin = function(e) {
	var user = document.getElementById('qwebirc-accuser').value;
	var password = document.getElementById('qwebirc-accpass').value;

	qwebirc.irc.AthemeQuery.login(function(token) {
		if (token == null)
			alert("Connection failed; unable to login.");
		else if (token == "")
			alert("Incorrect username or password.");
		else
			qwebirc.ui.Atheme.handleLogin(user, token);
	}, user, password);
	new Event(e).stop();
}

qwebirc.ui.AccBoxLogout = function(e) {

	qwebirc.irc.AthemeQuery.logout(function(success) {
		if (success) {
			qwebirc.ui.Atheme.handleLogout();
		}
		else {
			alert("Connection failed; unable to logout.");
		}
	}, qwebirc.ui.Atheme.user, qwebirc.ui.Atheme.token);
}

qwebirc.ui.AccBoxCheckToken = function () {
	if (qwebirc.ui.Atheme.state == null)
		return;
	if (qwebirc.ui.Atheme.state == true)
		qwebirc.ui.AccBoxLoggedIn();
	if (qwebirc.ui.Atheme.state == false)
		qwebirc.ui.AccBoxLoggedOut();
}
