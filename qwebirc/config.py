import ConfigParser
import qwebirc.util.qjson as json

def load_config():
    config = ConfigParser.SafeConfigParser()
    config.read('iris.conf')
    for section in config.sections():
        globals()[section] = {}
        for k, v in config.items(section):
            globals()[section][k] = v

def js_config():
    options = {
        'ui': ui,
        'tunefront': tunefront,
    }
    return json.dumps(options)

load_config()
