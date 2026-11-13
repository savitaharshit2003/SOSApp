import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_MSG = 'I need help🆘';

async function read(key, fallback) {
  try {
    const v = await AsyncStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) {
    return fallback;
  }
}

export const getContacts = () => read('contacts', []);
export const saveContacts = c => AsyncStorage.setItem('contacts', JSON.stringify(c));
export const getMessage = () => read('message', DEFAULT_MSG);
export const saveMessage = m => AsyncStorage.setItem('message', JSON.stringify(m));
export const getQueue = () => read('queue', []);
export const saveQueue = q => AsyncStorage.setItem('queue', JSON.stringify(q));