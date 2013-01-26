qwebirc.sessionCount = 0;

/* Stores settings and handles for a single IRC connection. */
qwebirc.session = new Class({

	/* The IRC connection instance. */
	irc: null,

	/* Atheme state. */
	atheme: {
		state: null,
		user: null,
		token: null
	},

	/* UI windows belonging to this session. */
	windows: {},

	initialize: function() {

		/* Load any Atheme login state. */
		cookie = new Hash.Cookie("iris-auth");
		if ($defined(cookie.get("user"))) {
			this.atheme.user = cookie.get("user");
			this.atheme.secret = cookie.get("token");
		}

		/* Check our Atheme login state. */
		qwebirc.ui.Atheme.check(this);
	}
});
