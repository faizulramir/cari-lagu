require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes } = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID; // optional
if (!TOKEN || !CLIENT_ID) {
  console.error('Missing DISCORD_TOKEN or CLIENT_ID in .env');
  process.exit(1);
}

const body = [];
for (const file of fs.readdirSync(path.join(__dirname, 'commands')).filter(f => f.endsWith('.js'))) {
  const cmd = require(path.join(__dirname, 'commands', file));
  if (cmd?.data) body.push(cmd.data.toJSON());
  if (cmd?.resume?.data) body.push(cmd.resume.data.toJSON()); // legacy guard
}
console.log(`Deploying ${body.length} commands:`, body.map(c => c.name).join(', '));

const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  if (GUILD_ID) {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body });
    console.log(`Deployed ${body.length} GUILD commands to ${GUILD_ID} (instant).`);
  } else {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body });
    console.log(`Deployed ${body.length} GLOBAL commands (may take up to 1h to appear).`);
  }
})().catch(e => { console.error(e); process.exit(1); });
