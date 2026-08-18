import test from 'node:test';
import assert from 'node:assert/strict';

import { UserModel } from '../database/models/User.js';
import { MessageService } from '../services/economy/MessageService.js';
import { MaintenanceService } from '../services/core/MaintenanceService.js';
import { OwnerService } from '../services/owner/OwnerService.js';
import { SecurityService } from '../services/security/SecurityService.js';

const guildId = 'guild-security-test';
const userId = 'user-security-test';

test('SecurityService blocks blacklisted users', async () => {
  await UserModel.deleteOne({ userId, guildId }).catch(() => undefined);
  await SecurityService.setBlacklist(userId, 'test');

  const result = await SecurityService.canUseCommand(userId, guildId, 'pay');
  assert.equal(result.allowed, false);
  assert.match(result.reason ?? '', /blacklist/i);

  await SecurityService.clearBlacklist(userId);
});

test('MessageService ignores rapid duplicate message processing', async () => {
  await UserModel.deleteOne({ userId, guildId }).catch(() => undefined);

  const first = await MessageService.recordMessage(userId, guildId);
  const second = await MessageService.recordMessage(userId, guildId);

  assert.ok(first);
  assert.ok(second);
  assert.equal(first.messagesTotal, 1);
  assert.equal(second.messagesTotal, 1);
});

test('MaintenanceService blocks non-owners while enabled', () => {
  MaintenanceService.setEnabled(true);

  assert.equal(MaintenanceService.isEnabled(), true);
  assert.equal(MaintenanceService.canUseBot(userId), false);
  assert.equal(MaintenanceService.canUseBot(OwnerService.defaultOwnerIds[0]), true);

  MaintenanceService.setEnabled(false);
  assert.equal(MaintenanceService.isEnabled(), false);
});
