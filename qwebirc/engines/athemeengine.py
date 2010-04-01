from twisted.web import resource, server, static, error as http_error
import simplejson, md5, sys, os, time, config, qwebirc.config_options as config_options, traceback, socket
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
    
  def render_POST(self, request):
    path = request.path[len(self.prefix):]
    if path[0] == "/":
      handler = self.COMMANDS.get(path[1:])
      if handler is not None:
        return handler(self, request)
        
    raise PassthruException, http_error.NoResource().render(request)

  def login(self, request):
    user = request.args.get("u")
    if user is None:
      raise AJAXException, "No username specified."
    password = request.args.get("p")
    if password is None:
      raise AJAXException, "No password specified."
    self.__total_hit()
   
    response = simplejson.dumps("notacookie")
    request.write(response) 
    request.finish() 
    return True 
 
  def checkToken(self, request):
    token = request.args.get("t")
    if token is None:
      raise AJAXException, "No token specified."
    self.__total_hit()
    
    return True
  
  @property
  def adminEngine(self):
    return {
      "Total hits": [(self.__total_hit,)],
    }
    
  COMMANDS = dict(l=login, c=checkToken)
