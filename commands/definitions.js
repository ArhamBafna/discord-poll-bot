// --- Slash Commands Setup ---
const { REST, Routes } = require('discord.js');
const { DISCORD_BOT_TOKEN } = require('../config');
const { registry } = require('./registry');

const commands = registry.map(cmd => cmd.builder.toJSON());
const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN);

module.exports = { commands, rest };
