/**
 * Display a list of channels on the network.
 */
qwebirc.ui.Panes.List = {
  title: "Channels",
  command: function(session) {
    if (session.config.atheme.chan_list)
      return "LIST";
  },
  menuitem: function(session) {
    if (session.config.atheme.chan_list)
      return "Channel list";
  },
  menupos: 100
};

qwebirc.ui.Panes.List.pclass = new Class({
  Implements: [Events],
  session: null,

  /* Store the list's current state. */
  loading: null,
  timestamp: 0,
  page: 1,
  namefilter: "",
  topicfilter: "",
  chanBox: null,
  pageBox: null,
  pageText: null,
  prev: null,
  next: null,

  initialize: function(session, parent) {
    this.session = session;

    /* Make filter box. */
    var filterBox = new Element("form", { "class": "filterbox" });
    
    /* Add name filter text box. */
    var filterSubBox = new Element("span", { "class": "inputbox" });
    filterSubBox.appendText("Filter by Name:");
    var nameinput = new Element("input");
    filterSubBox.appendChild(nameinput);
    filterBox.appendChild(filterSubBox);
      
    /* Add topic filter box. */
    var filterSubBox = new Element("span", { "class": "inputbox" });
    filterSubBox.appendText("Filter by Topic:");
    var topicinput = new Element("input");
    filterSubBox.appendChild(topicinput);
    filterBox.appendChild(filterSubBox);
    
    /* Add refresh and update filters button. */
    var refresh = new Element("input", {"type": "submit", "value": "Refresh and Apply Filters"});
    refresh.addEvent("click", function(e) {
      (new Event(e)).stop();
      if (nameinput.value != this.namefilter || topicinput.value != this.topicfilter) {
        this.namefilter = nameinput.value;
        this.topicfilter = topicinput.value;
        this.page = 1;
      }
      this.timestamp = 0;
      this.update();
    }.bind(this));
    filterBox.appendChild(refresh);

    /* Add filter box. */
    parent.appendChild(filterBox);

    /* Create the channel table. */
    var table = new Element("table", { "class": "chanbox", "cellspacing": "0"});
    parent.appendChild(table);
    this.chanBox = new Element("tbody");
    table.appendChild(this.chanBox);
    
    /* Make page box and components. */
    this.pageBox = new Element("div", { "class": "pagebox" });
    this.pageBox.style.display = "none";
    this.prev = new Element("span");
    this.pageText = new Element("span");
    this.next = new Element("span");
    this.pageBox.appendChild(this.prev);
    this.pageBox.appendText(" - ");
    this.pageBox.appendChild(this.pageText);
    this.pageBox.appendText(" - ");
    this.pageBox.appendChild(this.next);

    /* Add page box. */
    parent.appendChild(this.pageBox);

    /* Start the loading display timer. */
    var delayfn = function() { this.chanBox.set("html", "<tr><td class=\"loading\">Loading. . .</td></tr>"); }.bind(this);
    this.loading = delayfn.delay(500);

    /* Get a channel list. */
    this.update();
  },

  /**
   * Update the channel list.
   */
  update: function() {
    qwebirc.irc.AthemeQuery.channelList(function(channels, timestamp, total) {

      /* Update our timestamp to the timestamp of this list. */
      this.timestamp = timestamp;

      /* Update the page number. */
      var pages = Math.ceil(total/100);
      while (this.pageText.childNodes.length >= 1)
        this.pageText.removeChild(this.pageText.firstChild);
      this.pageText.appendText("Page " + (this.page) + " of " + pages);

      /* Cancel any timeout. */
      if (this.loading != null) {
        clearTimeout(this.loading)
        this.loading = null;
      }

      /* Remove any previous content from the channel list box. */
      if (this.chanBox.hasChildNodes()) {
        while (this.chanBox.childNodes.length >= 1)
          this.chanBox.removeChild(this.chanBox.firstChild);
      }

      /* If we have a previous page, enable prev button. */
      while (this.prev.childNodes.length >= 1)
        this.prev.removeChild(this.prev.firstChild);
      if (this.page > 1) {
        var prevLink = new Element("a", {"href": "#"});
        prevLink.appendText("Prev Page");
        prevLink.addEvent("click", function(e) {
          this.page--;
          prevLink.removeEvents();
          this.update();
        }.bind(this));
        this.prev.appendChild(prevLink);
      }
      else {
        this.prev.appendText("Prev Page");
      }

      /* If we have a next page, enable next button. */
      while (this.next.childNodes.length >= 1)
        this.next.removeChild(this.next.firstChild);
      if (this.page < pages) {
        var nextLink = new Element("a", {"href": "#"});
        nextLink.appendText("Next Page");
        nextLink.addEvent("click", function(e) {
          this.page++;
          nextLink.removeEvents();
          this.update();
        }.bind(this));
        this.next.appendChild(nextLink);
      }
      else {
        this.next.appendText("Next Page");
      }

      /* Show the page sorting box only if it has any contents. */
      if (this.page != 1 || pages > 1)
        this.pageBox.style.display = "block";
      else
        this.pageBox.style.display = "none";

      /* If the connection failed, display that and return. */
      if (channels == null) {
        this.chanBox.set("html", "<tr><td class=\"loading\">Unable to load channel list, please try again later.</td></tr>");
        return;
      }

      /* Otherwise, print the table headings... */
      var headers = new Element("tr");
      var name = new Element("th", { "class": "name" });
      name.appendText("Channel");
      headers.appendChild(name);

      var users = new Element("th", { "class": "users" });
      users.appendText("Users");
      headers.appendChild(users);

      var topic = new Element("th", { "class": "chantopic" });
      topic.appendText("Topic");
      headers.appendChild(topic);
      this.chanBox.appendChild(headers);

      /* ...then the channels. */ 
      for (var i = 0; i < channels.length; i++) {
        var channel = new Element("tr");
        var chantype = "chan" + (i%2 + 1);

        /* This closure is a trick so each event handler gets a unique
         * channame recording the channel it should open. */
	var name = new Element("td", { "class": "name " + chantype });
        var closure = function() {
          var channame = channels[i].name;
          channel.addEvent("click", function(e) {
            new Event(e).stop();
            if (this.session.irc)
              this.session.irc.exec("/JOIN " + channame);
            else {
              var connect = this.session.ui.getWindow(qwebirc.ui.WINDOW_CUSTOM, "Connect");
              if (connect) {
                var connected = connect.subWindow.connectChannel(channame);
                if (!connected) {
                  this.session.ui.selectWindow(connect);
                  connect.subWindow.nickBox.focus();
                }
              }
            }
          }.bind(this));
        }.bind(this); closure();
        name.appendText(channels[i].name);
	channel.appendChild(name);

	var users = new Element("td", { "class": "users " + chantype });
	users.appendText(channels[i].users);
	channel.appendChild(users);

	var topic = new Element("td", { "class": "chantopic " + chantype });
        qwebirc.ui.Colourise(this.session, channels[i].topic, topic);
	channel.appendChild(topic);

	this.chanBox.appendChild(channel);
      }
    }.bind(this), this.timestamp, "100", this.page, this.namefilter, this.topicfilter);
  }
});
