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
        "atheme",
        "athemeengine",
        "execution",
        "feedbackengine",
        "frontend",
        "irc",
        "proxy",
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
        (athemeengine, "chan_list_count"),
        (athemeengine, "chan_list_max_age"),
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
        (atheme, "enabled"),
        (atheme, "nickserv_login"),
        (atheme, "chan_list"),
        (atheme, "chan_list_on_start"),
        (athemeengine, "chan_list_enabled"),
        (frontend, "prompt"),
        (frontend, "chan_prompt"),
        (frontend, "chan_autoconnect"),
        (ui, "dedicated_msg_window"),
        (ui, "dedicated_notice_window"),
        (ui, "hide_joinparts"),
        (ui, "lastpos_line"),
        (ui, "nick_click_query"),
        (ui, "nick_colors"),
        (ui, "nick_status"),
    ]
    for section, option in boolean_options:
        if section[option] == "true" or section[option] == "yes":
            section[option] = True
        else:
            section[option] = False

    # If atheme::enabled is false, force every other Atheme integration option
    # off. Then, either way, remove "enabled"; it is only a meta-option.
    if atheme["enabled"] == False:
        for option in atheme:
            atheme[option] = False
    del atheme["enabled"]

    # If atheme::chan_list is off, force atheme::chan_list_on_start off.
    if atheme["chan_list"] == False:
        atheme["chan_list_on_start"] = False

    # If no secondary foreground colour was specified, use the primary.
    if not "fg_sec_color" in ui:
        ui["fg_sec_color"] = ui["fg_color"]


def js_config():
    options = {
        'atheme': atheme,
        'frontend': frontend,
        'ui': ui,
    }
    return json.dumps(options)


__base_globals = globals().keys()
load_config()
