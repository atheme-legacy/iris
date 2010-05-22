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

		/* Load user settings from cookie. */
		this.loadCookieSettings();

		/* Load query string parameters. */
		var args = qwebirc.util.parseURI(String(document.location));
		
		/* Load nick from query string. */
		if($defined(args["nick"])) {
			this.config.frontend.initial_nick = this.randSub(args["nick"]);
			this.config.frontend.random_nick = false
		}

		/* Load channels from query string. */
		if($defined(args["url"])) {
			var urlchans = this.parseIRCURL(args["url"]);
			if (urlchans)
				this.config.frontend.initial_chans = urlchans;
		}
		if ($defined(args["channels"]))
			this.config.frontend.initial_chans = args["channels"];

		/* Load random_nick option from query string, overriden by a
		 * nick being specified in the query string. */
		if($defined(args["randomnick"])) {
			if (args["randomnick"] && !$defined(args["nick"])) {
				this.config.frontend.random_nick = true;
			}
			else {
				this.config.frontend.random_nick = false;
			}
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

		/* Load hue from query string. */
		var urlhue = this.getHueArg(args);
		if (urlhue) {
			this.config.ui.hue = urlhue;
		}

		/* If random nick is on, apply it to generate a random nick. */
		if (this.config.frontend.random_nick) {
			this.config.frontend.initial_nick = "iris" +
					Math.ceil(Math.random() * 100000);
		}

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
	getHueArg: function(args) {
		var hue = args["hue"];
		if(!$defined(hue))
			return null;
		hue = parseInt(hue);
		if(hue > 360 || hue < 0)
			return null;
		return hue;
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
          for (var i = 0; i < qwebirc.config.UserOptions.length; i++) {
            var category = qwebirc.config.UserOptions[i].category;
            var option = qwebirc.config.UserOptions[i].option;
            var cookieName = category + "." + option;
            cookie.set(cookieName, this.config[category][option]);
          }
          cookie.save();
        }
});
