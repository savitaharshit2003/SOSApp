import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, Pressable, Button, StyleSheet, Linking, Alert} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {getContacts, getMessage, getQueue, saveQueue} from '../storage';
import {askLocationPermission, getLocation, buildMessage} from '../location';
import {askSmsPermission, sendSms} from '../sms';
import {flushQueue} from '../queue';
import {startRetryService} from '../background';

export default function SosScreen() {
  const [contacts, setContacts] = useState([]);
  const [status, setStatus] = useState([]);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    // on app open: if messages are still waiting, keep retrying in background
    getQueue().then(q => {
      setPending(q.length);
      if (q.length) startRetryService();
    });
    const t = setInterval(async () => setPending(await flushQueue()), 30000);
    return () => clearInterval(t);
  }, []);

  useFocusEffect(
    useCallback(() => {
      getContacts().then(setContacts);
      setStatus([]);
    }, []),
  );

  const sendSos = async () => {
    if (busy) return;
    const list = await getContacts();
    if (!list.length) {
      Alert.alert('Add a contact first', 'Go to the Contacts tab.');
      return;
    }
    if (!(await askLocationPermission())) {
      Alert.alert('Location permission needed', 'Please allow location access.');
      return;
    }
    if (!(await askSmsPermission())) {
      Alert.alert('SMS permission needed', 'Please allow SMS so the alert can be sent.');
      return;
    }
    setBusy(true);
    setStatus(['Getting GPS location... (can take up to 30 sec)']);
    const loc = await getLocation();
    const body = buildMessage(await getMessage(), loc);
    const lines = [loc ? 'GPS fix found' : 'No GPS fix, sending without location'];
    const failed = [];
    for (const c of list) {
      setStatus([...lines, 'Sending to ' + c.name + '...']);
      const r = await sendSms(c.number, body);
      if (r.ok) {
        lines.push(c.name + ': SENT');
      } else {
        lines.push(c.name + ': QUEUED, will retry (' + r.err + ')');
        failed.push({id: Date.now() + '-' + c.id, number: c.number, body});
      }
    }
    if (failed.length) {
      const q = await getQueue();
      const next = [...q, ...failed];
      await saveQueue(next);
      setPending(next.length);
      startRetryService();
    }
    setStatus(lines);
    setBusy(false);
  };

  return (
    <View style={s.wrap}>
      <Pressable
        style={({pressed}) => [s.btn, pressed && {opacity: 0.8}, busy && {backgroundColor: '#777'}]}
        delayLongPress={1500}
        onLongPress={sendSos}>
        <Text style={s.btnTxt}>SOS</Text>
        <Text style={s.hint}>Press and hold 1.5 sec</Text>
      </Pressable>

      <Text style={s.info}>
        {contacts.length ? contacts.length + ' contact(s) saved' : 'No contacts saved yet'}
      </Text>

      {status.map((t, i) => (
        <Text key={i} style={s.st}>
          {t}
        </Text>
      ))}

      {pending > 0 && (
        <Text style={[s.st, {color: '#b42318', fontWeight: '700'}]}>
          {pending} message(s) waiting for signal. Retrying automatically.
        </Text>
      )}

      <View style={{marginTop: 24}}>
        <Button title="Call 112" color="#333" onPress={() => Linking.openURL('tel:112')} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16},
  btn: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#d92d20',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },
  btnTxt: {color: '#fff', fontSize: 56, fontWeight: '800'},
  hint: {color: '#fff', marginTop: 4},
  info: {marginTop: 16, color: '#555'},
  st: {marginTop: 6, textAlign: 'center'},
});