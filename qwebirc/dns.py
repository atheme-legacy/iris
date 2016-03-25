from twisted.names import client
from twisted.internet import defer

from socket import inet_ntop, AF_INET, AF_INET6
from ipaddress import ip_address

class LookupException(Exception): pass
class VerificationException(Exception): pass


def lookupAndVerifyPTR(ip, *args, **kwargs):

  d = defer.Deferred()

  ipobj = ip_address(unicode(ip))

  if ipobj.version == 4:
    ipver = AF_INET
  else:
    ipver = AF_INET6

  def recvd_ptr(result):

    answer, auth, additional = result

    if len(answer) != 1:
      raise LookupException("Not exactly one answer in PTR response for %s" % ip)

    hostname = str(answer[0].payload.name)

    def recvd_addr(result):

      answers, auth, additional = result

      if not answers:
        raise LookupException("No answers in A/AAAA response for %s" % hostname)

      addresses = [ inet_ntop(ipver, answer.payload.address) for answer in answers ]

      if ip not in addresses:
        raise VerificationException("IP mismatch: %s is not in %s (%s)" % (ip, repr(addresses), hostname))

      d.callback(hostname)

    if ipobj.version == 4:
      client.lookupAddress(hostname, *args, **kwargs).addCallbacks(recvd_addr)
    else:
      client.lookupIPV6Address(hostname, *args, **kwargs).addCallbacks(recvd_addr)

  client.lookupPointer(ipobj.reverse_pointer, *args, **kwargs).addCallbacks(recvd_ptr)

  return d

if __name__ == "__main__":
  from twisted.internet import reactor
  import sys

  def callback(x):
    print("Lookup result: '%s' (confirmed)" % x)
    reactor.stop()

  def errback(x):
    x.printTraceback()
    reactor.stop()

  d = lookupAndVerifyPTR(sys.argv[1], timeout=[5.0])
  d.addCallbacks(callback, errback)

  reactor.run()
