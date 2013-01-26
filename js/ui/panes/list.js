/**
 * Display a list of channels on the network.
 */
qwebirc.ui.Panes.List = {
  title: "Channels",
  command: function(session) {
    if (conf.atheme.chan_list)
      return "LIST";
  },
  menuitem: function(session) {
    if (conf.atheme.chan_list)
      return "Channel list";
  },
  menupos: 100
};

qwebirc.ui.Panes.List.pclass = new Class({
  Implements: [Events],
  session: null,
  parent: null,

  /* Store the list's current state. */
  cloud: true,
  loading: null,
  timestamp: 0,
  page: 1,
  namefilter: "",
  topicfilter: "",
  filterBox: null,
  viewBox: null,
  chanBox: null,
  pageBox: null,
  viewChange: null,
  pageText: null,
  prev: null,
  next: null,


  initialize: function(session, w) {
    this.session = session;
    this.parent = w.lines;
    this.cloud = conf.atheme.chan_list_cloud_view;

    /* Make header table. */
    var headerTable = new Element("table");
    var header = new Element("tbody");
    headerTable.appendChild(header);


    /* Make and add view change link. */
    this.viewChange = new Element("a", { "class": "", "href": "#" });
    this.viewChange.addEvent("click", function(e) {
      if (this.cloud) {
        this.createListView();
      } else {
        this.createCloudView();
      }
    }.bind(this));
    var cell = new Element("td", { "class": "viewchange" });
    cell.appendChild(this.viewChange);
    header.appendChild(cell);


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

    /* Add filter box and completed header. */
    var cell = new Element("td"); cell.appendChild(filterBox);
    header.appendChild(cell);
    this.parent.appendChild(headerTable);


    /* Make and add view box. */
    this.viewBox = new Element("div");
    this.parent.appendChild(this.viewBox);

    if (this.cloud) {
      this.createCloudView();
    } else {
      this.createListView();
    }
  },

  /**
   * Setup the "list view" list of channels.
  */
  createListView: function() {
    this.cloud = false;
    while(this.viewBox.childNodes.length > 0)
      this.viewBox.removeChild(this.viewBox.firstChild);

    /* Update view change text. */
    this.viewChange.set("text", "Switch to cloud view...");

    /* Create the channel table. */
    var table = new Element("table", { "class": "listbox", "cellspacing": "0"});
    this.chanBox = new Element("tbody");
    table.appendChild(this.chanBox);
    this.viewBox.appendChild(table);

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
    this.viewBox.appendChild(this.pageBox);

    /* Start the loading display timer. */
    var delayfn = function() { this.chanBox.set("html", "<tr><td class=\"loading\">Loading. . .</td></tr>"); }.bind(this);
    this.loading = delayfn.delay(500);

    /* Get a channel list. */
    this.update();
  },

  /**
   * Setup the "cloud view" list of channels.
  */
  createCloudView: function() {
    this.cloud = true;
    this.page = 1;
    while(this.viewBox.childNodes.length > 0)
      this.viewBox.removeChild(this.viewBox.firstChild);

    /* Update view change text. */
    this.viewChange.set("text", "Switch to list view...");

    /* Add hint text. */
    var hint = new Element("div", { "class": "hoverhint"});
    hint.appendText("Hover over a channel to view its topic!");
    this.viewBox.appendChild(hint);

    /* Add channel box. */
    this.chanBox = new Element("div", { "class": "tagbox" });
    this.viewBox.appendChild(this.chanBox);

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

      /* Cancel any timeout. */
      if (this.loading != null) {
        clearTimeout(this.loading);
        this.loading = null;
      }

      /* Remove any previous content from the channel box. */
      if (this.chanBox.hasChildNodes()) {
        while (this.chanBox.childNodes.length >= 1)
          this.chanBox.removeChild(this.chanBox.firstChild);
      }

      /* If the connection failed, display that and return. */
      if (channels == null) {
        if (this.cloud) {
          this.chanBox.set("html", "<span class=\"loading\">Unable to load channel list, please try reopening the channel list later.</span>");
        } else {
          this.chanBox.set("html", "<tr><td class=\"loading\">Unable to load channel list, please try refreshing again later.</td></tr>");
        }
        return;
      }

      /* If we got no channels, display that and return. */
      if (channels.length == 0) {
        if (this.cloud) {
          this.chanBox.set("html", "<span class=\"loading\">No channels currently exist, please try refreshing again later.</span>");
        } else {
          this.chanBox.set("html", "<tr><td class=\"loading\">No channels currently exist, please try refreshing again later.</td></tr>");
        }
        return;
      }

      /* Calculate the range of the channel sizes. */
      var minUsers = channels[channels.length-1].users
      var userScale = channels[0].users - minUsers

      /* Print the table headings, for list view. */
      if (!this.cloud) {
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
      }

      /* Sort the channels into alphabetical order for cloud view. */
      if (this.cloud) {
        channels.sort(function (a, b) {
          an = a.name.toLowerCase(); bn = b.name.toLowerCase();
          if (an < bn) return -1;
          if (an > bn) return 1;
          return 0;
        });
      }

      /* Finally, add the channels. */
      for (var i = 0; i < channels.length; i++) {
        var channel;
        if (this.cloud) {
          channel = new Element("span", { "class": "chantag", style: "font-size: " + (1 + 2 * (channels[i].users - minUsers) / (userScale+1)) + "em;" });
        } else {
          channel = new Element("tr");
        }

        this.makeChannel(channel, channels[i], i%2 + 1);

	this.chanBox.appendChild(channel);
        if (this.cloud) {
          this.chanBox.appendText(" ");
        }
      }
    }.bind(this), this.timestamp, "100", this.page, this.namefilter, this.topicfilter);
  },

  /**
   * Update page numbers and paging boxes.
   */
  updatePaging: function(total) {

    /* Update the page number, if there is one. */
    if (this.pageText) {
      var pages = Math.ceil(total/100);
      while (this.pageText.childNodes.length >= 1)
        this.pageText.removeChild(this.pageText.firstChild);
      this.pageText.appendText("Page " + (this.page) + " of " + pages);
    }

    /* Update the page change buttons, if there are any. */
    if (this.prev && this.next) {

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
      } else {
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
    }

    /* Show the page sorting box only if it has any contents. */
    if (this.PageBox) {
      if (this.page != 1 || pages > 1)
        this.pageBox.style.display = "block";
      else
        this.pageBox.style.display = "none";
    }
  },

  /**
   * Make channel item for the list, as appropriate for the current list mode.
   */
  makeChannel: function(chanitem, channel, oddeven) {

    var name;
    if (this.cloud) {
      name = chanitem
    } else {
      name = new Element("td", { "class": "name chan" + oddeven });
    }

    /* This closure is a trick so each event handler gets a unique
     * channame recording the channel it should open. */
    var closure = function() {
      var channame = channel.name;
      chanitem.addEvent("click", function(e) {
        new Event(e).stop();
        if (this.session.irc)
          this.session.irc.exec("/JOIN " + channame);
        else {
          var connect = ui.getWindow(qwebirc.ui.WINDOW_CUSTOM, "Connect");
          if (connect) {
            var connected = connect.subWindow.connectChannel(channame);
            if (!connected) {
              ui.selectWindow(connect);
              connect.subWindow.nickBox.focus();
            }
          }
        }
      }.bind(this));
    }.bind(this); closure();
    name.appendText(channel.name);

    /* Add all other information shown for the channel in this view. */
    if (this.cloud) {
      chanitem.setProperty("title", channel.topic);
    } else {
      chanitem.appendChild(name);

      var users = new Element("td", { "class": "users chan" + oddeven });
      users.appendText(channel.users);
      chanitem.appendChild(users);

      var topic = new Element("td", { "class": "chantopic chan" + oddeven });
      qwebirc.ui.Colourise(this.session, channel.topic, topic);
      chanitem.appendChild(topic);
    }
  }
});
