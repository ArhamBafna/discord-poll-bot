# Message Chat and AI Conversation

> 25 nodes · cohesion 0.11

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

- [AskNow AI Poll Generation](AskNow_AI_Poll_Generation.md) (4 shared connections)
- [Settings and Welcome Templates](Settings_and_Welcome_Templates.md) (2 shared connections)
- [Discord Client and Event Wiring](Discord_Client_and_Event_Wiring.md) (2 shared connections)
- [Custom Content and Rank Commands](Custom_Content_and_Rank_Commands.md) (1 shared connections)
- [Settings Codec Serialization](Settings_Codec_Serialization.md) (1 shared connections)
- [Configuration Loading and Validation](Configuration_Loading_and_Validation.md) (1 shared connections)
- [Expiring Map Utility](Expiring_Map_Utility.md) (1 shared connections)

## Source Files

- `handlers/message.js`
- `services/ai/generation.js`

## Audit Trail

- EXTRACTED: 43 (93%)
- INFERRED: 3 (7%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*