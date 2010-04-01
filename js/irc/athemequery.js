qwebirc.irc.AthemeQuery = {};

/**
 * Login to Atheme, getting an authentication token.
 * Callback signature is callback(token), where cookie is an authentication
 * token for later requests, the empty string to indicate authentication
 * failure, or null to indicate connection failure.
 *
 * \param callback Function to call to inform of results.
 * \param user Username as string.
 * \param pass Password as string.
 */
qwebirc.irc.AthemeQuery.login = function(callback, user, pass) {

	var cacheAvoidance = qwebirc.util.randHexString(16);

	/* New login request. */
	var r = new Request.JSON({
		url: "/a/l?r=" + cacheAvoidance,
		async: true
	});
	
	/* Try to minimise the amount of headers, or something. */
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
	
	r.addEvent("complete", function(o) {
		if(!o)
			callback(null);
		if (o[0] == false)
			callback(null);

		this.recv();
	}.bind(this));
	
	r.addEvent("success", function(json, string) {
		if (typeof json === 'string')
			callback(json);
		else {
			callback(null);
		}
	}.bind(this));

	var postdata = "u=" + encodeURIComponent(user);
	postdata += "&p=" + encodeURIComponent(pass);
	r.send(postdata);
}
