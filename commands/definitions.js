// --- Slash Commands Setup ---
const { SlashCommandBuilder, Routes, REST } = require('discord.js');
const { DISCORD_BOT_TOKEN } = require('../config');

const commands = [
    new SlashCommandBuilder().setName('leaderboard').setDescription('Displays the top 10 players on the server.'),
    new SlashCommandBuilder().setName('rank').setDescription("Shows your rank or a mentioned user's rank.")
        .addUserOption(option => option.setName('user').setDescription("The user to check the rank of (defaults to you).")),
    new SlashCommandBuilder().setName('help').setDescription('Shows the help message with all available commands.'),
    // Admin commands
    new SlashCommandBuilder().setName('points').setDescription("Manually adjusts a user's score.")
        .addSubcommand(sub => sub.setName('add').setDescription('Adds points to a user.')
            .addUserOption(option => option.setName('user').setDescription('The user to modify.').setRequired(true))
            .addIntegerOption(option => option.setName('amount').setDescription('The number of points to add.').setRequired(true).setMinValue(1)))
        .addSubcommand(sub => sub.setName('remove').setDescription('Removes points from a user.')
            .addUserOption(option => option.setName('user').setDescription('The user to modify.').setRequired(true))
            .addIntegerOption(option => option.setName('amount').setDescription('The number of points to remove.').setRequired(true).setMinValue(1)))
        .addSubcommand(sub => sub.setName('set').setDescription("Sets a user's points to an exact value.")
            .addUserOption(option => option.setName('user').setDescription('The user to modify.').setRequired(true))
            .addIntegerOption(option => option.setName('amount').setDescription('The exact score to set.').setRequired(true).setMinValue(0))),
    new SlashCommandBuilder().setName('asknow').setDescription('Starts an on-demand trivia poll (does not award points).')
        .addStringOption(option => option.setName('topic').setDescription('An optional topic for the poll.')),
    new SlashCommandBuilder().setName('reveal').setDescription('Reveals the answer for the active on-demand poll.'),
    new SlashCommandBuilder().setName('postdaily').setDescription('Manually triggers the daily poll sequence.'),
    new SlashCommandBuilder().setName('relinkpoll').setDescription("Fixes the bot's memory to track a poll that was deleted or missed.")
        .addStringOption(option => option.setName('message_id').setDescription('The ID of the poll message.').setRequired(true))
        .addIntegerOption(option => option.setName('correct_option').setDescription('The number of the correct option (e.g., 3 for C).').setRequired(true).setMinValue(1).setMaxValue(10)),
    new SlashCommandBuilder().setName('resolve').setDescription('Manually resolves the last-known poll.'),
    new SlashCommandBuilder().setName('update-knowledge').setDescription("Update the bot's knowledge base for answering questions.")
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN);

module.exports = { commands, rest };
