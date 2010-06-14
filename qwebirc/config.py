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
                raise ConfigParser.NoOptionError(section + "::" + option)

        for opt_section, option in options.floats:
            if opt_section == section and option not in sections[section]:
                raise ConfigParser.NoOptionError(section + "::" + option)

        for opt_section, option in options.integers:
            if opt_section == section and option not in sections[section]:
                raise ConfigParser.NoOptionError(section + "::" + option)

        for opt_section, option in options.lists:
            if opt_section == section and option not in sections[section]:
                raise ConfigParser.NoOptionError(section + "::" + option)

        for opt_section, option in options.strings:
            if opt_section == section and option not in sections[section]:
                raise ConfigParser.NoOptionError(section + "::" + option)

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
