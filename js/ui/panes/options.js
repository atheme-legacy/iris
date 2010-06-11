qwebirc.ui.supportsFocus = function(session) {
  var ua = navigator.userAgent;
  if(!$defined(ua))
    return true;
      
  if(Browser.Engine.ipod || ua.indexOf("Konqueror") != -1)
    return false;

  return true;
}

qwebirc.config.Input = new Class({
  initialize: function(session, options, parent, option, position) {
    this.session = session;
    this.options = options;
    this.option = option;
    this.value = session.config[option.category][option.option];
    this.enabled = true;
    this.position = position;
    this.parentElement = parent;
    this.id = qwebirc.util.generateID();
    
    if ($defined(this.option.isEnabled))
      this.enabled = this.option.isEnabled(session);

    this.render();
  },
  createInput: function(type, parent, name, selected) {
    if(!$defined(parent))
      parent = this.parentElement;

    return qwebirc.util.createInput(type, parent, name, selected, this.id);
  },
  FE: function(element, parent) {
    var n = new Element(element);
    if(!$defined(parent))
      parent = this.parentElement;
      
    parent.appendChild(n);
    return n;
  },
  focus: function() {
    this.mainElement.focus();
  },
  onChange: function() {
    if ($defined(this.option.onChange))
      this.option.onChange(this.session, this.options, this.get());
  }
});

qwebirc.config.TextInput = new Class({
  Extends: qwebirc.config.Input,
  render: function() {
    var i = this.createInput("text");
    i.addEvent("change", function(value) {
      this.value = value;
      this.onChange();
    }.bind(this));
    this.mainElement = i;
    
    i.value = this.value;
    i.disabled = !this.enabled;
  },
  get: function() {
    return this.mainElement.value;
  }
});

qwebirc.config.ColorInput = new Class({
  Extends: qwebirc.config.Input,
  render: function() {
    this.hexbox = null;

    if (this.value[0] != "#")
      this.value = "#" + this.value;

    var hue = new Element("div");
    hue.addClass("qwebirc-optionspane");
    hue.addClass("hue-slider");
    this.parentElement.appendChild(hue);
    
    var sat = new Element("div");
    sat.addClass("qwebirc-optionspane");
    sat.addClass("sat-slider");
    this.parentElement.appendChild(sat);

    var light = new Element("div");
    light.addClass("qwebirc-optionspane");
    light.addClass("light-slider");
    this.parentElement.appendChild(light);

    var hexform = new Element("form", {"class": "hexform"});
    this.hexbox = new Element("input", {value: this.value});
    hexform.appendChild(this.hexbox);
    this.parentElement.appendChild(hexform);

    var reset = new Element("input", {type: "button", value: "Reset to Default"});
    this.parentElement.appendChild(reset);

    var color = new Color(this.value);

    var k = new Element("div");
    k.addClass("knob");
    if(Browser.Engine.trident) {
      k.setStyle("top", "0px");
      k.setStyle("background-color", "black");
    } 
    hue.appendChild(k);
    var hue_slider = new Slider(hue, k, {steps: 36, range: [0, 369], wheel: true});
    hue_slider.set(color.hsb[0]);
    
    k = new Element("div");
    k.addClass("knob");
    if(Browser.Engine.trident) {
      k.setStyle("top", "0px");
      k.setStyle("background-color", "black");
    } 
    sat.appendChild(k);
    var sat_slider = new Slider(sat, k, {steps: 50, range: [0, 100], wheel: true});
    sat_slider.set(color.hsb[1]);
    
    k = new Element("div");
    k.addClass("knob");
    if(Browser.Engine.trident) {
      k.setStyle("top", "0px");
      k.setStyle("background-color", "black");
    } 
    light.appendChild(k);
    var light_slider = new Slider(light, k, {steps: 50, range: [0, 100], wheel: true});
    light_slider.set(color.hsb[2]);
    
    var change_func = function(step) {
      var color = $HSB(hue_slider.step, sat_slider.step, light_slider.step);
      this.value = color.rgb.rgbToHex();
      this.onChange();
    }.bind(this);
    hue_slider.addEvent("change", change_func);
    sat_slider.addEvent("change", change_func);
    light_slider.addEvent("change", change_func);
    
    hexform.addEvent("submit", function(e) {
      (new Event(e)).stop();
      var color = new Color(this.hexbox.value)
      hue_slider.set(color.hsb[0]);
      sat_slider.set(color.hsb[1]);
      light_slider.set(color.hsb[2]);
    }.bind(this));
    reset.addEvent("click", function(e) {
      (new Event(e)).stop();
      this.value = this.session.config[this.option.category][this.option.option + "_default"];
      var color = new Color(this.value)
      hue_slider.set(color.hsb[0]);
      sat_slider.set(color.hsb[1]);
      light_slider.set(color.hsb[2]);
    }.bind(this));

    this.mainElement = hue;
    this.startValue = this.value;
    
    if(!this.enabled) {
      hue_slider.detach();
      sat_slider.detach();
      light_slider.detach();
    }
  },
  onChange: function() {
    this.hexbox.value = this.get();
    if ($defined(this.option.onChange))
      this.option.onChange(this.session, this.options, this.get());
  },
  get: function() {
    return this.value;
  },
  cancel: function() {
    this.value = this.startValue;
    this.get();
  }
});

qwebirc.config.CheckInput = new Class({
  Extends: qwebirc.config.Input,
  render: function() {
    var i = this.createInput("checkbox");
    i.addEvent("change", function(value) {
      this.value = value;
      this.onChange();
    }.bind(this));
    this.mainElement = i;
    
    i.checked = this.value;
    i.disabled = !this.enabled;
  },
  get: function() {
    return this.mainElement.checked;
  }
});

qwebirc.config.RadioInput = new Class({
  Extends: qwebirc.config.Input,
  render: function() {
    var value = this.option.options;
    
    this.elements = [];
     
    for(var i=0;i<value.length;i++) {
      var d = this.FE("div");
      var e = this.createInput("radio", d, "options_radio" + this.position, i == this.option.position);
      this.elements.push(e);
      e.disabled = !this.enabled;

      var ePosition = i;
      e.addEvent("change", function(value) {
        if (value) {
          this.option.position = ePosition;
          this.onChange();
        }
      }.bind(this));
   
      if(i == 0)
        this.mainElement = e;
      
      d.appendChild(document.createTextNode(value[i][0]));
    };
  },
  get: function() {
    for(var i=0;i<this.elements.length;i++) {
      var x = this.elements[i];
      if(x.checked) {
        this.option.position = i;
        return this.option.options[i][1];
      }
    }
  }
});

qwebirc.ui.OptionsPane = new Class({
  Implements: [Events],
  session: null,
  initialize: function(session, parentElement) {
    this.session = session;
    this.parentElement = parentElement;
    
    this.createElements();
  },
  createElements: function() {
    var FE = function(element, parent) {
      var n = new Element(element);
      parent.appendChild(n);
      return n;
    };
    
    var t = FE("table", this.parentElement);
    var tb = FE("tbody", t);
    
    this.boxList = [];
    this.options = {};
    
    for(var i=0;i<qwebirc.config.UserOptions.length;i++) {
      var x = qwebirc.config.UserOptions[i];
      var type = qwebirc.config.CheckInput;
      if ($defined(x.type))
        type = x.type;

      var row = FE("tr", tb);
      var cella = FE("td", row);
      var cellb = FE("td", row);

      var input = new type(this.session, this.options, cellb, x, i);

      var label = new Element("label", {"for": input.id});
      label.set("text", x.label + ":");
      cella.appendChild(label);

      this.boxList.push([x, input]);
      this.options[x.category + "." + x.option] = input;
    }
    
    var r = FE("tr", tb);
    var cella = FE("td", r);
    var cellb = FE("td", r);
    var save = qwebirc.util.createInput("submit", cellb);
    save.value = "Save";
    
    save.addEvent("click", function() {
      this.save();
      this.fireEvent("close");
    }.bind(this));
    
    var cancel = qwebirc.util.createInput("submit", cellb);
    cancel.value = "Cancel";
    cancel.addEvent("click", function() {
      this.cancel();
      this.fireEvent("close");
    }.bind(this));
  },
  save: function() {
    this.boxList.forEach(function(x) {
      var option = x[0];
      var box = x[1];

      this.session.config[option.category][option.option] = box.get();
      if (option.onSave)
        option.onSave(this.session);
    }.bind(this));

    this.session.saveUserSettings();
  },
  cancel: function() {
    this.boxList.forEach(function(x) {
      if (x[0].onCancel)
        x[0].onCancel(this.session);
    }.bind(this));
  }
});

qwebirc.config.UserOptions = [
  {
    category: "ui",
    option: "beep_on_mention",
    label: "Beep when nick mentioned or on query activity (requires Flash)",
    isEnabled: function (session) {
      if(!$defined(Browser.Plugins.Flash) || Browser.Plugins.Flash.version < 8)
       return false;
      return true;
    },
    onSave: function(session) {
      if (session.ui.updateBeepOnMention)
        session.ui.updateBeepOnMention();
    }
  },
  {
    category: "ui",
    option: "dedicated_msg_window",
    label: "Send privmsgs to dedicated messages window"
  },
  {
    category: "ui",
    option: "dedicated_notice_window",
    label: "Send notices to dedicated message window"
  },
  {
    category: "ui",
    option: "flash_on_mention",
    label: "Flash titlebar when nick mentioned or on query activity",
    enabled: qwebirc.ui.supportsFocus
  },
  {
    category: "ui",
    option: "lastpos_line",
    label: "Show a last position indicator for each window",
    enabled: qwebirc.ui.supportsFocus
  },
  {
    category: "ui",
    option: "nick_colors",
    label: "Automatically colour nicknames"
  },
  {
    category: "ui",
    option: "nick_status",
    label: "Show status symbol before nicknames in channel lines"
  },
  {
    category: "ui",
    option: "nick_click_query",
    label: "Open a PM window on clicking a nickname in channel"
  },
  {
    category: "ui",
    option: "hide_joinparts",
    label: "Hide JOINS/PARTS/QUITS"
  },
  {
    category: "ui",
    option: "fg_color",
    type: qwebirc.config.ColorInput,
    label: "Adjust main foreground color",
    onChange: function (session, options, value) {
      session.ui.setModifiableStylesheetValues(value, options["ui.fg_sec_color"].get(), options["ui.bg_color"].get());
    }
  },
  {
    category: "ui",
    option: "fg_sec_color",
    type: qwebirc.config.ColorInput,
    label: "Adjust title/link foreground color",
    onChange: function (session, options, value) {
      session.ui.setModifiableStylesheetValues(options["ui.fg_color"].get(), value, options["ui.bg_color"].get());
    }
  },
  {
    category: "ui",
    option: "bg_color",
    type: qwebirc.config.ColorInput,
    label: "Adjust background color",
    onChange: function (session, options, value) {
      session.ui.setModifiableStylesheetValues(options["ui.fg_color"].get(), options["ui.fg_sec_color"].get(), value);
    },
    onSave: function (session) {
      session.ui.setModifiableStylesheetValues(session.config.ui.fg_color, session.config.ui.fg_sec_color, session.config.ui.bg_color);
    },
    onCancel: function (session) {
      session.ui.setModifiableStylesheetValues(session.config.ui.fg_color, session.config.ui.fg_sec_color, session.config.ui.bg_color);
    }
  }
];
