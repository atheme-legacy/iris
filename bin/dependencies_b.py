# this is seperate to allow us to use python 2.5 syntax without
# the dependency checker breaking on earlier versions.

import sys
import subprocess

def fail(*message):
  print >>sys.stderr, "\n".join(message)
  sys.exit(1)
  
def warn(*message):
  print >>sys.stderr, "warning:", "\nwarning: ".join(message), "\n"

def check_dependencies():
  i = 0
  
  check_twisted()
  check_win32()
  i+=check_json()
  i+=check_java()
  i+=check_git()
  
  print "0 errors, %d warnings." % i
  
  if i == 0:
    print "looks like you've got everything you need to run qwebirc!"
  else:
    print "you can run qwebirc despite these."

  f = open(".checked", "w")
  f.close()
  
def check_win32():
  if not sys.platform.startswith("win"):
    return
  
  try:
    import win32con
  except ImportError:
    fail("qwebirc requires pywin32, see:", "http://sourceforge.net/project/showfiles.php?group_id=78018")
  
def check_java():
  def java_warn(specific):
    warn(specific, "java is not required, but allows qwebirc to compress output,", "making it faster to download.", "you can get java at http://www.java.com/")
    
  try:
    p = subprocess.Popen(["java", "-version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    p.communicate()
    if p.wait() != 0:
      java_warn("something went wrong looking for java.")
      return 1
  except: # ugh
    java_warn("couldn't find java.")
    return 1
    
  return 0
  
def check_git():
  def git_warn(specific):
    warn(specific, "git is not required, but allows qwebirc to save bandwidth by versioning.", "you can get git at http://git-scm.com/")
    
  try:
    p = subprocess.Popen(["git", "show", "--oneline", "--quiet"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    p.communicate()
    if p.wait() != 1: # For some reason, git returns exit status 1 when --quiet is used with show.
      git_warn("something went wrong looking for git.")
      return 1
  except: # ugh
    git_warn("couldn't find git.")
    return 1
    
  return 0
  
def check_twisted():
  try:
    import twisted
  except ImportError:
    fail("qwebirc requires twisted (at least 8.2.0), see http://twistedmatrix.com/")

  def twisted_fail(x, y=None):
    fail("you don't seem to have twisted's %s module." % x,
         "your distro is most likely modular, look for a twisted %s package%s." % (x, " %s" % y if y else "",))

  try:
    import twisted.names
  except ImportError:
    twisted_fail("names")

  try:
    import twisted.mail
  except ImportError:
    twisted_fail("mail")

  try:
    import twisted.web
  except ImportError:
    twisted_fail("web", "(not web2)")

  try:
    import twisted.words
  except ImportError:
    twisted_fail("words")
    
def check_json():
  import qwebirc.util.qjson
  if qwebirc.util.qjson.slow:
    warn("simplejson module with C speedups not installed.",
         "using embedded module (slower); consider installing simplejson from:",
         "http://pypi.python.org/pypi/simplejson/")
    return 1
  return 0
  
if __name__ == "__main__":
  import dependencies
  dependencies.check_dependencies()
