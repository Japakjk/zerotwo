import { REST, Routes } from 'discord.js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const commands: any[] = [];
const commandsPath = path.join(process.cwd(), 'dist/commands');

async function deploy() {
  console.log(`🌸 Procurando comandos em: ${commandsPath}`);
  if (!fs.existsSync(commandsPath)) {
    console.error('❌ Diretório de comandos não encontrado!');
    return;
  }

  const categories = fs.readdirSync(commandsPath);
  console.log(`🌸 Categorias encontradas: ${categories.join(', ')}`);

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js') && !file.endsWith('.d.ts') && !file.endsWith('.map'));
    console.log(`🌸 Categoria ${category}: ${commandFiles.length} arquivos encontrados.`);
    
    for (const file of commandFiles) {
      const filePath = path.join(categoryPath, file);
      try {
        const command = await import(`file://${filePath}`);
        console.log(`🌸 Conteúdo de ${file}:`, Object.keys(command));
        const cmdObj = command.default?.default || command.default || command;
        if (cmdObj.data) {
          commands.push(cmdObj.data.toJSON());
        } else {
          console.warn(`⚠️ Arquivo ${file} não exporta um comando válido.`);
        }
      } catch (err) {
        console.error(`❌ Erro ao importar ${file}:`, err);
      }
    }
  }

  if (commands.length === 0) {
    console.error('❌ Nenhum comando encontrado para registrar!');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

  try {
    console.log(`🌸 Iniciando atualização de ${commands.length} application (/) commands.`);

    const data: any = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID!),
      { body: commands },
    );

    console.log(`🌸 Comandos (/) recarregados com sucesso (${data.length} comandos).`);
  } catch (error) {
    console.error('❌ Erro na API do Discord:', error);
  }
}

deploy();
