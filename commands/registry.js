// --- Slash Command Registry ---
const { SlashCommandBuilder } = require('discord.js');

const { handleLeaderboard } = require('./user/leaderboard');
const { handleRank } = require('./user/rank');
const { handleHelp } = require('./user/help');
const { handlePoints } = require('./admin/points');
const { handleAsknow } = require('./admin/asknow');
const { handleRelinkpoll } = require('./admin/relinkpoll');
const { handleResolve } = require('./admin/resolve');
const { handleKnowledge } = require('./admin/knowledge');
const { handleSetCC } = require('./admin/setcc');
const { handleSetWelcome } = require('./admin/setwelcome');
const { handleSetControlRole } = require('./admin/setcontrolrole');
const { handleMilestones } = require('./admin/milestones');
const { handleSettings } = require('./admin/settings');
const { handleSetInvitePoints } = require('./admin/setinvitepoints');

const registry = [
    {
        builder: new SlashCommandBuilder().setName('leaderboard').setDescription('Displays the top 10 players on the server.'),
        handler: handleLeaderboard,
        adminOnly: false
    },
    {
        builder: new SlashCommandBuilder().setName('rank').setDescription("Shows your rank or a mentioned user's rank.")
            .addUserOption(option => option.setName('user').setDescription("The user to check the rank of (defaults to you).")),
        handler: handleRank,
        adminOnly: false
    },
    {
        builder: new SlashCommandBuilder().setName('help').setDescription('Shows the help message with all available commands.'),
        handler: handleHelp,
        adminOnly: false
    },
    {
        builder: new SlashCommandBuilder().setName('points').setDescription("Manually adjusts a user's score.")
            .addSubcommand(sub => sub.setName('add').setDescription('Adds points to a user.')
                .addUserOption(option => option.setName('user').setDescription('The user to modify.').setRequired(true))
                .addIntegerOption(option => option.setName('amount').setDescription('The number of points to add.').setRequired(true).setMinValue(1))
                .addStringOption(option => option.setName('message').setDescription('Optional reason for adding points.').setMaxLength(200)))
            .addSubcommand(sub => sub.setName('remove').setDescription('Removes points from a user.')
                .addUserOption(option => option.setName('user').setDescription('The user to modify.').setRequired(true))
                .addIntegerOption(option => option.setName('amount').setDescription('The number of points to remove.').setRequired(true).setMinValue(1)))
            .addSubcommand(sub => sub.setName('set').setDescription("Sets a user's points to an exact value.")
                .addUserOption(option => option.setName('user').setDescription('The user to modify.').setRequired(true))
                .addIntegerOption(option => option.setName('amount').setDescription('The exact score to set.').setRequired(true).setMinValue(0))),
        handler: handlePoints,
        adminOnly: true
    },
    {
        builder: new SlashCommandBuilder().setName('asknow').setDescription('Starts an on-demand trivia poll (does not award points).')
            .addStringOption(option => option.setName('topic').setDescription('An optional topic for the poll.')),
        handler: handleAsknow,
        adminOnly: true
    },
    {
        builder: new SlashCommandBuilder().setName('relinkpoll').setDescription("Fixes the bot's memory to track a poll that was deleted or missed.")
            .addStringOption(option => option.setName('message_id').setDescription('The ID of the poll message.').setRequired(true))
            .addIntegerOption(option => option.setName('correct_option').setDescription('The number of the correct option (e.g., 3 for C).').setRequired(true).setMinValue(1).setMaxValue(10)),
        handler: handleRelinkpoll,
        adminOnly: true
    },
    {
        builder: new SlashCommandBuilder().setName('resolve').setDescription('Resolve either an on-demand or daily poll.')
            .addStringOption(option => option.setName('poll').setDescription('Which poll flow to resolve.').setRequired(true)
                .addChoices(
                    { name: 'On-demand', value: 'on-demand' },
                    { name: 'Daily', value: 'daily' }
                )),
        handler: handleResolve,
        adminOnly: true
    },
    {
        builder: new SlashCommandBuilder().setName('knowledge').setDescription("Manage the bot's knowledge base topics.")
            .addSubcommand(sub => sub.setName('update').setDescription('Add or update a specific topic.')
                .addStringOption(option => option.setName('topic').setDescription('The topic/chapter to update.').setRequired(true).setAutocomplete(true)))
            .addSubcommand(sub => sub.setName('list').setDescription('List all topics in the knowledge base.'))
            .addSubcommand(sub => sub.setName('delete').setDescription('Delete a topic from the knowledge base.')
                .addStringOption(option => option.setName('topic').setDescription('The topic to delete.').setRequired(true))),
        handler: handleKnowledge,
        adminOnly: true
    },
    {
        builder: new SlashCommandBuilder().setName('setcc').setDescription("Sets the user to be CC'd in welcome messages.")
            .addUserOption(option => option.setName('user').setDescription('The user to CC.').setRequired(true)),
        handler: handleSetCC,
        adminOnly: true
    },
    {
        builder: new SlashCommandBuilder().setName('setwelcome').setDescription('Sets the welcome message template. Use {user}, {inviter}, {cc}, and {points_msg}.')
            .addStringOption(option => option.setName('template').setDescription('The message template.').setRequired(true)),
        handler: handleSetWelcome,
        adminOnly: true
    },
    {
        builder: new SlashCommandBuilder().setName('setcontrolrole').setDescription('Sets the role allowed to run administrative commands.')
            .addRoleOption(option => option.setName('role').setDescription('The administrative role.').setRequired(true)),
        handler: handleSetControlRole,
        adminOnly: true
    },
    {
        builder: new SlashCommandBuilder().setName('invitepoints').setDescription('Sets how many points are awarded per successful invite.')
            .addIntegerOption(option => option.setName('points').setDescription('Points awarded per invite.').setRequired(true).setMinValue(0).setMaxValue(100)),
        handler: handleSetInvitePoints,
        adminOnly: true
    },
    {
        builder: new SlashCommandBuilder().setName('milestones').setDescription('Manage role milestones for reaching specific point counts.')
            .addSubcommand(sub => sub.setName('add').setDescription('Adds a role milestone.')
                .addIntegerOption(option => option.setName('points').setDescription('The points required for the role.').setRequired(true).setMinValue(1))
                .addRoleOption(option => option.setName('role').setDescription('The role to assign.').setRequired(true)))
            .addSubcommand(sub => sub.setName('remove').setDescription('Removes a role milestone.')
                .addIntegerOption(option => option.setName('points').setDescription('The points count to remove.').setRequired(true).setMinValue(1))),
        handler: handleMilestones,
        adminOnly: true
    },
    {
        builder: new SlashCommandBuilder().setName('settings').setDescription('Displays the current bot configuration.'),
        handler: handleSettings,
        adminOnly: true
    }
];

module.exports = { registry };
