const fs = require('fs');
const path = require('path');

function loadCommands(client) {
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);

    // Check if the file is a command
    if (fs.lstatSync(filePath).isFile()) {
        const command = require(filePath);

        // Set a new item in the Collection with the key as the command name and the value as the exported module
        client.commands.set(command.data.name, command);

              // Ensure the command has a data object and an execute function
      if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
      } else {
        console.error(`Command at ${filePath} is missing required properties.`);
      }
    }
  }
}

module.exports = { loadCommands };
