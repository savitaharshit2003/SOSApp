import {PermissionsAndroid, Platform} from 'react-native';
import BackgroundService from 'react-native-background-actions';
import {flushQueue} from './queue';

const sleep = ms => new Promise(r => setTimeout(r, ms));

const retryTask = async () => {
  const end = Date.now() + 6 * 3600 * 1000; // give up after 6 hours
  while (BackgroundService.isRunning() && Date.now() < end) {
    const left = await flushQueue();
    if (left === 0) break;
    await BackgroundService.updateNotification({
      taskDesc: left + ' SOS message(s) waiting for signal',
    });
    await sleep(20000);
  }
  await BackgroundService.stop();
};

export async function startRetryService() {
  if (Platform.OS !== 'android' || BackgroundService.isRunning()) return;
  try {
    if (Platform.Version >= 33) {
      await PermissionsAndroid.request('android.permission.POST_NOTIFICATIONS');
    }
    await BackgroundService.start(retryTask, {
      taskName: 'SosRetry',
      taskTitle: 'SOS waiting for signal',
      taskDesc: 'Retrying to send your SOS message',
      taskIcon: {name: 'ic_launcher', type: 'mipmap'},
      color: '#d92d20',
    });
  } catch (e) {
    // If the service can't start, the 30 sec retry on the SOS screen still works.
  }
}