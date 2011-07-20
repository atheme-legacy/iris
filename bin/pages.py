#!/usr/bin/env python
import os

DEBUG_BASE = ["js/qwebirc.js"]

def addfrom(path, list):
    files = os.listdir(path)
    files.sort()
    for file in files:
        if path == "js" and file == "qwebirc.js":
            continue
        if file.endswith(".js"):
            list.append(os.path.join(path, file))

addfrom("js", DEBUG_BASE)
addfrom("js/irc", DEBUG_BASE)
addfrom("js/ui", DEBUG_BASE)
addfrom("js/ui/panes", DEBUG_BASE)
    
BUILD_BASE = ["qwebirc"]
JS_BASE = ["mootools-1.2.5-core", "mootools-1.2.5.1-more"]
JS_EXTRA = ["soundmanager2"]

UIs = {
  "mochaui": {
    "class": "MochaUI",
    "nocss": True,
    "uifiles": ["mochaui"],
    "doctype": "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\"" + "\n" \
      "  \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">",
    "customjs": ["js/mochaui/excanvas-compressed.js", "js/mochaui/mocha.js"],
    "customcss": ["css/mochaui/content.css", "css/mochaui/ui.css"]
  },
  "qui": {
    "class": "QUI",
    "nocss": True,
    "uifiles": ["qui"],
    "doctype": "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\"" + "\n" \
      "  \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">",
  }
}

def flatten(y):
  for x in y:
    if isinstance(x, list):
      for x in flatten(x):
        yield x
    else:
      yield x

DEBUG = ["debug/%s" % x for x in DEBUG_BASE]
