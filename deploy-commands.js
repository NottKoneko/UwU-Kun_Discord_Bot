require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Load variables directly from process.env
const clientId = process.env.CLIENT_ID;
const token = process.env.TOKEN;

// Log to check if variables are loaded correctly
console.log('Client ID:', clientId);
console.log('Token:', token ? 'Loaded' : 'Not loaded');

if (!clientId || !token) {
  console.error('Missing CLIENT_ID or TOKEN. Check your .env file.');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Started refreshing global application (/) commands.');

    // Use the global commands route for deployment
    await rest.put(
      Routes.applicationCommands(clientId), // Correct route for global commands
      { body: commands },
    );

    console.log('Successfully reloaded global application (/) commands.');
  } catch (error) {
    console.error('Error deploying commands globally:', error);
  }
})();