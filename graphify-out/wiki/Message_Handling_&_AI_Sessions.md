# Message Handling & AI Sessions

> 25 nodes

## Key Concepts

- **message.js** (32 connections) — `handlers/message.js`
- **handleMessageCreate()** (10 connections) — `handlers/message.js`
- **generateChatResponseWithRetries()** (4 connections) — `services/ai/generation.js`
- **getSessionKey()** (3 connections) — `handlers/message.js`
- **hasActiveSession()** (3 connections) — `handlers/message.js`
- **markActiveSession()** (3 connections) — `handlers/message.js`
- **buildConversationHistory()** (3 connections) — `services/ai/generation.js`
- **buildAiContents()** (2 connections) — `handlers/message.js`
- **computeProactiveRelevanceScore()** (2 connections) — `handlers/message.js`
- **isLikelySessionFollowUp()** (2 connections) — `handlers/message.js`
- **isNoReplySignal()** (2 connections) — `handlers/message.js`
- **activeUserSessions** (1 connections) — `handlers/message.js`
- **{ ALLOWED_USERNAME }** (1 connections) — `handlers/message.js`
- **BROAD_KEYWORDS** (1 connections) — `handlers/message.js`
- **{ buildConversationHistory, generateChatResponseWithRetries }** (1 connections) — `handlers/message.js`
- **channelOverloadState** (1 connections) — `handlers/message.js`
- **dbOperations** (1 connections) — `handlers/message.js`
- **ExpiringMap** (1 connections) — `handlers/message.js`
- **HIGH_INTENT_KEYWORDS** (1 connections) — `handlers/message.js`
- **MEDIUM_INTENT_KEYWORDS** (1 connections) — `handlers/message.js`
- **passiveJumps** (1 connections) — `handlers/message.js`
- **QUESTION_INTENT_SIGNALS** (1 connections) — `handlers/message.js`
- **serviceHelpers** (1 connections) — `handlers/message.js`
- **stateManager** (1 connections) — `handlers/message.js`
- **userCooldowns** (1 connections) — `handlers/message.js`

## Relationships

- [generation.js](generation.js.md) (5 shared connections)
- [index.js](index.js.md) (2 shared connections)
- [manager.js](manager.js.md) (2 shared connections)
- [operations.js](operations.js.md) (1 shared connections)
- [config/index.js](config-index.js.md) (1 shared connections)
- [ExpiringMap](ExpiringMap.md) (1 shared connections)

## Source Files

- `handlers/message.js`
- `services/ai/generation.js`

## Audit Trail

- EXTRACTED: 43 (93%)
- INFERRED: 3 (7%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*