import { CooldownService } from './services/economy/CooldownService.js';

async function testLogic() {
  const testGuildId = '123456789012345678';
  const testUserId = '876543210987654321';

  console.log('\n--- 🧪 TESTE DE LÓGICA: COOLDOWNS INDEPENDENTES ---');
  
  // O CooldownService usa um Map em memória antes de persistir (ou apenas em memória se o DB falhar)
  // Vamos testar se as chaves no Map são independentes
  
  console.log('1. Ativando cooldown para "socar"...');
  await CooldownService.setCooldown(testUserId, testGuildId, 'socar');
  
  const cdSocar = await CooldownService.checkCooldown(testUserId, testGuildId, 'socar');
  const cdBeijar = await CooldownService.checkCooldown(testUserId, testGuildId, 'beijar');
  
  console.log(`> Cooldown 'socar' está ativo? ${cdSocar.inCooldown ? 'SIM (Correto)' : 'NÃO (Erro)'}`);
  console.log(`> Cooldown 'beijar' está ativo? ${cdBeijar.inCooldown ? 'SIM (Erro)' : 'NÃO (Correto - Independente!)'}`);

  if (cdSocar.inCooldown && !cdBeijar.inCooldown) {
    console.log('\n✅ SUCESSO: Os cooldowns são independentes e não conflitam!');
  } else {
    console.log('\n❌ FALHA: Houve conflito entre os cooldowns.');
    process.exit(1);
  }

  process.exit(0);
}

testLogic().catch(err => {
  console.error(err);
  process.exit(1);
});
