from twisted.web import resource, server, static, error as http_error
from xmlrpclib import ServerProxy
import simplejson, md5, sys, os, time, config, qwebirc.config_options as config_options, traceback, socket, xmlrpclib
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
    self.prefix = prefix
    self.__total_hit = HitCounter()
    self.get_xmlrpc_conn()

  def get_xmlrpc_conn(self):
    """Get an XMLRPC connection to Atheme, replacing any previous connection."""
    self.conn = ServerProxy(config.XMLRPC_PATH)
  
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
        get_xmlrpc_conn() 
    return None
  
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
        response = simplejson.dumps(result)
      else:
        response = simplejson.dumps(None)
    except xmlrpclib.Fault, e:
      result = { "success": False, "output": e.faultString }
      response = simplejson.dumps(result)

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
      result["output"] = self.do_xmlrpc(self.conn.atheme.logout, (user[0], token[0]))
      if result["output"] is not None:
        response = simplejson.dumps(result)
      else:
        response = simplejson.dumps(None)
    except xmlrpclib.Fault, e:
      result = { "success": False, "output": e.faultString }
      response = simplejson.dumps(result)

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
      user = ""
    token = request.args.get("t")
    if token is None:
      token = ""

    service = request.args.get("s")
    if service is None:
      raise AJAXException, "No command specified."
    command = request.args.get("c")
    if command is None:
      raise AJAXException, "No command specified."
    params = request.args.get("p")
    if params is None:
      params = ""
    
    self.__total_hit()
    
    response = None
    try:
      result = { "success": True, "output": None }
      result["output"] = self.do_xmlrpc(self.conn.atheme.command, (token[0], user[0],
          "0.0.0.0", service[0], command[0], params[0]))
      if result["output"] is not None:
        response = simplejson.dumps(result)
      else:
        response = simplejson.dumps(None)
    except xmlrpclib.Fault, e:
      result = { "success": False, "output": e.faultString }
      response = simplejson.dumps(result)

    request.write(response)
    request.finish()
    return True
  
  @property
  def adminEngine(self):
    return {
      "Total hits": [(self.__total_hit,)],
    }
    
  COMMANDS = dict(l=login, o=logout, c=command)
