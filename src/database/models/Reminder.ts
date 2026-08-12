import { Schema } from 'mongoose';
import { createMockModel } from './MockModel.js';

export interface IReminder {
  userId: string;
  guildId: string;
  reason: string;
  remindAt: Date;
  createdAt: Date;
}

const reminderSchema = new Schema<IReminder>({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  reason: { type: String, required: true },
  remindAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const ReminderModel = createMockModel('Reminder', reminderSchema);
