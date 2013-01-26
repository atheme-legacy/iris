/**
 * Provides handling of Atheme login state in the client interface.
 * Configures the client when the user changes between logged in and out, and
 * provides checks to determine whether which it is in.
 */

qwebirc.ui.Atheme = {};

/**
 * Handles an Atheme login.
 *
 * \param user The provided username.
 * \param token The user's given token.
 */
qwebirc.ui.Atheme.handleLogin = function(session, user, token) {

	/* Update state. */
	session.atheme.state = true;
	session.atheme.user = user;
	session.atheme.secret = token;

	/* Save cookie. */
	cookie = new Hash.Cookie("iris-auth");
	cookie.set("user", session.atheme.user);
	cookie.set("token", session.atheme.secret);
	cookie.save();
}

/**
 * Handle an Atheme logout.
 */
qwebirc.ui.Atheme.handleLogout = function() {

	/* Update state. */
	this.state = false;
}

/**
 * Check whether the user is currently logged in, and set the client up
 * accordingly.
 */
qwebirc.ui.Atheme.check = function(session) {

	/* If we have a user and token, check them for validity. Otherwise,
	 * we're definitely logged out. */
	if ($defined(session.atheme.user) && $defined(session.atheme.secret) &&
			conf.atheme.sasl_type == "AUTHCOOKIE") {
		qwebirc.irc.AthemeQuery.checkLogin(function(valid) {
		if (valid == null)
			session.atheme.state = null;
		else if (valid)
			this.handleLogin(session, session.atheme.user, session.atheme.secret);
		else
			this.handleLogout();
		}.bind(this), session.atheme.user, session.atheme.secret);
	}
	else
		this.handleLogout(session);
}
