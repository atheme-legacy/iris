qwebirc.ui.WINDOW_STATUS =   0x01;
qwebirc.ui.WINDOW_QUERY =    0x02;
qwebirc.ui.WINDOW_CHANNEL =  0x04;
qwebirc.ui.WINDOW_MESSAGES = 0x08;
qwebirc.ui.WINDOW_CUSTOM =   0x10;

qwebirc.ui.BaseUI = new Class({
  initialize: function(session, parentElement, windowClass, uiName) {
    this.session = session;
    this.parentElement = parentElement;
    this.windowClass = windowClass;
    
    this.windows = {};
    this.windowArray = [];
    this.parentElement.addClass("qwebirc");
    this.parentElement.addClass("qwebirc-" + uiName);
    this.firstClient = false;
    this.commandhistory = new qwebirc.irc.CommandHistory();
    
    this.windowFocused = true;

    if(Browser.Engine.trident) {
      var checkFocus = function() {
        var hasFocus = document.hasFocus();
        if(hasFocus != this.windowFocused) {
          this.windowFocused = hasFocus;
          this.focusChange(hasFocus);
        }
      }

      checkFocus.periodical(100, this);
    } else {
      var blur = function() { if(this.windowFocused) { this.windowFocused = false; this.focusChange(false); } }.bind(this);
      var focus = function() { if(!this.windowFocused) { this.windowFocused = true; this.focusChange(true); } }.bind(this);

      /* firefox requires both */

      document.addEvent("blur", blur);
      window.addEvent("blur", blur);
      document.addEvent("focus", focus);
      window.addEvent("focus", focus);
    }
    
    this.windows[this.session.id] = {}
    this.postInitialize();
  },
  newClient: function() {
    var w = this.newWindow(qwebirc.ui.WINDOW_STATUS, "Status");
    this.selectWindow(w);
    if(!this.firstClient) {
      this.firstClient = true;
      w.addLine("", "qwebirc v" + qwebirc.VERSION);
      w.addLine("", "Copyright (C) 2008-2010 Chris Porter and the qwebirc project.");
      w.addLine("", "http://www.qwebirc.org");
      w.addLine("", "Licensed under the GNU General Public License, Version 2.");
    }
    return w;
  },
  getWindowIdentifier: function(type, name) {
    if(type == qwebirc.ui.WINDOW_MESSAGES)
      return "-M";
    if(type == qwebirc.ui.WINDOW_STATUS)
      return "";
    if(type == qwebirc.ui.WINDOW_CUSTOM)
      return "internal_" + qwebirc.irc.ASCIItoIRCLower(name);

    return "_" + this.session.irc.toIRCLower(name);
  },
  newWindow: function(type, name) {
    var w = this.getWindow(type, name);
    if($defined(w))
      return w;
      
    var wId = this.getWindowIdentifier(type, name);
    var w = this.windows[this.session.id][wId] = new this.windowClass(this.session, type, name, wId);

    this.windowArray.push(w);
    
    return w;
  },
  getWindow: function(type, name) {
    var c = this.windows[this.session.id];
    if(!$defined(c))
      return null;
      
    return c[this.getWindowIdentifier(type, name)];
  },
  getActiveWindow: function() {
    return this.active;
  },
  getActiveIRCWindow: function() {
    if(!this.active || this.active.type == qwebirc.ui.WINDOW_CUSTOM) {
      return this.windows[this.session.id][this.getWindowIdentifier(qwebirc.ui.WINDOW_STATUS)];
    } else {
      return this.active;
    }
  },  
  __setActiveWindow: function(window) {
    this.active = window;
  },
  selectWindow: function(window) {
    if(this.active)
      this.active.deselect();
    window.select();  /* calls setActiveWindow */
    this.updateTitle(window.name + " - " + this.session.config.frontend.app_title);
  },
  updateTitle: function(text) {
    document.title = text;
  },
  nextWindow: function(direction) {
    if(this.windowArray.length == 0 || !this.active)
      return;
      
    if(!direction)
      direction = 1;
      
    var index = this.windowArray.indexOf(this.active);
    if(index == -1)
      return;
      
    index = index + direction;
    if(index < 0) {
      index = this.windowArray.length - 1;
    } else if(index >= this.windowArray.length) {
      index = 0;
    }
    
    this.selectWindow(this.windowArray[index]);
  },
  prevWindow: function() {
    this.nextWindow(-1);
  },
  __closed: function(window) {
    if(window.active) {
      this.active = undefined;
      if(this.windowArray.length == 1) {
        this.windowArray = [];
      } else {
        var index = this.windowArray.indexOf(window);
        if(index == -1) {
          return;
        } else if(index == 0) {
          this.selectWindow(this.windowArray[1]);
        } else {
          this.selectWindow(this.windowArray[index - 1]);
        }
      }
    }
    
    this.windowArray = this.windowArray.erase(window);
    delete this.windows[this.session.id][window.identifier];
  },
  focusChange: function(newValue) {
    var window_ = this.getActiveWindow();
    if($defined(window_))
      window_.focusChange(newValue);
  }
});

qwebirc.ui.StandardUI = new Class({
  Extends: qwebirc.ui.BaseUI,
  UICommands: qwebirc.ui.UI_COMMANDS,
  initialize: function(session, parentElement, windowClass, uiName) {
    this.parent(session, parentElement, windowClass, uiName);

    this.tabCompleter = new qwebirc.ui.TabCompleterFactory(this);
    this.customWindows = {};
    
    var ev;
    if(Browser.Engine.trident) {
      ev = "keydown";
    } else {
      ev = "keypress";
    }
    document.addEvent(ev, this.__handleHotkey.bind(this));
  },
  __handleHotkey: function(x) {
    if(!x.alt || x.control) {
      if(x.key == "backspace" || x.key == "/")
        if(!this.getInputFocused(x))
          new Event(x).stop();
      return;
    }
    var success = false;
    if(x.key == "a" || x.key == "A") {
      var highestNum = 0;
      var highestIndex = -1;
      success = true;
      
      new Event(x).stop();
      for(var i=0;i<this.windowArray.length;i++) {
        var h = this.windowArray[i].hilighted;
        if(h > highestNum) {
          highestIndex = i;
          highestNum = h;
        }
      }
      if(highestIndex > -1)
        this.selectWindow(this.windowArray[highestIndex]);
    } else if(x.key >= '0' && x.key <= '9') {
      success = true;
      
      number = x.key - '0';
      if(number == 0)
        number = 10
        
      number = number - 1;
      
      if(number >= this.windowArray.length)
        return;
        
      this.selectWindow(this.windowArray[number]);
    } else if(x.key == "left") {
      this.prevWindow();
      success = true;
    } else if(x.key == "right") {
      this.nextWindow();
      success = true;
    }
    if(success)
      new Event(x).stop();
  },
  getInputFocused: function(x) {
    if($$("input").indexOf(x.target) == -1 && $$("textarea").indexOf(x.target) == -1)
      return false;
    return true;
  },
  newCustomWindow: function(name, select, type) {
    if(!type)
      type = qwebirc.ui.WINDOW_CUSTOM;
      
    var w = this.newWindow(type, name);
    w.addEvent("close", function(w) {
      delete this.windows[this.session.id][w.identifier];
    }.bind(this));
    
    if(select)
      this.selectWindow(w);  

    return w;
  },
  addCustomWindow: function(windowName, class_, cssClass) {

    if(this.customWindows[windowName]) {
      this.selectWindow(this.customWindows[windowName]);
      return;
    }
    
    var d = this.newCustomWindow(windowName, true);
    this.customWindows[windowName] = d;
    
    d.addEvent("close", function() {
      this.customWindows[windowName] = null;
    }.bind(this));
        
    if(cssClass)
      d.lines.addClass("qwebirc-" + cssClass);
      
    var ew = new class_(this.session, d.lines);
    ew.addEvent("close", function() {
      d.close();
    }.bind(this));
    
    d.setSubWindow(ew);
    return d;
  },
  connectWindow: function(callbackfn) {
    var w = this.addCustomWindow("Connect", qwebirc.ui.ConnectPane, "connect");
    w.subWindow.connectCallback = function(args) {
      w.close();
      callbackfn(args);
    };
  },
  embeddedWindow: function() {
    this.addCustomWindow("Webchat Wizard", qwebirc.ui.EmbedWizard, "embeddedwizard");
  },
  optionsWindow: function() {
    this.addCustomWindow("Options", qwebirc.ui.OptionsPane, "optionspane");
  },
  aboutWindow: function() {
    this.addCustomWindow("About", qwebirc.ui.AboutPane, "aboutpane");
  },
  privacyWindow: function() {
    this.addCustomWindow("Privacy Policy", qwebirc.ui.PrivacyPolicyPane, "privacypolicypane");
  },
  feedbackWindow: function() {
    this.addCustomWindow("Feedback", qwebirc.ui.FeedbackPane, "feedbackpane");
  },
  faqWindow: function() {
    this.addCustomWindow("FAQ", qwebirc.ui.FAQPane, "faqpane");
  },
  listWindow: function() {
    if (!this.session.config.atheme.chan_list)
      return;

    this.addCustomWindow("Channels", qwebirc.ui.ListPane, "listpane");
  },
  urlDispatcher: function(name) {
    if(name == "embedded")
      return ["a", this.embeddedWindow.bind(this)];
      
    if(name == "options")
      return ["a", this.optionsWindow.bind(this)];

    /* doesn't really belong here */
    if(name == "whois") {
      return ["span", function(nick) {
        if (this.session.config.ui.nick_click_query)
          this.session.irc.exec("/QUERY " + nick);
        else
          this.session.irc.exec("/WHOIS " + nick);
      }.bind(this)];
    }
    if(name == "accinfo") {
      return ["span", function(account) {
        this.session.irc.exec("/MSG NickServ INFO " + account);
      }.bind(this)];
    }

    return null;
  },
  tabComplete: function(element) {
    this.tabCompleter.tabComplete(element);
  },
  resetTabComplete: function() {
    this.tabCompleter.reset();
  },
  setModifiableStylesheet: function(name) {
    this.__styleSheet = new qwebirc.ui.style.ModifiableStylesheet(this.session.config.frontend.static_base_url + "css/" + name + qwebirc.FILE_SUFFIX + ".mcss");
    
    this.setModifiableStylesheetValues(this.session.config.ui.fg_color, this.session.config.ui.fg_sec_color, this.session.config.ui.bg_color);
  },
  setModifiableStylesheetValues: function(fg_color, fg_sec_color, bg_color) {

    var fg = new Color(fg_color);
    var fg_sec = new Color(fg_sec_color);
    var bg = new Color(bg_color);

    var multiplier = 1;
    if (fg.hsb[2] > bg.hsb[2])
      multiplier = -1;

    if(!$defined(this.__styleSheet))
      return;
    this.__styleSheet.set(
        function(x) {
          return x.setHue(-180 + x.hsb[0] + fg.hsb[0]).setSaturation(fg.hsb[1] + (x.hsb[1]-50)*multiplier).setBrightness(fg.hsb[2] + (x.hsb[2]-50)*multiplier);
        },
        function(x) {
          return x.setHue(-180 + x.hsb[0] + fg_sec.hsb[0]).setSaturation(fg_sec.hsb[1] + (x.hsb[1]-50)*multiplier).setBrightness(fg_sec.hsb[2] + (x.hsb[2]-50)*multiplier);
        },
        function(x) {
          return x.setHue(-180 + x.hsb[0] + bg.hsb[0]).setSaturation(bg.hsb[1] + (x.hsb[1]-50)*multiplier).setBrightness(bg.hsb[2] + (x.hsb[2]-50)*multiplier);
        }
    );
  }
});

qwebirc.ui.NotificationUI = new Class({
  Extends: qwebirc.ui.StandardUI,
  initialize: function(session, parentElement, windowClass, uiName) {
    this.parent(session, parentElement, windowClass, uiName);
    
    this.__beeper = new qwebirc.ui.Beeper(session);
    this.__flasher = new qwebirc.ui.Flasher(session);
    
    this.beep = this.__beeper.beep.bind(this.__beeper);
    
    this.flash = this.__flasher.flash.bind(this.__flasher);
    this.cancelFlash = this.__flasher.cancelFlash.bind(this.__flasher);
  },
  setBeepOnMention: function(value) {
    if(value)
      this.__beeper.soundInit();
  },
  updateTitle: function(text) {
    if(this.__flasher.updateTitle(text))
      this.parent(text);
  },
  focusChange: function(value) {
    this.parent(value);
    this.__flasher.focusChange(value);
  }
});

qwebirc.ui.RootUI = qwebirc.ui.NotificationUI;

qwebirc.ui.RequestTransformHTML = function(session, options) {
  var HREF_ELEMENTS = {
    "IMG": 1
  };

  var update = options.update;
  var onSuccess = options.onSuccess;

  var fixUp = function(node) {
    if(node.nodeType != 1)
      return;

    var tagName = node.nodeName.toUpperCase();
    if(HREF_ELEMENTS[tagName]) {
      var attr = node.getAttribute("transform_attr");
      var value = node.getAttribute("transform_value");
      if($defined(attr) && $defined(value)) {
        node.removeAttribute("transform_attr");
        node.removeAttribute("transform_value");
        node.setAttribute(attr, session.config.frontend.static_base_url + value);
      }
    }

    for(var i=0;i<node.childNodes.length;i++)
      fixUp(node.childNodes[i]);
  };

  delete options["update"];
  options.onSuccess = function(tree, elements, html, js) {
    var container = new Element("div");
    container.set("html", html);
    fixUp(container);
    update.empty();

    while(container.childNodes.length > 0) {
      var x = container.firstChild;
      container.removeChild(x);
      update.appendChild(x);
    }
    onSuccess();
  };

  return new Request.HTML(options);
};

