import * as fs from 'fs';
import * as path from 'path';

const commands: any[] = [];
const commandsPath = path.join(process.cwd(), 'dist/commands');

async function getJson() {
  const categories = fs.readdirSync(commandsPath);

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js') && !file.endsWith('.d.ts') && !file.endsWith('.map'));
    for (const file of commandFiles) {
      const filePath = path.join(categoryPath, file);
      const command = await import(`file://${filePath}`);
      const cmdObj = command.default?.default || command.default || command;
      if (cmdObj.data) {
        commands.push(cmdObj.data.toJSON());
      }
    }
  }
  console.log(JSON.stringify(commands));
}

getJson();
