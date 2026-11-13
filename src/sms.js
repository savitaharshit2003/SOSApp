import {PermissionsAndroid, Platform} from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';

export async function askSmsPermission() {
  if (Platform.OS !== 'android') return false;
  const r = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.SEND_SMS);
  return r === PermissionsAndroid.RESULTS.GRANTED;
}

// Returns {ok: true} or {ok: false, err: 'reason'}
export function sendSms(number, body) {
  return new Promise(resolve => {
    try {
      SmsAndroid.autoSend(
        number,
        body,
        e => resolve({ok: false, err: String(e)}),
        () => resolve({ok: true}),
      );
    } catch (e) {
      resolve({ok: false, err: 'Exception: ' + String(e)});
    }
    setTimeout(() => resolve({ok: false, err: 'Timed out after 20 sec'}), 20000);
  });
}