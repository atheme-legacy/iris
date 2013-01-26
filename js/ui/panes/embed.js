qwebirc.ui.Panes.Embed = {
  title: "Webchat Wizard",
  command: function(session) { return "EMBED"; },
  menuitem: function(session) { return "Add webchat to your site"; },
  menupos: 200
};

qwebirc.ui.Panes.Embed.pclass = new Class({
  Implements: [Events],
  parent: null,
  session: null,
  initialize: function(session, window) {
    this.session = session;
    this.window = window;
    this.parent = window.lines;
    this.create();
    this.addSteps();
  },
  create: function() {
    this.t = this.parent;

    var titleRow = this.newRow();
    this.title = new Element("h2");
    this.title.setStyle("margin-top", "0px");
    this.title.setStyle("margin-bottom", "5px");
    titleRow.appendChild(this.title);

    this.firstRow = this.newRow();
    this.middleRow = this.newRow();
    var hintRow = this.newRow();
    this.hint = new Element("div");
    this.hint.setStyle("font-size", "0.8em");
    this.hint.setStyle("font-style", "italic");
    hintRow.appendChild(this.hint);
    var exampleRow = this.newRow();
    this.example = new Element("pre");
    exampleRow.appendChild(this.example);

    var nextRow = this.newRow();
    nextRow.addClass("wizardcontrols");
    var backBtn = new Element("input");
    backBtn.type = "submit";
    backBtn.value = "< Back";
    backBtn.addEvent("click", this.back.bind(this));
    nextRow.appendChild(backBtn);

    var nextBtn = new Element("input");
    nextBtn.type = "submit";
    nextBtn.value = "Next >";
    nextRow.appendChild(nextBtn);
    nextBtn.addEvent("click", this.next.bind(this));

    this.nextBtn = nextBtn;
    this.backBtn = backBtn;
  },
  newRow: function() {
    var cell = new Element("div");
    this.t.appendChild(cell);
    return cell;
  },
  newStep: function(options) {
    return new qwebirc.ui.Panes.Embed.Step(this, options);
  },
  newRadio: function(parent, text, name, selected) {
    var p = new Element("div");
    parent.appendChild(p);

    var id = qwebirc.util.generateID();
    var r = qwebirc.util.createInput("radio", p, name, selected, id);

    var label = new Element("label", {"for": id});
    label.appendChild(document.createTextNode(text));
    p.appendChild(label);

    return r;
  },
  addSteps: function() {
    var af = function(select) {
      if(Browser.Engine.trident) {
        var f = function() {
          this.focus();
          if(select)
            this.select();
        };
        f.delay(100, this, []);
      } else {
        this.focus();
        this.select();
      }
    };

    this.welcome = this.newStep({
      "title": "Add webchat to your site!",
      "first": "This wizard will help you create an embedded client by asking you questions then giving you the code to add to your website.<br/><br/>You can use the <b>Next</b> and <b>Back</b> buttons to navigate through the wizard; click <b>Next</b> to continue."
    });

    var default_nick = conf.frontend.initial_nick_default;
    this.nicknameBox = new Element("input");
    this.nicknameBox.addClass("text");
    this.nicknameBox.set("value", default_nick);
    this.nickname = this.newStep({
      "title": "Set nickname",
      "first": "Enter the nickname you would like the client to use by default. Leave it blank for users to be forced to enter a nick themselves:",
      "hint": "You can use a random nick by ending the nick in a series of '.' characters, each of which will be replaced by a random digit.",
      "middle": this.nicknameBox
    }).addEvent("show", af.bind(this.nicknameBox));

    var default_chans = conf.frontend.initial_chans_default;
    this.chanBox = new Element("input");
    this.chanBox.addClass("text");
    this.chanBox.set("value", default_chans);
    this.chans = this.newStep({
      "title": "Set channels",
      "first": "Enter the channels you would like the client to join on startup:",
      "hint": "You can supply multiple channels by seperating them with a comma, e.g.:",
      "example": "#rogue,#eu-mage",
      middle: this.chanBox
    }).addEvent("show", af.bind(this.chanBox));

    var default_prompt = conf.frontend.prompt_default;
    var promptdiv = new Element("form");
    this.connectdialog = this.newStep({
      "title": "Display connect dialog?",
      "first": "Do you want the user to be shown the connect dialog (with the values you have supplied pre-entered) or just a connect confirmation?",
      middle: promptdiv,
      "hint": "You need to display the dialog if you want the user to be able to edit their nickname before connecting."
    });

    this.connectdialogr = this.newRadio(promptdiv, "Show the connect dialog.", "prompt", default_prompt);
    var autoconnect = this.newRadio(promptdiv, "Connect without displaying the dialog.", "prompt", !default_prompt);

    var coloroptdiv = new Element("form");
    this.choosecolor = this.newStep({
      "title": "Customize color?",
      "first": "Would you like to customize the colors used by the widget?",
      middle: coloroptdiv,
      "hint": "Color customization can be used to make the widget match the rest of your site."
    });


    var nocustomcolors = this.newRadio(coloroptdiv, "Use the default colors.", "colors", true);
    this.coloroptr = this.newRadio(coloroptdiv, "Choose custom widget colors.", "colors", false);

    this.fgColor = new Element("input");
    this.fgColor.addClass("text");
    this.fgColor.set("value", conf.ui.fg_color);
    this.foregroundcolor = this.newStep({
      "title": "Set foreground color",
      "first": "Set the widget's foreground (text) color:",
      middle: this.fgColor,
      "hint": "Enter a hexadecimal color specification, e.g.:",
      "example": "#0A0A0A"
    }).addEvent("show", af.bind(this.fgColor));

    this.secColor = new Element("input");
    this.secColor.addClass("text");
    this.secColor.set("value", conf.ui.fg_sec_color);
    this.secondarycolor = this.newStep({
      "title": "Set secondary color",
      "first": "Set the widget's secondary foreground (heading) color:",
      middle: this.secColor,
      "hint": "Enter a hexadecimal color specification, e.g.:",
      "example": "#1A1A1A"
    }).addEvent("show", af.bind(this.secColor));

    this.bgColor = new Element("input");
    this.bgColor.addClass("text");
    this.bgColor.set("value", conf.ui.bg_color);
    this.backgroundcolor = this.newStep({
      "title": "Set background color",
      "first": "Set the widget's background color:",
      middle: this.bgColor,
      "hint": "Enter a hexadecimal color specification, e.g.:",
      "example": "#FFFFFF"
    }).addEvent("show", af.bind(this.bgColor));

    var codeDiv = new Element("div");
    this.finish = this.newStep({
      "title": "Finished!",
      "first": "Your custom link is:",
      middle: codeDiv
    }).addEvent("show", function() {
      var alink = new Element("a");
      var abox = new Element("input");
      abox.addClass("iframetext");
      var url = this.generateURL(false);

      alink.href = url;
      alink.target = "_blank";
      alink.appendChild(document.createTextNode(url));
      abox.value = "<iframe src=\"" + url + "\" width=\"647\" height=\"400\"></iframe>";

      var mBox = [
        alink,
        new Element("br"), new Element("br"),
        document.createTextNode("You can embed this into your page with the following code:"),
        new Element("br"),
        abox
      ];

      while(codeDiv.childNodes.length > 0)
        codeDiv.removeChild(codeDiv.childNodes[0]);

      mBox.forEach(function(x) {
        codeDiv.appendChild(x);
      });

      af.bind(abox)(true);
      abox.addEvent("click", function() {
        this.select();
      }.bind(abox));
    }.bind(this));

    this.updateSteps();
    this.step = 0;

    this.showStep();
  },
  updateSteps: function() {
    this.steps = [this.welcome, this.nickname, this.chans];

    if(this.chanBox.value != "" && this.nicknameBox.value != "")
      this.steps.push(this.connectdialog);

    this.steps.push(this.choosecolor);

    if(this.coloroptr.checked == true) {
      this.steps.push(this.foregroundcolor);
      this.steps.push(this.secondarycolor);
      this.steps.push(this.backgroundcolor);
    }

    this.steps.push(this.finish);
  },
  showStep: function() {
    this.backBtn.disabled = !(this.step > 0);

    this.nextBtn.value = (this.step >= this.steps.length - 1)?"Close":"Next >";

    this.steps[this.step].show();
  },
  next: function() {
    var pm = this.steps[this.step].options.premove;

    if(pm && !pm())
      return;

    this.updateSteps();
    if(this.step >= this.steps.length - 1) {
      this.close();
      return;
    }
    this.step = this.step + 1;
    this.showStep();
  },
  close: function() {
    ui.closeWindow(this.window);
  },
  back: function() {
    if(this.step <= 0)
      return;

      this.step = this.step - 1;
    this.showStep();
  },
  generateURL: function() {
    var chans = this.chanBox.value;
    var nick = this.nicknameBox.value;
    var prompt = this.connectdialogr.checked && chans != "" && nick != "";
    var colors = this.coloroptr.checked;
    var fg = this.fgColor.value;
    var sec = this.secColor.value;
    var bg = this.bgColor.value;

    var URL = [];
    URL.push("nick=" + escape(nick));

    if(chans) {
      var d = chans.split(",");
      var d2 = [];

      d.forEach(function(x) {
        if(x.charAt(0) == '#')
          x = x.substring(1);

        d2.push(x);
      });

      URL.push("channels=" + escape(d2.join(",")));
    }
    else
      URL.push("channels=");

    if(colors) {
      URL.push("fg_color="+fg.replace("#",""));
      URL.push("fg_sec_color="+sec.replace("#",""));
      URL.push("bg_color="+bg.replace("#",""));
    }

    if(prompt)
      URL.push("prompt=1");
    else if (chans != "" && nick != "")
      URL.push("prompt=0");

    return conf.frontend.base_url + (URL.length>0?"?":"") + URL.join("&");
  }
});

/* NEEDS converting to plain HTML! */
qwebirc.ui.Panes.Embed.Step = new Class({
  Implements: [Options, Events],
  options: {
    "title": "",
    "first": "",
    "hint": "",
    "middle": null,
    "premove": null,
    "example": ""
  },
  initialize: function(parent, options) {
    this.setOptions(options);
    this.parent = parent;
  },
  show: function() {
    this.parent.title.set("html", this.options.title);
    this.parent.firstRow.set("html", this.options.first);
    this.parent.hint.set("html", this.options.hint);
    this.parent.example.set("text", this.options.example);

    while(this.parent.middleRow.childNodes.length > 0)
      this.parent.middleRow.removeChild(this.parent.middleRow.childNodes[0]);

    if($defined(this.options.middle))
      this.parent.middleRow.appendChild(this.options.middle);

    this.fireEvent("show");
  }
});
