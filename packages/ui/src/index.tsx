import { View, Text, TouchableOpacity } from 'react-native';
export * from './types';

interface ButtonProps {
  title?: string;
  onPress?: () => void;
}

export const Button = ({ title = "Shared Button", onPress }: ButtonProps) => {
  return (
    <TouchableOpacity style={{ padding: 10, backgroundColor: '#1DB954', borderRadius: 20, alignItems: 'center' }} onPress={onPress}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>{title}</Text>
    </TouchableOpacity>
  );
};
