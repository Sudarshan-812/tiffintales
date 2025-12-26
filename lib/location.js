import * as Location from 'expo-location';
import { Alert } from 'react-native';

// 📍 1. Get Current User Location
export const getCurrentLocation = async () => {
  let { status } = await Location.requestForegroundPermissionsAsync();
  
  if (status !== 'granted') {
    Alert.alert('Permission Denied', 'Allow location access to find tiffins near you.');
    return null;
  }

  // Get position (High accuracy)
  let location = await Location.getCurrentPositionAsync({});
  return location.coords; // Returns { latitude, longitude }
};

// 📏 2. Calculate Distance (Haversine Formula) in km
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;

  const R = 6371; // Earth's radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; 
  
  return distance.toFixed(1); // Returns string "2.5"
};

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}