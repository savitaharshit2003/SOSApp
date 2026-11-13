import {PermissionsAndroid, Platform} from 'react-native';
import Geolocation from 'react-native-geolocation-service';

export async function askLocationPermission() {
  if (Platform.OS !== 'android') return true;
  const r = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
  return r === PermissionsAndroid.RESULTS.GRANTED;
}

function get(opts) {
  return new Promise((resolve, reject) =>
    Geolocation.getCurrentPosition(resolve, reject, opts),
  );
}

// GPS works without mobile signal. Falls back to the last known position.
export async function getLocation() {
  let p;
  try {
    p = await get({enableHighAccuracy: true, timeout: 20000, maximumAge: 10000});
  } catch (e) {
    try {
      p = await get({enableHighAccuracy: false, timeout: 8000, maximumAge: 86400000});
    } catch (e2) {
      return null;
    }
  }
  return {
    lat: p.coords.latitude,
    lng: p.coords.longitude,
    acc: Math.round(p.coords.accuracy),
    time: p.timestamp,
  };
}

export function buildMessage(text, loc) {
  if (!loc) return text + '\n(Location unavailable)';
  const when = new Date(loc.time).toLocaleString();
  return (
    text +
    '\nLocation: https://maps.google.com/?q=' + loc.lat + ',' + loc.lng +
    '\n(' + loc.lat.toFixed(5) + ', ' + loc.lng.toFixed(5) +
    ', accuracy ' + loc.acc + 'm, ' + when + ')'
  );
}