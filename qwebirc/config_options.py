# Set configuration option lists.

sections = [
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

booleans = [
    ("atheme", "enabled"),
    ("atheme", "nickserv_login"),
    ("atheme", "chan_list"),
    ("atheme", "chan_list_on_start"),
    ("athemeengine", "chan_list_enabled"),
    ("frontend", "prompt"),
    ("frontend", "chan_prompt"),
    ("frontend", "chan_autoconnect"),
    ("ui", "dedicated_msg_window"),
    ("ui", "dedicated_notice_window"),
    ("ui", "hide_joinparts"),
    ("ui", "lastpos_line"),
    ("ui", "nick_click_query"),
    ("ui", "nick_colors"),
    ("ui", "nick_status"),
]
    
floats = [
    ("tuneback", "update_freq"),
]

integers = [
    ("athemeengine", "chan_list_count"),
    ("athemeengine", "chan_list_max_age"),
    ("execution", "syslog_port"),
    ("feedbackengine", "smtp_port"),
    ("irc", "port"),
    ("tuneback", "dns_timeout"),
    ("tuneback", "http_ajax_request_timeout"),
    ("tuneback", "http_request_timeout"),
    ("tuneback", "maxbuflen"),
    ("tuneback", "maxsubscriptions"),
]

lists = [
    ("adminengine", "hosts"),
    ("execution", "syslog_addr"),
    ("proxy", "forwarded_for_ips"),
]

strings = [
    ("athemeengine", "xmlrpc_path"),
    ("execution", "args"),
    ("execution", "syslog_addr"),
    ("feedbackengine", "from"),
    ("feedbackengine", "to"),
    ("frontend", "base_url"),
    ("frontend", "network_name"),
    ("frontend", "app_title"),
    ("frontend", "initial_nick"),
    ("frontend", "initial_chans"),
    ("frontend", "static_base_url"),
    ("frontend", "dynamic_base_url"),
    ("proxyengine", "forwarded_for_header"),
    ("irc", "server"),
    ("irc", "realname"),
    ("irc", "ident"),
    ("irc", "ident_string"),
    ("irc", "webirc_mode"),
    ("irc", "webirc_password"),
    ("ui", "fg_color"),
    ("ui", "fg_sec_color"),
    ("ui", "bg_color"),
]
