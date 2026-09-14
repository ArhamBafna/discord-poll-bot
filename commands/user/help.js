// --- /help Command Handler ---
const { createInfoEmbed } = require('../../lib/embeds');
const { ALLOWED_USERNAME, CONTROL_ROLE_NAME } = require('../../config');
const { registry } = require('../registry');

async function handleHelp(interaction) {
    // Only check permission to see if we should warn them, we still list all commands
    const embed = createInfoEmbed('Bot Commands', 'Here are the available commands:');
    
    for (const cmd of registry) {
        let name = \`/\${cmd.builder.name}\`;
        if (cmd.adminOnly) {
            name += ' (Admin)';
        }
        embed.addFields({ name: name, value: cmd.builder.description });
    }
    
    await interaction.reply({ embeds: [embed] });
}

module.exports = { handleHelp };
