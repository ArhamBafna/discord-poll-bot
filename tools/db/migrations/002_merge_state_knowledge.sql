-- Merge state + knowledge_base into kv_store (ticket-02).
-- Knowledge rows stay plain text. Settings rows are serialized per the codec
-- registry in database/codecs.js. Old JSONB values that were double-encoded
-- (a JSON string holding JSON) are unwrapped one level on the way in.
-- Null settings rows are skipped so read-time defaults apply.

CREATE TABLE IF NOT EXISTS kv_store (
    guild_id VARCHAR(255) NOT NULL,
    key VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
    PRIMARY KEY (guild_id, key)
);

-- Plain-text settings keys: stored JSON strings become plain text.
INSERT INTO kv_store (guild_id, key, value)
SELECT guild_id, key, (value #>> '{}')
FROM state
WHERE key IN ('ccUser', 'welcomeTemplate', 'controlRole',
              'lastEngagementPostGeneral', 'lastEngagementPostTeam')
  AND value IS NOT NULL
  AND jsonb_typeof(value) = 'string'
ON CONFLICT (guild_id, key) DO NOTHING;

-- JSON settings keys: objects/arrays/numbers stay JSON text;
-- double-encoded strings are unwrapped one level.
INSERT INTO kv_store (guild_id, key, value)
SELECT guild_id, key,
       CASE WHEN jsonb_typeof(value) = 'string'
            THEN (value #>> '{}')
            ELSE (value::text)
       END
FROM state
WHERE key IN ('lastPollData', 'activeOnDemandPoll', 'lastSuccessfulPoll',
              'lastWeeklyLeaderboard', 'roleMilestones', 'inviteRewardPoints')
  AND value IS NOT NULL
ON CONFLICT (guild_id, key) DO NOTHING;

-- Knowledge topics copy over unchanged as plain text.
INSERT INTO kv_store (guild_id, key, value)
SELECT guild_id, key, value
FROM knowledge_base
ON CONFLICT (guild_id, key) DO NOTHING;

DROP TABLE IF EXISTS state;
DROP TABLE IF EXISTS knowledge_base;
