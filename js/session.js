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

	initialize: function(config) {
		/* Set our ID. */
		this.id = qwebirc.sessionCount++;

		/* Load settings from passed Iris configuration. */
		this.config = config

		/* Load query string parameters. */
		var args = qwebirc.util.parseURI(String(document.location));
		
		/* Load nick from query string. */
		if($defined(args["nick"]))
			this.config.ui.initial_nick = this.randSub(args["nick"]);

		/* Load channels from query string. */
		if($defined(args["url"])) {
			var urlchans = this.parseIRCURL(args["url"]);
			if (urlchans)
				this.config.ui.initial_chans = urlchans;
		}
		if (args["channels"])
			this.config.ui.initial_chans = args["channels"];

		/* Load random_nick option from query string. */
		else if($defined(args["randomnick"])) {
			if (args["randomnick"] == 1)
				this.config.ui.random_nick = true;
			else
				this.config.ui.random_nick = false;
		}

		/* Load prompt option from query string. */
		if ($defined(args["prompt"])) {
			if (args["prompt"] == 1)
				this.config.ui.prompt = true;
			else
				this.config.ui.prompt = false;
		}

		/* Load hue from query string. */
		var urlhue = this.getHueArg(args);
		if (urlhue) {
			this.config.ui.hue = urlhue;
		}

		/* If random nick is on, and initial_nick is blank, apply it to
		 * generate a random nick. */
		if (this.config.ui.random_nick &&
				!this.config.ui.initial_nick) {
			this.config.ui.initial_nick = "iris" +
					Math.ceil(Math.random() * 100000);
		}

		/* Insert any needed # symbols into channel names. */
		if(this.config.ui.initial_chans) {
			var cdata = this.config.ui.initial_chans.split(" ");
			var chans = cdata[0].split(" ")[0].split(",");

			for(var i=0;i<chans.length;i++) {
				if(chans[i].charAt(0) != '#')
					chans[i] = "#" + chans[i]
			}

			cdata[0] = chans.join(",");
			this.config.ui.initial_chans = cdata.join(" ");
		}
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
	}
});
