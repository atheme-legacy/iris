qwebirc.sessionCount = 0;

/* Stores settings and handles for a single IRC connection. */
qwebirc.session = new Class({

	/* The session number for this session. */
	id: null,

	/* The configuration we're using. */
	config: null,

	/* The IRC connection instance. */
	irc: null,

	/* The UI theme we're using. */
	theme: null,

	/* The UI instance. */
	ui: null,

	/* Atheme state. */
	atheme: {
		state: null,
		user: null,
		token: null
	},

	initialize: function(config) {
		/* Set our ID. */
		this.id = qwebirc.sessionCount++;

		/* Load settings from passed Iris configuration. */
		this.config = config;

		/* Stow away some unmodified values from said configuration.
		 * This allows them to be accessed as 'default' values for
		 * query strings later. */
		var default_nick = this.config.frontend.initial_nick;
		var default_chans = this.config.frontend.initial_chans;
		var default_prompt = this.config.frontend.prompt;
		var default_fg_color = this.config.ui.fg_color;
		var default_fg_sec_color = this.config.ui.fg_sec_color;
		var default_bg_color = this.config.ui.bg_color;
		this.config.frontend.initial_nick_default = default_nick;
		this.config.frontend.initial_chans_default = default_chans;
		this.config.frontend.prompt_default = default_prompt;
		this.config.ui.fg_color_default = default_fg_color;
		this.config.ui.fg_sec_color_default = default_fg_sec_color;
		this.config.ui.bg_color_default = default_bg_color;

		/* Load user settings from cookie. */
		this.loadCookieSettings();

		/* Load query string parameters. */
		var args = qwebirc.util.parseURI(String(document.location));

		/* Map backwards compatiblity query string aliases to the
		 * parameters they represent, unless they're already set. */
		if($defined(args["nick"]) && !$defined(args["initial_nick"]))
			args["initial_nick"] = args["nick"];
		if($defined(args["channels"]) && !$defined(args["initial_chans"]))
			args["initial_chans"] = args["channels"];
		
		/* Load nick from query string. */
		if($defined(args["initial_nick"])) {
			var initial_nick = args["initial_nick"];
			this.config.frontend.initial_nick = initial_nick;
		}

		/* Load channels from query string. */
		if($defined(args["url"])) {
			var urlchans = this.parseIRCURL(args["url"]);
			if (urlchans)
				this.config.frontend.initial_chans = urlchans;
		}
		if ($defined(args["initial_chans"])) {
			var initial_chans = args["initial_chans"];
			this.config.frontend.initial_chans = initial_chans;
		}

		/* Load prompt option from query string. */
		if ($defined(args["prompt"])) {
			if (args["prompt"] == 1)
				this.config.frontend.prompt = true;
			else
				this.config.frontend.prompt = false;
		}

		/* Load chan_prompt option from query string. */
		if ($defined(args["chan_prompt"])) {
			if (args["chan_prompt"] == 1)
				this.config.frontend.chan_prompt = true;
			else
				this.config.frontend.chan_prompt = false;
		}

		/* Load chan_list_on_start option from query string. */
		if ($defined(args["chan_list_on_start"])) {
			if (args["chan_list_on_start"] == 1)
				this.config.atheme.chan_list_on_start = true;
			else
				this.config.atheme.chan_list_on_start = false;
		}

		/* Load colours from query string. */
		if ($defined(args["fg_color"]) || $defined(args["bg_color"]) ||
                    $defined(args["fg_sec_color"])) {
			this.config.ui.fg_color = default_fg_color;
			this.config.ui.fg_sec_color = default_fg_sec_color;
			this.config.ui.bg_color = default_bg_color;
		}
		if ($defined(args["fg_color"])) {
			this.config.ui.fg_color = args["fg_color"];
			this.config.ui.fg_sec_color = args["fg_color"];
		}
		if ($defined(args["fg_sec_color"]))
			this.config.ui.fg_sec_color = args["fg_sec_color"];
		if ($defined(args["bg_color"]))
			this.config.ui.bg_color = args["bg_color"];

		/* Subtitute '.' characters in the nick with random digits. */
		if (this.config.frontend.initial_nick.indexOf(".") != -1) {
			var nick = this.config.frontend.initial_nick;
			this.config.frontend.initial_nick = this.randSub(nick);
			this.config.frontend.initial_nick_rand = true;
		}
		else
			this.config.frontend.initial_nick_rand = false;

		/* Insert any needed # symbols into channel names. */
		if(this.config.frontend.initial_chans) {
			var cdata = this.config.frontend.initial_chans.split(" ");
			var chans = cdata[0].split(" ")[0].split(",");

			for(var i=0;i<chans.length;i++) {
				if(chans[i].charAt(0) != '#')
					chans[i] = "#" + chans[i]
			}

			cdata[0] = chans.join(",");
			this.config.frontend.initial_chans = cdata.join(" ");
		}
    
		/* Check our Atheme login state. */
		qwebirc.ui.Atheme.check(this);
	},
	randSub: function(nick) {
		var getDigit = function() { return Math.floor(Math.random() * 10); }
		
		return nick.split("").map(function(v) {
			if(v == ".") {
				return getDigit();
			} else {
				return v;
			}
		}).join("");
	},
	parseIRCURL: function(url) {
		if(url.indexOf(":") == 0)
			return;
		var schemeComponents = url.splitMax(":", 2);
		if(schemeComponents[0].toLowerCase() != "irc" && schemeComponents[0].toLowerCase() != "ircs") {
			alert("Bad IRC URL scheme.");
			return;
		}

		if(url.indexOf("/") == 0) {
			/* irc: */
			return;
		}
		
		var pathComponents = url.splitMax("/", 4);
		if(pathComponents.length < 4 || pathComponents[3] == "") {
			/* irc://abc */
			return;
		}
		
		var args, queryArgs;
		if(pathComponents[3].indexOf("?") > -1) {
			queryArgs = qwebirc.util.parseURI(pathComponents[3]);
			args = pathComponents[3].splitMax("?", 2)[0];
		} else {
			args = pathComponents[3];
		}
		var parts = args.split(",");

		var channel = parts[0];
		if(channel.charAt(0) != "#")
			channel = "#" + channel;

		var not_supported = [], needkey = false, key;
		for(var i=1;i<parts.length;i++) {
			var value = parts[i];
			if(value == "needkey") {
				needkey = true;
			} else {
				not_supported.push(value);
			}
		}

		if($defined(queryArgs)) {
			for(var key_ in queryArgs) {
				var value = queryArgs[key_];
				
				if(key_ == "key") {
					key = value;
					needkey = true;
				} else {
					not_supported.push(key_);
				}
			}
		}
		
		if(needkey) {
			if(!$defined(key))
				key = prompt("Please enter the password for channel " + channel + ":");
			if($defined(key))
				channel = channel + " " + key;
		}
		
		if(not_supported.length > 0)
			alert("The following IRC URL components were not accepted: " + not_supported.join(", ") + ".");
		
		return channel;
	},
	loadCookieSettings: function() {
		var cookie = new Hash.Cookie("iris-settings", {duration: 3650, autoSave: false});
		for (var i = 0; i < qwebirc.config.UserOptions.length; i++) {
			var category = qwebirc.config.UserOptions[i].category;
			var option = qwebirc.config.UserOptions[i].option;
			var cookieName = category + "." + option;
			if ($defined(cookie.get(cookieName)))
				this.config[category][option] = cookie.get(cookieName);
	 	}

		cookie = new Hash.Cookie("iris-auth");
		if ($defined(cookie.get("user"))) {
			this.atheme.user = cookie.get("user");
			this.atheme.token = cookie.get("token");
		}
	},
	saveUserSettings: function() {
		var cookie = new Hash.Cookie("iris-settings", {duration: 3650, autoSave: false});
		cookie.erase();
		cookie = new Hash.Cookie("iris-settings", {duration: 3650, autoSave: false});
		for (var i = 0; i < qwebirc.config.UserOptions.length; i++) {
			var category = qwebirc.config.UserOptions[i].category;
			var option = qwebirc.config.UserOptions[i].option;
			var cookieName = category + "." + option;
			cookie.set(cookieName, this.config[category][option]);
		}
		cookie.save();
	}
});
