import {getQueue, saveQueue} from './storage';
import {sendSms} from './sms';

let running = false;

// Tries to send every waiting message. Returns how many are still waiting.
export async function flushQueue() {
  if (running) return (await getQueue()).length;
  running = true;
  try {
    const q = await getQueue();
    if (!q.length) return 0;
    const left = [];
    for (const item of q) {
      const r = await sendSms(item.number, item.body);
      if (!r.ok) left.push(item);
    }
    // keep messages that were added while we were sending
    const now = await getQueue();
    const added = now.filter(n => !q.some(o => o.id === n.id));
    const next = [...left, ...added];
    await saveQueue(next);
    return next.length;
  } finally {
    running = false;
  }
}