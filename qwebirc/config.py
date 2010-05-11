import ConfigParser
import qwebirc.util.qjson as json

class ConfigException(Exception):
    pass

def load_config():
    config = ConfigParser.SafeConfigParser()
    config.read('iris.conf')

    for section in config.sections():
        if section in __base_globals:
            raise ConfigException("Configuration error: Invalid section \"" +
                    section + "\"");
        globals()[section] = {}
        for k, v in config.items(section):
            globals()[section][k] = v
    
    check_config()
    __interpret_config()


def check_config():
    required_sections = [
        "adminengine",
        "athemeengine",
        "execution",
        "feedbackengine",
        "irc",
        "proxy",
        "tunefront",
        "tuneback",
        "ui",
    ]

    for section in required_sections:
        if not section in globals():
            raise ConfigParser.NoSectionError(section)


def __interpret_config():
    list_options = [
        (adminengine, "hosts"),
        (execution, "syslog_addr"),
        (proxy, "forwarded_for_ips"),
    ]
    for section, option in list_options:
        if section[option] == "":
           section[option] = []
        else:
           section[option] = section[option].split(' ')

    integer_options = [
        (execution, "syslog_port"),
        (feedbackengine, "smtp_port"),
        (irc, "port"),
        (tuneback, "dns_timeout"),
        (tuneback, "http_ajax_request_timeout"),
        (tuneback, "http_request_timeout"),
        (tuneback, "maxbuflen"),
        (tuneback, "maxsubscriptions"),
    ]
    for section, option in integer_options:
        if section[option] == "":
           section[option] = 0
        else:
           section[option] = int(section[option])
    
    float_options = [
        (tuneback, "update_freq"),
    ]
    for section, option in float_options:
        if section[option] == "":
           section[option] = 0.0
        else:
           section[option] = float(section[option])

    boolean_options = [
        (ui, "random_nick"),
        (ui, "prompt"),
        (ui, "dedicated_msg_window"),
        (ui, "dedicated_notice_window"),
        (ui, "hide_joinparts"),
        (ui, "lastpos_line"),
        (ui, "nick_colors"),
    ]
    for section, option in boolean_options:
        if section[option] == "true" or section[option] == "yes":
            section[option] = True
        else:
            section[option] = False

    # An initial nick being specified overrides random_nick.
    if ui["initial_nick"] != "":
        ui["random_nick"] = False


def js_config():
    options = {
        'tunefront': tunefront,
        'ui': ui,
    }
    return json.dumps(options)


__base_globals = globals().keys()
load_config()
