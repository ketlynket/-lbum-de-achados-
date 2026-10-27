import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { categoryEmoji, theme } from '../constants/theme';
import type { FindItem } from '../types/item';

type Props = { item: FindItem; onPress: () => void; onFavorite: () => void };

export function ItemCard({ item, onPress, onFavorite }: Props) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.imageWrap}>
        {item.imageUri ? <Image source={{ uri: item.imageUri }} style={styles.image} /> : (
          <View style={styles.placeholder}><Text style={styles.emoji}>{categoryEmoji[item.category] ?? '✨'}</Text></View>
        )}
        <Pressable accessibilityRole="button" accessibilityLabel={item.favorite ? 'Remover dos favoritos' : 'Favoritar'} onPress={onFavorite} hitSlop={10} style={styles.heart}>
          <Text style={styles.heartText}>{item.favorite ? '♥' : '♡'}</Text>
        </Pressable>
      </View>
      <View style={styles.info}>
        <Text style={styles.category}>{item.category.toUpperCase()}</Text>
        <Text numberOfLines={1} style={styles.title}>{item.title}</Text>
        <Text numberOfLines={1} style={styles.place}>⌖  {item.place || 'Lugar não informado'}</Text>
        {item.price ? <Text style={styles.price}>{item.price}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: '48.3%', backgroundColor: theme.surface, borderRadius: 18, overflow: 'hidden', marginBottom: 14, borderWidth: 1, borderColor: '#EFEEE9' },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  imageWrap: { height: 155, backgroundColor: '#EEEAE2' }, image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E9E6DC' }, emoji: { fontSize: 48 },
  heart: { position: 'absolute', right: 10, top: 10, width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFFFFFE8', alignItems: 'center', justifyContent: 'center' },
  heartText: { fontSize: 20, color: theme.orange, lineHeight: 24 },
  info: { paddingHorizontal: 12, paddingTop: 11, paddingBottom: 14 }, category: { color: theme.orange, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  title: { marginTop: 4, fontSize: 15, color: theme.ink, fontWeight: '700' }, place: { marginTop: 5, color: theme.muted, fontSize: 11 }, price: { marginTop: 7, color: theme.green, fontWeight: '700', fontSize: 12 },
});
