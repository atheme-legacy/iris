import os
import ConfigParser
import qwebirc.util.qjson as json
import config_options as options


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
    
    check_config(True)


def check_config(interpret):
    sections = globals()
    for section in options.sections:
        if not section in sections:
            raise ConfigParser.NoSectionError(section)

        for opt_section, option in options.booleans:
            if opt_section == section and option not in sections[section]:
                raise ConfigParser.NoOptionError(option, section)

        for opt_section, option in options.floats:
            if opt_section == section and option not in sections[section]:
                raise ConfigParser.NoOptionError(option, section)

        for opt_section, option in options.integers:
            if opt_section == section and option not in sections[section]:
                raise ConfigParser.NoOptionError(option, section)

        for opt_section, option in options.lists:
            if opt_section == section and option not in sections[section]:
                raise ConfigParser.NoOptionError(option, section)

        for opt_section, option in options.strings:
            if opt_section == section and option not in sections[section]:
                raise ConfigParser.NoOptionError(option, section)

    if interpret:
        __interpret_config()


def __interpret_config():

    sections = globals()

    for section, option in options.booleans:
        if sections[section][option] == "true" or \
                sections[section][option] == "yes":
            sections[section][option] = True
        else:
            sections[section][option] = False

    for section, option in options.floats:
        if sections[section][option] == "":
            sections[section][option] = 0.0
        else:
            sections[section][option] = float(sections[section][option])

    for section, option in options.integers:
        if sections[section][option] == "":
            sections[section][option] = 0
        else:
            sections[section][option] = int(sections[section][option])
    
    for section, option in options.lists:
        if sections[section][option] == "":
            sections[section][option] = []
        else:
            sections[section][option] = sections[section][option].split(' ')

    # If athemeengine::xmlrpc_path is unset, force all Atheme integration
    # options off in the frontend.
    if athemeengine["xmlrpc_path"] == "":
        for option in atheme:
            if option == "nickserv_login":
                # Special case: nickserv login will fall back to SASL PLAIN
                # instead of being completely unavailable without XML-RPC.
                continue
            atheme[option] = False

        # No XML-RPC connection, fall back to SASL PLAIN.
        atheme["sasl_type"] = "PLAIN"
    else:
        # Set atheme::chan_list so the frontend is aware of whether channel lists
        # are enabled.
        atheme["chan_list"] = athemeengine["chan_list_enabled"]

        # If atheme::chan_list is off, force atheme::chan_list_on_start off.
        if atheme["chan_list"] == False:
            atheme["chan_list_on_start"] = False

        # XML-RPC support is present. Use SASL AUTHCOOKIE.
        atheme["sasl_type"] = "AUTHCOOKIE"

    # There's no SASL type if login is disabled...
    if atheme["nickserv_login"] == False:
        atheme["sasl_type"] = False

    # If no secondary foreground colour was specified, use the primary.
    if not "fg_sec_color" in ui:
        ui["fg_sec_color"] = ui["fg_color"]

    # If there is no privacy policy, set a setting to indicate this to the
    # frontend, disabling the privacy policy pane.
    if not os.access("static/panes/privacypolicy.html", os.F_OK):
        ui["privacy"] = False
    else:
        ui["privacy"] = True

    if irc["ssl"]:
        try:
            from twisted.internet.ssl import ClientContextFactory
        except ImportError:
            raise ConfigException("Configuration error: SSL support not installed")


def js_config():
    f = frontend.copy()
    del f["extra_html"] # already injected by pagegen.
    options = {
        'atheme': atheme,
        'frontend': f,
        'ui': ui,
        'flash': flash,
    }
    return json.dumps(options)


__base_globals = globals().keys()
load_config()
