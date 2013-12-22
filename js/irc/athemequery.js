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
		url: conf.frontend.dynamic_base_url + "a/" + command + "?r=" + cacheAvoidance,
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

/**
 * Retrieves a channel list.
 * Callback signature is callback(channels, timestamp, more), where channel is
 * null toindicate connection failure, or a list of channel objects, each with
 * "name", "users", and "topic" entries, timestamp is the time this list was
 * retrieved from Atheme, and more is a boolean indicating whether there were
 * more channels to display.
 *
 * \param callback Function to call to inform of results.
 * \param timestamp A list timestamp to request, or 0 for now.
 * \param limit The maximum number of channels to show.
 * \param page The multiple of limit to start at.
 * \param chanmask A channel mask to filter on.
 * \param topicmask A topic mask to filter on.
 */
qwebirc.irc.AthemeQuery.channelList = function(callback, timestamp, limit, page, chanmask, topicmask) {
	r = qwebirc.irc.AthemeQuery.newRequest("li");

	r.addEvent("failure", function(xhr) {
		callback(null, 1, 1);
	});
	r.addEvent("success", function(json, string) {
		if (json != null && json["success"]) {
			callback(json["list"], json["ts"],
					json["total"]);
		} else {
			callback(null, 1, 1);
		}
	}.bind(this));

	if (chanmask == "")
		chanmask = "*";
	if (topicmask == "")
		topicmask = "*";

	var postdata = "s=" + encodeURIComponent(limit*(page-1));
	postdata += "&l=" + encodeURIComponent(limit);
	postdata += "&t=" + encodeURIComponent(timestamp);
        if (chanmask != "*")
	  postdata += "&cm=" + encodeURIComponent(chanmask);
        if (topicmask != "*")
	postdata += "&tm=" + encodeURIComponent(topicmask);

	r.send(postdata);
}
