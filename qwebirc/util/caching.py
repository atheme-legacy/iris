from wsgiref.handlers import format_date_time as format_date
from datetime import date, timedelta
from time import mktime

'''
   Sets the cache headers for a (static resource) request
'''
def cache(request, expires=30, public=True):
    #set expires header
    expiry = (date.today() + timedelta(expires)).timetuple()
    request.responseHeaders.setRawHeaders("expires" , [format_date(mktime(expiry))])
 
    #set cache control
    cache_control = "max-age=" + str(int(60*60*24*expires))
    if public:
        cache_control += ", public"
    else:
        cache_control += ", private"
    request.responseHeaders.setRawHeaders("cache-control", [cache_control])
 
    print dir(request)

    return request