import os, sys, pages, subprocess, re
import qwebirc.config as config

class GitException(Exception):
  pass
  
def jslist(name, debug):
  ui = pages.UIs[name]
  if debug:
    x = [pages.JS_BASE, ui.get("extra", []), pages.DEBUG, ["debug/ui/frontends/%s" % y for y in ui["uifiles"]]]
    gitid = ""
  else:
    #x = [pages.JS_BASE, ui.get("buildextra", ui.get("extra", [])), pages.BUILD_BASE, name]
    x = [name]
    gitid = "-" + getgitid()  
  
  return list("js/%s%s.js" % (y, gitid) for y in pages.flatten(x))

def csslist(name, debug, gen=False):
  ui = pages.UIs[name]
  nocss = ui.get("nocss")
  if not debug:
    return ["css/%s-%s.css" % (name, getgitid())]
  css = pages.flatten([ui.get("extracss", []), "colours", "dialogs"])
  if not nocss:
    css = list(css) + [name]
  return list("css/%s%s.css" % ("debug/" if gen else "", x) for x in css)

def _getgitid():
  try:
    p = subprocess.Popen(["git", "show", "--pretty=oneline", "--quiet"], stdout=subprocess.PIPE)
  except Exception, e:
    if hasattr(e, "errno") and e.errno == 2:
      raise GitException, "unable to execute"
    raise GitException, "unknown exception running git: %s" % repr(e)
    
  data = p.communicate()[0]
  status = p.wait()
  if status != 0 and status != 1:
    raise GitException, "unable to get id"
  return re.match("^([0-9a-f]+)", data).group(1)

GitID = None
def getgitid():
  global GitID
  if GitID is None:
    try:
      GitID =  _getgitid()
    except GitException, e:
      print >>sys.stderr, "warning: git: %s (using a random id)." % e
      GitID = os.urandom(10).encode("hex")
  return GitID
    
def producehtml(name, debug):
  ui = pages.UIs[name]
  js = jslist(name, debug)
  css = csslist(name, debug, gen=True)
  csshtml = "\n".join("  <link rel=\"stylesheet\" href=\"%s%s\" type=\"text/css\"/>" % (config.frontend["static_base_url"], x) for x in css)
  jshtml = "\n".join("  <script type=\"text/javascript\" src=\"%s%s\"></script>" % (config.frontend["static_base_url"], x) for x in js)

  div = ui.get("div", "")
  customcss = "\n".join("  <link rel=\"stylesheet\" href=\"%s%s\" type=\"text/css\"/>" % (config.frontend["static_base_url"], x) for x in ui.get("customcss", []))
  customjs = "\n".join("  <script type=\"text/javascript\" src=\"%s%s\"></script>" % (config.frontend["static_base_url"], x) for x in ui.get("customjs", []))
  flash = """
  <div style="width:0px;height:0px;overflow:hidden;">
      <div id="FlashSocket"></div>
      <script type="text/javascript">
        FlashSocket = swfobject.createSWF({
            data: "%sswf/flashsocket.swf",
            width: "10",
            height: "10",
            allowscriptaccess: "always"
        }, {}, "FlashSocket");
      </script>
  </div>""" % (config.frontend["static_base_url"])
  return """%s
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
  <base />
  <title>%s (Iris)</title>
  <meta http-equiv="Content-Type" content="text/html;charset=utf-8"/>
  <link rel="shortcut icon" type="image/png" href="%simages/favicon.png"/>
%s
%s%s
%s
%s
  <script type="text/javascript">
    conf = qwebirc.config.load(%s);
    qwebirc.ui.create("ircui", qwebirc.ui.%s);
  </script>
</head>
<body>
  <div id="ircui">
    <noscript>
      <div id="noscript">Javascript is required to use IRC.</div>
    </noscript>%s
  </div>
%s
</body>
</html>
""" % (ui["doctype"], config.frontend["app_title"], config.frontend["static_base_url"], config.frontend["extra_html"], csshtml, customcss, jshtml, customjs, config.js_config(), ui["class"], div, flash)

def main(outputdir=".", produce_debug=True):
  p = os.path.join(outputdir, "static")
  for x in pages.UIs:
    if produce_debug:
      f = open(os.path.join(p, "%sdebug.html" % x), "wb")
      try:
        f.write(producehtml(x, debug=True))
      finally:
        f.close()
      
    f = open(os.path.join(p, "%s.html" % x), "wb")
    try:
      f.write(producehtml(x, debug=False))
    finally:
      f.close()

if __name__ == "__main__":
  main()
  
