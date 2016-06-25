-- sqlite only supports a limited subset of ALTER TABLE, thus this workaround

ALTER TABLE node_state RENAME TO tmp_node_state;

CREATE TABLE node_state (
    id INTEGER PRIMARY KEY,

    mac VARCHAR(17) NOT NULL UNIQUE,

    state VARCHAR(10) NOT NULL,
    last_seen DATETIME NOT NULL,

    import_timestamp DATETIME NOT NULL,

    last_status_mail_sent DATETIME,
    last_status_mail_type VARCHAR(20),

    created_at DATETIME DEFAULT (strftime('%s','now')) NOT NULL,
    modified_at DATETIME DEFAULT (strftime('%s','now')) NOT NULL
);

INSERT INTO node_state(
    id,
    mac,
    state,
    last_seen,
    import_timestamp,
    last_status_mail_sent,
    last_status_mail_type,
    created_at,
    modified_at
)
SELECT
    id,
    mac,
    state,
    last_seen,
    import_timestamp,
    last_status_mail_send,
    last_status_mail_type,
    created_at,
    modified_at
FROM tmp_node_state;

DROP TABLE tmp_node_state;
