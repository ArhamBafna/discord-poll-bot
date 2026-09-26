// --- /help Command Handler ---
const { createInfoEmbed } = require('../../lib/embeds');

function formatOptionUsage(option) {
    return option.required ? `<${option.name}>` : `[${option.name}]`;
}

function formatCommandHelp(cmd) {
    const data = cmd.builder.toJSON();
    const subcommands = (data.options || []).filter(opt => opt.type === 1);
    let name = `/${data.name}`;
    if (cmd.adminOnly) {
        name += ' (Admin)';
    }

    const lines = [data.description];

    if (subcommands.length > 0) {
        for (const sub of subcommands) {
            const params = (sub.options || []).map(formatOptionUsage).join(' ');
            const usage = `/${data.name} ${sub.name}${params ? ' ' + params : ''}`;
            lines.push(`• **${usage}** - ${sub.description}`);
        }
    } else {
        const params = (data.options || []).map(formatOptionUsage).join(' ');
        if (params) {
            lines.push(`Usage: **/${data.name} ${params}**`);
        }
    }

    return {
        name,
        value: lines.join('\n')
    };
}

function buildHelpEmbed(commandRegistry) {
    const embed = createInfoEmbed('Bot Commands', 'Here are the available commands:');
    const list = commandRegistry || require('../registry').registry;

    for (const cmd of list) {
        embed.addFields(formatCommandHelp(cmd));
    }

    return embed;
}

async function handleHelp(interaction) {
    const embed = buildHelpEmbed();
    await interaction.reply({ embeds: [embed] });
}

module.exports = {
    handleHelp,
    buildHelpEmbed,
    formatCommandHelp
};
