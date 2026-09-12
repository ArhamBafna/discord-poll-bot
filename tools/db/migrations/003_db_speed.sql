-- Database speed (ticket-03): index so past-question recall and history
-- pruning use an index scan instead of a full-table scan.
CREATE INDEX IF NOT EXISTS idx_question_history_guild_created
    ON question_history (guild_id, created_at DESC, id DESC);
