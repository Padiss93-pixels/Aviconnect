import { Redirect } from 'expo-router';
import { useAuthContext } from '@/hooks/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function Index() {
  const { user, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary }}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  return <Redirect href="/(tabs)" />;
}
