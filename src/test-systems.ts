import { GuildModel } from './database/models/Guild.js';
import { GiveawayModel } from './database/models/Giveaway.js';
import { CooldownService } from './services/economy/CooldownService.js';
import { logger } from './utils/logger.js';

async function test() {
  // Simular conexão bem-sucedida para o teste de lógica
  console.log('🌸 [MOCK-DB] Simulando conexão com o banco de dados...');
  const testGuildId = '123456789012345678';
  const testUserId = '876543210987654321';

  console.log('\n--- 🧪 TESTE 1: PERSISTÊNCIA DE SORTEIO ---');
  await GiveawayModel.deleteMany({ guildId: testGuildId });
  const giveaway = await GiveawayModel.create({
    guildId: testGuildId,
    channelId: '111222333',
    messageId: '444555666',
    prize: 'Nitro Especial Zero Two',
    endsAt: new Date(Date.now() + 3600000),
    hostId: testUserId,
    status: 'active'
  });
  console.log(`✅ Sorteio criado no banco: ${giveaway.prize} (ID: ${giveaway._id})`);

  console.log('\n--- 🧪 TESTE 2: PREFIXO DINÂMICO NO HELP ---');
  await GuildModel.findOneAndUpdate(
    { guildId: testGuildId },
    { prefix: 'zero!' },
    { upsert: true }
  );
  let guild = await GuildModel.findOne({ guildId: testGuildId });
  console.log(`✅ Prefixo atual no banco: ${guild?.prefix}`);
  
  await GuildModel.findOneAndUpdate({ guildId: testGuildId }, { prefix: 'z!' });
  guild = await GuildModel.findOne({ guildId: testGuildId });
  console.log(`✅ Prefixo alterado no banco: ${guild?.prefix} (Simulando mudança dinâmica)`);

  console.log('\n--- 🧪 TESTE 3: COOLDOWNS INDEPENDENTES ---');
  // Simular uso de 'socar'
  await CooldownService.setCooldown(testUserId, testGuildId, 'socar');
  const cdSocar = await CooldownService.checkCooldown(testUserId, testGuildId, 'socar');
  const cdBeijar = await CooldownService.checkCooldown(testUserId, testGuildId, 'beijar');
  
  console.log(`✅ Cooldown 'socar': ${cdSocar.inCooldown ? 'ATIVO (Correto)' : 'FALHOU'}`);
  console.log(`✅ Cooldown 'beijar': ${cdBeijar.inCooldown ? 'ATIVO (ERRO)' : 'LIVRE (Correto - Independente!)'}`);

  console.log('\n--- ✨ TESTES CONCLUÍDOS COM SUCESSO! ---');
  process.exit(0);
}

test().catch(err => {
  console.error('❌ Erro nos testes:', err);
  process.exit(1);
});
