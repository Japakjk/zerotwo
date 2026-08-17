import { REST, Routes } from 'discord.js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
dotenv.config();
const commandMap = new Map();
const commandsPath = path.join(process.cwd(), 'dist/commands');
async function deploy() {
    console.log(`🌸 Procurando comandos em: ${commandsPath}`);
    if (!fs.existsSync(commandsPath)) {
        console.error('❌ Diretório de comandos não encontrado!');
        return;
    }
    const categories = fs.readdirSync(commandsPath);
    for (const category of categories) {
        const categoryPath = path.join(commandsPath, category);
        if (!fs.statSync(categoryPath).isDirectory())
            continue;
        const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js') && !file.endsWith('.d.ts') && !file.endsWith('.map'));
        for (const file of commandFiles) {
            const filePath = path.join(categoryPath, file);
            try {
                const command = await import(`file://${filePath}`);
                const cmdObj = command.default?.default || command.default || command;
                if (cmdObj.data && cmdObj.data.name) {
                    const name = cmdObj.data.name;
                    if (commandMap.has(name)) {
                        console.warn(`⚠️ DUPLICADO ENCONTRADO: nome '${name}' em ${category}/${file} (já cadastrado)`);
                    }
                    else {
                        console.log(`✅ Adicionando comando: /${name} (${category}/${file})`);
                    }
                    commandMap.set(name, cmdObj.data.toJSON());
                }
                else {
                    console.warn(`⚠️ Arquivo ${category}/${file} não exporta um comando válido.`);
                }
            }
            catch (err) {
                console.error(`❌ Erro ao importar ${file}:`, err);
            }
        }
    }
    const commands = Array.from(commandMap.values());
    console.log(`🌸 Total de comandos únicos recolhidos: ${commands.length}`);
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        console.log(`🌸 Iniciando atualização de ${commands.length} application (/) commands únicos.`);
        const data = await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log(`🌸 Comandos (/) recarregados com sucesso (${data.length} comandos).`);
    }
    catch (error) {
        console.error('❌ Erro na API do Discord:', error.rawError || error);
    }
}
deploy();
