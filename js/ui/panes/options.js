qwebirc.ui.Panes.Options = {
  title: "Options",
  command: function(session) { return "OPTIONS"; },
  menuitem: function(session) { return "Options"; },
  menupos: 300
};

qwebirc.ui.Panes.Options.pclass = new Class({
  Implements: [Events],
  session: null,
  initialize: function(session, w) {
    this.session = session;
    this.window = w;
    this.parent = w.lines;

    this.createElements();
  },
  createElements: function() {
    var FE = function(element, parent) {
      var n = new Element(element);
      parent.appendChild(n);
      return n;
    };

    var t = FE("table", this.parent);
    var tb = FE("tbody", t);

    this.boxList = [];
    this.options = {};

    for(var i=0;i<qwebirc.options.Options.length;i++) {
      var x = qwebirc.options.Options[i];

      var type = qwebirc.options.CheckInput;
      if ($defined(x.type))
        type = x.type;
      if (type == qwebirc.options.ColorInput && $defined(x.isEnabled)) {
        if (!x.isEnabled(this.session))
          continue
      }

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
      ui.closeWindow(this.window);
    }.bind(this));

    var cancel = qwebirc.util.createInput("submit", cellb);
    cancel.value = "Cancel";
    cancel.addEvent("click", function() {
      this.cancel();
      ui.closeWindow(this.window);
    }.bind(this));
  },
  save: function() {
    this.boxList.forEach(function(x) {
      var option = x[0];
      var box = x[1];

      conf[option.category][option.option] = box.get();
      if (option.onSave)
        option.onSave(this.session);
    }.bind(this));

    qwebirc.config.saveUserSettings(conf);
  },
  cancel: function() {
    this.boxList.forEach(function(x) {
      if (x[0].onCancel)
        x[0].onCancel(this.session);
    }.bind(this));
  }
});
