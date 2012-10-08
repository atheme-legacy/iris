from twisted.web import resource, server, static, error as http_error
from xmlrpclib import ServerProxy
import fnmatch, md5, sys, os, time, traceback, socket, xmlrpclib
import qwebirc.util.qjson as json
import qwebirc.config as config
from adminengine import AdminEngineAction
from qwebirc.util import HitCounter

class AJAXException(Exception):
  pass
  
class PassthruException(Exception):
  pass
  
class AthemeEngine(resource.Resource):
  """Performs Atheme XMLRPC requests and sends result dicts back to the client.

  The result dict is identical in all cases, containing a "success"
  boolean value, and an "output" strings representing either the
  command's results or its failure message.

  """
  isLeaf = True
  
  def __init__(self, prefix):
    self.chanlists = {}
    self.prefix = prefix
    self.__total_hit = HitCounter()
    if config.athemeengine["xmlrpc_path"]:
      self.get_xmlrpc_conn()
    
    # Get an initial list.
    if config.athemeengine["chan_list_enabled"]:
      chanlist = self.do_list()
      if chanlist is not None:
        listtime = int(time.time())
        self.chanlists[listtime] = chanlist

  def get_xmlrpc_conn(self):
    """Get an XMLRPC connection to Atheme, replacing any previous connection."""
    try:
      self.conn = ServerProxy(config.athemeengine["xmlrpc_path"])
    except AttributeError:
      self.conn = None
  
  def do_xmlrpc(self, rpc, params):
    """Perform an XMLRPC request, running one Atheme command.

    Handles attempting to regain connection up to three times before
    giving up if the connection drops. "rpc" is the rpc function to run,
    and "params" is a tuple containing its parameters. Throws
    xmlrpclib.Fault if the given command fails to run.

    """
    trycount = 0
    while (trycount < 3):
      trycount += 1
      try:
        result = rpc(*params)
        return result
      except xmlrpclib.ProtocolError:
        self.get_xmlrpc_conn() 
    return None
  
  def do_list(self):
   """Request a channel list.

   Returns a list, or None for failure to retrieve the list (meaning a
   connection error or programming/configuration bug).

   """
   output = None
   try:
     output = self.do_xmlrpc(self.conn.atheme.command, ("*", "*", "0.0.0.0", "ALIS", "LIST", "*", "-maxmatches", "-1"))
   except xmlrpclib.Fault, e:
     output = None
   if output is None:
     return None

   chanlist = []

   for line in output.splitlines():
     lineitems = line.split(None, 2)

     # Ignore Atheme's textual lines.
     if lineitems[0] == "Returning" or lineitems[0] == "End":
       continue

     channel = { "name": lineitems[0], "users": int(lineitems[1]) }
     if len(lineitems) > 2:
       channel["topic"] = lineitems[2][1:]
     else:
       channel["topic"] = ""
     chanlist.append(channel)

   def chancmp(a, b):
     if a["users"] != b["users"]:
       return cmp(b["users"], a["users"])
     else:
       return cmp(a["name"].lower(), b["name"].lower())
   chanlist.sort(chancmp)

   return chanlist

  def render_POST(self, request):
    path = request.path[len(self.prefix):]
    if path[0] == "/":
      handler = self.COMMANDS.get(path[1:])
      if handler is not None:
        return handler(self, request)
        
    raise PassthruException, http_error.NoResource().render(request)

  def login(self, request):
    """Login via XMLRPC, getting an authentication token.

    Replies with a result dict for success or failure, or None to
    indicate connection failure.

    """
    user = request.args.get("u")
    if user is None:
      raise AJAXException, "No username specified."
    password = request.args.get("p")
    if password is None:
      raise AJAXException, "No password specified."

    self.__total_hit()
   
    response = None
    try:
      result = { "success": True, "output": None }
      result["output"] = self.do_xmlrpc(self.conn.atheme.login, (user[0],
          password[0]))
      if result["output"] is not None:
        response = json.dumps(result)
      else:
        response = json.dumps(None)
    except xmlrpclib.Fault, e:
      result = { "success": False, "output": e.faultString }
      response = json.dumps(result)

    request.write(response) 
    request.finish() 
    return True 
 
  def logout(self, request):
    """Log out, invalidating the request's authentication token.

    Replies with a result dict for success or failure, which normally
    means these details are already invalid and thus "logged out", and
    None for connection failure.

    """
    user = request.args.get("u")
    if user is None:
      raise AJAXException, "No username specified."
    token = request.args.get("t")
    if token is None:
      raise AJAXException, "No token specified."

    self.__total_hit()
  
    response = None
    try:
      result = { "success": True, "output": None }
      result["output"] = self.do_xmlrpc(self.conn.atheme.logout, (token[0], user[0]))
      if result["output"] is not None:
        response = json.dumps(result)
      else:
        response = json.dumps(None)
    except xmlrpclib.Fault, e:
      result = { "success": False, "output": e.faultString }
      response = json.dumps(result)

    request.write(response) 
    request.finish() 
    return True 

  def command(self, request):
    """Run an arbitrary command, with an optional user and authentication token.

    Replies with a result dict for success or failure, and None to
    indicate connection failure.

    """
    user = request.args.get("u")
    if user is None:
      user = ["*"]
    token = request.args.get("t")
    if token is None:
      token = ["*"]

    service = request.args.get("s")
    if service is None:
      raise AJAXException, "No command specified."
    command = request.args.get("c")
    if command is None:
      raise AJAXException, "No command specified."
    params = request.args.get("p")
    if params is None:
      params = []
    
    self.__total_hit()
    
    response = None
    try:
      result = { "success": True, "output": None }
      result["output"] = self.do_xmlrpc(self.conn.atheme.command, (token[0], user[0], "0.0.0.0", service[0], command[0]) + tuple(params))
      if result["output"] is not None:
        response = json.dumps(result)
      else:
        response = json.dumps(None)
    except xmlrpclib.Fault, e:
      result = { "success": False, "output": e.faultString }
      response = json.dumps(result)

    request.write(response)
    request.finish()
    return True

  def list(self, request):
    """Request a channel list, with a start point, length, masks, and ts.

    Optionally permits a timestamp to be provided. Replies with a dict
    containing channel info for success, a result dict for failure, and
    None to indicate connection failure.

    """
    if not config.athemeengine["chan_list_enabled"]:
      response = json.dumps(None)
      request.write(response)
      request.finish()
      return True

    start = request.args.get("s")
    if start is None:
      raise AJAXException, "No start point specified."
    start = int(start[0])
    if start < 0:
      start = 0

    length = request.args.get("l")
    if length is None:
      raise AJAXException, "No length specified."
    length = int(length[0])

    chanmask = request.args.get("cm")
    if chanmask is not None:
      chanmask = chanmask[0].lower()
    else:
      chanmask = "*"

    topicmask = request.args.get("tm")
    if topicmask is not None:
      topicmask = topicmask[0].lower()
    else:
      topicmask = "*"

    listtime = request.args.get("t")
    if listtime is not None:
      listtime = int(listtime[0])
    else:
      listtime = 0
    
    self.__total_hit()
    
    result = { "success": True, "list": None, "total": 0, "ts": 0 }

    if listtime != 0 and listtime in self.chanlists:
      chanlist = self.chanlists[listtime]
    else:
      most_recent = None
      if (len(self.chanlists) > 0):
        most_recent = max(self.chanlists.keys())
      now = int(time.time())
      if (most_recent is not None and
          now - most_recent <= config.athemeengine["chan_list_max_age"]):
        chanlist = self.chanlists[most_recent]
        listtime = most_recent
      else:
        if (len(self.chanlists) >= config.athemeengine["chan_list_count"]):
          del self.chanlists[min(self.chanlists.keys())]
        chanlist = self.do_list()
        if chanlist is not None:
          listtime = int(time.time())
          self.chanlists[listtime] = chanlist
        else:
          if most_recent in self.chanlists:
            chanlist = self.chanlists[most_recent]
            listtime = most_recent
          else:
            response = json.dumps(None)
            request.write(response)
            request.finish()
            return True

    if chanmask == "*" and topicmask == "*":
      if start > len(chanlist):
        start = len(chanlist)
      if start+length > len(chanlist):
        length = len(chanlist) - start
      if length > 0:
        result["list"] = chanlist[start:start+length]
      else:
        result["list"] = []
      result["total"] = len(chanlist)

    else:
      chanmask = "*" + chanmask + "*"
      topicmask = "*" + topicmask + "*"
      skipped = 0
      total = 0
      filtered_chanlist = []

      for channel in chanlist:
        if not fnmatch.fnmatchcase(channel["name"].lower(), chanmask):
          continue
        if not fnmatch.fnmatchcase(channel["topic"].lower(), topicmask):
          continue
        total += 1
        if (skipped < start):
          skipped += 1
          continue
        if (total - skipped < length):
          filtered_chanlist.append(channel)

      result["list"] = filtered_chanlist
      result["total"] = total

    result["ts"] = listtime
    response = json.dumps(result)
    request.write(response)
    request.finish()
    return True

  
  @property
  def adminEngine(self):
    return {
      "Total hits": [(self.__total_hit,)],
    }
    
  COMMANDS = dict(l=login, o=logout, c=command, li=list)
