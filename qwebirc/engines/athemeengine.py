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
  isLeaf = True
  
  def __init__(self, prefix):
    self.prefix = prefix
    self.__total_hit = HitCounter()
    self.get_xmlrpc_conn()

  def get_xmlrpc_conn(self):
    self.conn = ServerProxy(config_options.XMLRPC_PATH)
  
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

    Replies with either a valid token, or " " to indicate a login failure.

    """
    user = request.args.get("u")
    if user is None:
      raise AJAXException, "No username specified."
    password = request.args.get("p")
    if password is None:
      raise AJAXException, "No password specified."

    self.__total_hit()
   
    token = None
    try:
      token = self.do_xmlrpc(self.conn.atheme.login, (user[0], password[0]))
    except xmlrpclib.Fault:
      token = " "
    response = simplejson.dumps(token)

    request.write(response) 
    request.finish() 
    return True 
 
  def checkToken(self, request):
    """Check if an authentication token is still valid.

    Replies with True for yes, and False for no.

    """
    user = request.args.get("u")
    if user is None:
      raise AJAXException, "No username specified."
    token = request.args.get("t")
    if token is None:
      raise AJAXException, "No token specified."

    self.__total_hit()
    
    response = [False]
    try:
      self.do_xmlrpc(self.conn.atheme.command, (token[0], user[0], "0.0.0.0",
          "NickServ", "INFO", user[0]))
      response[0] = simplejson.dumps(True)
    except xmlrpclib.Fault:
      response[0] = simplejson.dumps(False)

    request.write(response[0])
    request.finish()
    return True

  def logout(self, request):
    """Log out, invalidating the request's authentication token.

    Replies with True for a successful logout, False for already being
    logged out, and None for connection failure.

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
      self.do_xmlrpc(self.conn.atheme.logout, (user[0], token[0]))
      response = simplejson.dumps(True);
    except xmlrpclib.Fault:
      response = simplejson.dumps(False);

    request.write(response) 
    request.finish() 
    return True 
  
  @property
  def adminEngine(self):
    return {
      "Total hits": [(self.__total_hit,)],
    }
    
  COMMANDS = dict(l=login, c=checkToken, o=logout)
