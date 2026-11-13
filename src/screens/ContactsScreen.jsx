import React, {useCallback, useState} from 'react';
import {View, Text, TextInput, Button, FlatList, StyleSheet, Alert} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {getContacts, saveContacts, getMessage, saveMessage} from '../storage';

const MAX = 5;

export default function ContactsScreen() {
  const [contacts, setContacts] = useState([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');

  useFocusEffect(
    useCallback(() => {
      getContacts().then(setContacts);
      getMessage().then(setMsg);
    }, []),
  );

  const add = async () => {
    const digits = phone.replace(/\D/g, '');
    if (!name.trim()) return Alert.alert('Enter a name');
    if (!/^\+\d{1,3}$/.test(code)) return Alert.alert('Country code like +91');
    if (digits.length < 6 || digits.length > 12) return Alert.alert('Invalid phone number');
    if (contacts.length >= MAX) return Alert.alert('Maximum ' + MAX + ' contacts');
    const next = [...contacts, {id: Date.now().toString(), name: name.trim(), number: code + digits}];
    setContacts(next);
    await saveContacts(next);
    setName('');
    setPhone('');
  };

  const remove = async id => {
    const next = contacts.filter(c => c.id !== id);
    setContacts(next);
    await saveContacts(next);
  };

  return (
    <View style={s.wrap}>
      <Text style={s.h}>Emergency message</Text>
      <TextInput
        style={s.in}
        value={msg}
        onChangeText={setMsg}
        onEndEditing={() => saveMessage(msg.trim() || 'I need help')}
      />

      <Text style={s.h}>Add priority contact</Text>
      <TextInput style={s.in} placeholder="Name" value={name} onChangeText={setName} />
      <View style={s.row}>
        <TextInput style={[s.in, {width: 70}]} value={code} onChangeText={setCode} keyboardType="phone-pad" />
        <TextInput
          style={[s.in, {flex: 1, marginLeft: 8}]}
          placeholder="Phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      </View>
      <Button title="Add contact" onPress={add} />

      <FlatList
        style={{marginTop: 16}}
        data={contacts}
        keyExtractor={c => c.id}
        ListEmptyComponent={<Text style={s.mut}>No contacts yet.</Text>}
        renderItem={({item, index}) => (
          <View style={s.item}>
            <Text style={{flex: 1}}>
              {index + 1}. {item.name} ({item.number})
            </Text>
            <Button title="Delete" color="#b42318" onPress={() => remove(item.id)} />
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {flex: 1, padding: 16},
  h: {fontWeight: '700', marginVertical: 8},
  in: {borderWidth: 1, borderColor: '#bbb', borderRadius: 8, padding: 10, marginBottom: 8},
  row: {flexDirection: 'row'},
  item: {flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#ddd'},
  mut: {color: '#777'},
});