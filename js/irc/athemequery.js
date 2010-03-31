qwebirc.irc.AthemeQuery = {};

/**
 * Build a generic request to Atheme.
 *
 * \param command The command being requested.
 */
qwebirc.irc.AthemeQuery.newRequest = function(command) {
	
	/* New login request. */
	var cacheAvoidance = qwebirc.util.randHexString(16);
	var r = new Request.JSON({
		url: "/a/" + command + "?r=" + cacheAvoidance,
		async: true
	});
	
	/* Try to minimise the amount of headers. */
	r.headers = new Hash;
	r.addEvent("request", function() {
		var setHeader = function(key, value) {
			try {
				this.setRequestHeader(key, value);
			} catch(e) {
			}
		}.bind(this);
		
		setHeader("User-Agent", null);
		setHeader("Accept", null);
		setHeader("Accept-Language", null);
	}.bind(r.xhr));
	if(Browser.Engine.trident)
		r.setHeader("If-Modified-Since", "Sat, 1 Jan 2000 00:00:00 GMT");
	
	return r;
}


/**
 * Login to Atheme, getting an authentication token.
 * Callback signature is callback(token), where token is an authentication
 * token for later requests, the empty string to indicate authentication
 * failure, or null to indicate connection failure.
 *
 * \param callback Function to call to inform of results.
 * \param user Username as string.
 * \param pass Password as string.
 */
qwebirc.irc.AthemeQuery.login = function(callback, user, pass) {

	r = qwebirc.irc.AthemeQuery.newRequest("l");

	r.addEvent("failure", function(xhr) {
		callback(null);
	});
	r.addEvent("success", function(json, string) {
		if (json != null) {
			if (json["success"] == true)
				callback(json["output"]);
			else
				callback("");
		} else {
			callback(null);
		}
	});

	var postdata = "u=" + encodeURIComponent(user);
	postdata += "&p=" + encodeURIComponent(pass);
	r.send(postdata);
}

/**
 * Logs out, invalidating an authentication token.
 * Callback signature is callback(removed), where valid is true to indicate
 * successful removal, or the token already being invalid, or null to
 * indicate a connection failure removing it.
 *
 * \param callback Function to call to inform of results.
 * \param user Username as string.
 * \param token Token as string.
 */
qwebirc.irc.AthemeQuery.logout = function(callback, user, token) {

	r = qwebirc.irc.AthemeQuery.newRequest("o");

	r.addEvent("failure", function(xhr) {
		callback(null);
	});
	r.addEvent("success", function(json, string) {
		if (json != null) {
			callback(true);
		} else {
			callback(null);
		}
	}.bind(this));

	var postdata = "u=" + encodeURIComponent(user);
	postdata += "&t=" + encodeURIComponent(token);
	r.send(postdata);
}

/**
 * Checks whether an authentication token is valid.
 * Can't be used before a command as an alternative to dealing with failure,
 * as the token can expire between this check and the command, but can be
 * used to decide whether to even prompt the user to login.
 * Callback signature is callback(valid), where valid is either true, false,
 * or null to indicate connection failure.
 *
 * \param callback Function to call to inform of results.
 * \param user Username as string.
 * \param token Token as string.
 */
qwebirc.irc.AthemeQuery.checkLogin = function(callback, user, token) {

	r = qwebirc.irc.AthemeQuery.newRequest("c");

	r.addEvent("failure", function(xhr) {
		callback(null);
	});
	r.addEvent("success", function(json, string) {
		if (json != null) {
			callback(json["success"]);
		} else {
			callback(null);
		}
	}.bind(this));

	var postdata = "u=" + encodeURIComponent(user);
	postdata += "&t=" + encodeURIComponent(token);
	postdata += "&s=" + encodeURIComponent("NickServ");
	postdata += "&c=" + encodeURIComponent("INFO");
	postdata += "&p=" + encodeURIComponent(user);
	r.send(postdata);
}
