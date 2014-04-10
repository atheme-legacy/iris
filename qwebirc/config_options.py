# Set configuration option lists.

sections = [
    "adminengine",
    "atheme",
    "athemeengine",
    "execution",
    "feedbackengine",
    "frontend",
    "flash",
    "websocket",
    "irc",
    "proxy",
    "tuneback",
    "ui",
]

booleans = [
    ("atheme", "nickserv_login"),
    ("atheme", "chan_list_cloud_view"),
    ("atheme", "chan_list_on_start"),
    ("athemeengine", "chan_list_enabled"),
    ("frontend", "prompt"),
    ("frontend", "chan_prompt"),
    ("frontend", "chan_autoconnect"),
    ("irc", "ssl"),
    ("ui", "dedicated_msg_window"),
    ("ui", "dedicated_notice_window"),
    ("ui", "hide_joinparts"),
    ("ui", "lastpos_line"),
    ("ui", "nick_click_query"),
    ("ui", "nick_colors"),
    ("ui", "nick_status"),
    ("ui", "flash_on_mention"),
    ("ui", "beep_on_mention"),
    ("ui", "simple_color"),
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
    ("tuneback", "maxlinelen"),
    ("tuneback", "maxsubscriptions"),
    ("flash", "port"),
    ("flash", "xmlport"),
]

lists = [
    ("adminengine", "hosts"),
    ("execution", "syslog_addr"),
    ("proxy", "forwarded_for_ips"),
    ("frontend", "connections"),
]

strings = [
    ("athemeengine", "xmlrpc_path"),
    ("execution", "args"),
    ("feedbackengine", "from"),
    ("feedbackengine", "to"),
    ("frontend", "base_url"),
    ("frontend", "network_name"),
    ("frontend", "app_title"),
    ("frontend", "extra_html"),
    ("frontend", "initial_nick"),
    ("frontend", "initial_chans"),
    ("frontend", "static_base_url"),
    ("frontend", "dynamic_base_url"),
    ("proxy", "forwarded_for_header"),
    ("irc", "server"),
    ("irc", "bind_ip"),
    ("irc", "realname"),
    ("irc", "ident"),
    ("irc", "ident_string"),
    ("irc", "webirc_mode"),
    ("irc", "webirc_password"),
    ("ui", "fg_color"),
    ("ui", "fg_sec_color"),
    ("ui", "bg_color"),
    ("flash", "server"),
    ("websocket", "url"),
]
