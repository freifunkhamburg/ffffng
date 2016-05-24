CREATE TABLE node_state (
    id INTEGER PRIMARY KEY,

    mac VARCHAR(17) NOT NULL UNIQUE,

    state VARCHAR(10) NOT NULL,
    last_seen DATETIME NOT NULL,

    import_timestamp DATETIME NOT NULL,

    last_status_mail_send DATETIME,

    created_at DATETIME DEFAULT (strftime('%s','now')) NOT NULL,
    modified_at DATETIME DEFAULT (strftime('%s','now')) NOT NULL
);
