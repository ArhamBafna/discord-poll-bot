const { EmbedBuilder } = require('discord.js');

const COLORS = {
    answer: '#5865F2', // Blurple
    success: '#2ECC71', // Green
    leaderboard: '#F1C40F', // Gold
    error: '#E74C3C', // Red
    info: '#3498DB' // Blue
};

function createSuccessEmbed(title, description = null, footer = null) {
    const embed = new EmbedBuilder().setColor(COLORS.success).setTitle(title);
    if (description) embed.setDescription(description);
    if (footer) embed.setFooter({ text: footer });
    return embed;
}

function createErrorEmbed(title, description = null) {
    const embed = new EmbedBuilder().setColor(COLORS.error).setTitle(title);
    if (description) embed.setDescription(description);
    return embed;
}

function createInfoEmbed(title, description = null) {
    const embed = new EmbedBuilder().setColor(COLORS.info).setTitle(title);
    if (description) embed.setDescription(description);
    return embed;
}

function createLeaderboardEmbed(title, description = null) {
    const embed = new EmbedBuilder().setColor(COLORS.leaderboard).setTitle(title);
    if (description) embed.setDescription(description);
    return embed;
}

function createAnswerEmbed(title, description = null) {
    const embed = new EmbedBuilder().setColor(COLORS.answer).setTitle(title);
    if (description) embed.setDescription(description);
    return embed;
}

// Pre-packaged reply helpers
async function replySuccess(interaction, title, description = null, footer = null) {
    const embed = createSuccessEmbed(title, description, footer);
    if (interaction.deferred || interaction.replied) {
        return interaction.editReply({ embeds: [embed] });
    }
    return interaction.reply({ embeds: [embed], ephemeral: true }); // By default ephemeral for commands?
    // Wait, the wording says "Success and failure replies use the shared helpers with unchanged wording."
    // Let's just wrap editReply and reply.
}

async function replyError(interaction, title, description = null) {
    const embed = createErrorEmbed(title, description);
    if (interaction.deferred || interaction.replied) {
        return interaction.editReply({ embeds: [embed] });
    }
    return interaction.reply({ embeds: [embed], ephemeral: true });
}

module.exports = {
    COLORS,
    createSuccessEmbed,
    createErrorEmbed,
    createInfoEmbed,
    createLeaderboardEmbed,
    createAnswerEmbed,
    replySuccess,
    replyError
};
