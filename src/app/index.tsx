import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ItemCard } from '../components/ItemCard';
import { categoryEmoji, theme } from '../constants/theme';
import { loadItems, saveItems } from '../services/storage';
import { CATEGORIES, type Category, type FindItem } from '../types/item';

type Filter = 'Tudo' | 'Favoritos';
const moneyNumber = (value: string) => Number(value.replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.')) || 0;
const formatMoney = (value: string) => {
  const number = moneyNumber(value);
  return number ? number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '';
};

export default function AlbumScreen() {
  const [items, setItems] = useState<FindItem[]>([]);
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category | 'Todas'>('Todas');
  const [filter, setFilter] = useState<Filter>('Tudo');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FindItem | null>(null);
  const [title, setTitle] = useState('');
  const [place, setPlace] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [pickedCategory, setPickedCategory] = useState<Category>('Decoração');
  const [imageUri, setImageUri] = useState<string | null>(null);

  useEffect(() => { loadItems().then(setItems).catch(() => Alert.alert('Ops', 'Não foi possível carregar seus achados.')).finally(() => setReady(true)); }, []);

  const visibleItems = useMemo(() => items.filter((item) => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    return (!query || `${item.title} ${item.place} ${item.notes}`.toLocaleLowerCase('pt-BR').includes(query))
      && (category === 'Todas' || item.category === category)
      && (filter === 'Tudo' || item.favorite);
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [items, search, category, filter]);
  const totalSpent = items.reduce((sum, item) => sum + moneyNumber(item.price), 0);

  async function commit(next: FindItem[]) {
    setItems(next);
    try { await saveItems(next); } catch { Alert.alert('Não foi possível salvar', 'Confira o espaço disponível no aparelho e tente novamente.'); }
  }

  function resetForm(item?: FindItem) {
    setEditing(item ?? null); setTitle(item?.title ?? ''); setPlace(item?.place ?? ''); setPrice(item?.price ?? '');
    setNotes(item?.notes ?? ''); setPickedCategory(item?.category ?? 'Decoração'); setImageUri(item?.imageUri ?? null); setFormOpen(true);
  }

  async function chooseImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.82 });
      if (!result.canceled) setImageUri(result.assets[0]?.uri ?? null);
    } catch { Alert.alert('Não foi possível abrir as fotos', 'Tente novamente.'); }
  }

  async function submit() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) { Alert.alert('Falta o nome', 'Dê um nome para este achado antes de salvar.'); return; }
    const item: FindItem = {
      id: editing?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: trimmedTitle, category: pickedCategory, place: place.trim(), price: formatMoney(price), notes: notes.trim(),
      imageUri, favorite: editing?.favorite ?? false, createdAt: editing?.createdAt ?? new Date().toISOString(),
    };
    const next = editing ? items.map((current) => current.id === editing.id ? item : current) : [item, ...items];
    await commit(next); setFormOpen(false);
  }

  function toggleFavorite(item: FindItem) { void commit(items.map((current) => current.id === item.id ? { ...current, favorite: !current.favorite } : current)); }
  function removeItem() {
    if (!editing) return;
    Alert.alert('Apagar achado?', 'Ele será removido do seu álbum.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: () => { void commit(items.filter((item) => item.id !== editing.id)); setFormOpen(false); } },
    ]);
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={visibleItems} keyExtractor={(item) => item.id} numColumns={2} columnWrapperStyle={styles.gridRow}
        renderItem={({ item }) => <ItemCard item={item} onPress={() => resetForm(item)} onFavorite={() => toggleFavorite(item)} />}
        contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}
        ListHeaderComponent={<>
          <View style={styles.topline}><View style={styles.brand}><View style={styles.brandMark}><Text style={styles.brandIcon}>✳</Text></View><Text style={styles.brandName}>ACHADOS<Text style={styles.brandSlash}> / </Text>da vida</Text></View><Pressable onPress={() => setFilter(filter === 'Tudo' ? 'Favoritos' : 'Tudo')} style={styles.topHeart}><Text style={styles.topHeartText}>{filter === 'Favoritos' ? '♥' : '♡'}</Text></Pressable></View>
          <View style={styles.hero}><Text style={styles.eyebrow}>SEU CANTINHO DE INSPIRAÇÃO</Text><Text style={styles.heading}>Coisas boas{'\n'}que encontrei<Text style={styles.headingDot}>.</Text></Text><Text style={styles.subtitle}>Um álbum para guardar tudo que vale a pena.</Text>
            <View style={styles.stats}><View><Text style={styles.statNumber}>{items.length.toString().padStart(2, '0')}</Text><Text style={styles.statLabel}>ACHADOS</Text></View><View style={styles.statDivider} /><View><Text style={styles.statNumber}>{totalSpent ? totalSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) : '—'}</Text><Text style={styles.statLabel}>INVESTIDOS</Text></View></View>
          </View>
          <View style={styles.sectionHead}><View><Text style={styles.sectionTitle}>{filter === 'Favoritos' ? 'Seus favoritos' : 'Sua coleção'}</Text><Text style={styles.sectionCaption}>{items.length ? `${visibleItems.length} achado${visibleItems.length === 1 ? '' : 's'} por aqui` : 'Toda descoberta começa com uma.'}</Text></View><Pressable style={styles.addButton} onPress={() => resetForm()}><Text style={styles.addPlus}>＋</Text><Text style={styles.addText}>Novo</Text></Pressable></View>
          <View style={styles.searchBox}><Text style={styles.searchIcon}>⌕</Text><TextInput value={search} onChangeText={setSearch} placeholder="Buscar no álbum" placeholderTextColor="#9A9B91" style={styles.searchInput} returnKeyType="search" /></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {(['Todas', ...CATEGORIES] as const).map((entry) => <Pressable key={entry} onPress={() => setCategory(entry)} style={[styles.chip, category === entry && styles.chipActive]}><Text style={[styles.chipText, category === entry && styles.chipTextActive]}>{entry === 'Todas' ? 'Tudo' : `${categoryEmoji[entry]} ${entry}`}</Text></Pressable>)}
          </ScrollView>
        </>}
        ListEmptyComponent={ready ? <View style={styles.empty}><View style={styles.emptyIcon}><Text style={{ fontSize: 34 }}>{search || category !== 'Todas' || filter === 'Favoritos' ? '⌕' : '✳'}</Text></View><Text style={styles.emptyTitle}>{items.length ? 'Nada por aqui ainda' : 'Seu álbum começa aqui'}</Text><Text style={styles.emptyText}>{items.length ? 'Tente mudar a busca ou escolher outra categoria.' : 'Salve aquela peça especial, um café gostoso ou uma ideia que merece ser lembrada.'}</Text>{!items.length && <Pressable style={styles.emptyButton} onPress={() => resetForm()}><Text style={styles.emptyButtonText}>＋  Adicionar primeiro achado</Text></Pressable>}</View> : <View style={styles.empty}><Text style={styles.emptyText}>Carregando seu álbum…</Text></View>}
        ListFooterComponent={<Text style={styles.footer}>FEITO COM CARINHO, PARA NÃO ESQUECER ✳</Text>}
      />

      <Modal visible={formOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setFormOpen(false)}>
        <KeyboardAvoidingView style={styles.modal} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalHeader}><Pressable onPress={() => setFormOpen(false)}><Text style={styles.cancel}>Cancelar</Text></Pressable><Text style={styles.modalTitle}>{editing ? 'Editar achado' : 'Novo achado'}</Text><Pressable onPress={() => void submit()}><Text style={styles.save}>Salvar</Text></Pressable></View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.formContent}>
            <Pressable style={styles.photoBox} onPress={() => void chooseImage()}>{imageUri ? <Image source={{ uri: imageUri }} style={styles.photoPreview} /> : <><Text style={styles.photoPlus}>＋</Text><Text style={styles.photoLabel}>ADICIONAR UMA FOTO</Text><Text style={styles.photoHint}>Escolha uma imagem da sua galeria</Text></>}</Pressable>
            {imageUri ? <Pressable onPress={() => void chooseImage()} style={styles.changePhoto}><Text style={styles.changePhotoText}>Trocar foto</Text></Pressable> : null}
            <Text style={styles.label}>NOME DO ACHADO *</Text><TextInput value={title} onChangeText={setTitle} placeholder="Ex.: Vaso de cerâmica" placeholderTextColor="#A5A59D" style={styles.input} maxLength={60} />
            <Text style={styles.label}>CATEGORIA</Text><View style={styles.formChips}>{CATEGORIES.map((entry) => <Pressable key={entry} onPress={() => setPickedCategory(entry)} style={[styles.formChip, pickedCategory === entry && styles.formChipActive]}><Text style={[styles.formChipText, pickedCategory === entry && styles.formChipTextActive]}>{categoryEmoji[entry]} {entry}</Text></Pressable>)}</View>
            <Text style={styles.label}>ONDE ENCONTROU?</Text><TextInput value={place} onChangeText={setPlace} placeholder="Loja, cidade ou link" placeholderTextColor="#A5A59D" style={styles.input} maxLength={80} />
            <Text style={styles.label}>QUANTO CUSTOU?</Text><TextInput value={price} onChangeText={setPrice} placeholder="R$ 0,00" placeholderTextColor="#A5A59D" style={styles.input} keyboardType="decimal-pad" />
            <Text style={styles.label}>ANOTAÇÕES</Text><TextInput value={notes} onChangeText={setNotes} placeholder="Por que esse achado merece ser lembrado?" placeholderTextColor="#A5A59D" style={[styles.input, styles.notesInput]} multiline maxLength={300} textAlignVertical="top" />
            {editing && <Pressable onPress={removeItem} style={styles.deleteButton}><Text style={styles.deleteText}>Apagar achado</Text></Pressable>}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, listContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 },
  topline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }, brand: { flexDirection: 'row', alignItems: 'center', gap: 8 }, brandMark: { height: 29, width: 29, borderRadius: 10, backgroundColor: theme.green, alignItems: 'center', justifyContent: 'center' }, brandIcon: { color: '#F5EFE3', fontSize: 19 }, brandName: { color: theme.green, fontWeight: '900', letterSpacing: 1.1, fontSize: 12 }, brandSlash: { color: theme.orange }, topHeart: { width: 39, height: 39, borderRadius: 20, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center' }, topHeartText: { color: theme.orange, fontSize: 22 },
  hero: { backgroundColor: theme.green, borderRadius: 24, paddingHorizontal: 22, paddingTop: 22, paddingBottom: 20, overflow: 'hidden' }, eyebrow: { color: '#C9D3C4', letterSpacing: 1.6, fontSize: 9, fontWeight: '800' }, heading: { marginTop: 12, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 32, lineHeight: 37, color: '#FAF8F1', fontWeight: '700' }, headingDot: { color: '#F0A77D' }, subtitle: { color: '#D1D9CE', marginTop: 8, fontSize: 12 }, stats: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 22 }, statNumber: { color: '#FFF9EE', fontSize: 20, fontWeight: '800' }, statLabel: { color: '#C3CEBE', fontSize: 8, letterSpacing: 1.4, marginTop: 4, fontWeight: '700' }, statDivider: { width: 1, height: 34, backgroundColor: '#ffffff40' },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 27, marginBottom: 15 }, sectionTitle: { color: theme.ink, fontSize: 20, fontWeight: '800' }, sectionCaption: { color: theme.muted, fontSize: 11, marginTop: 4 }, addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.orange, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 9, gap: 5 }, addPlus: { color: '#fff', fontSize: 17, lineHeight: 19, fontWeight: '600' }, addText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  searchBox: { height: 45, backgroundColor: theme.surface, borderRadius: 13, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, borderWidth: 1, borderColor: theme.line }, searchIcon: { color: theme.muted, fontSize: 24, marginRight: 8 }, searchInput: { flex: 1, padding: 0, color: theme.ink, fontSize: 13 }, chipRow: { gap: 8, paddingVertical: 14 }, chip: { paddingVertical: 8, paddingHorizontal: 13, borderRadius: 18, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.line }, chipActive: { backgroundColor: theme.green, borderColor: theme.green }, chipText: { fontSize: 11, color: '#65665F', fontWeight: '600' }, chipTextActive: { color: '#fff' }, gridRow: { justifyContent: 'space-between' },
  empty: { alignItems: 'center', paddingHorizontal: 25, paddingVertical: 32 }, emptyIcon: { width: 68, height: 68, borderRadius: 24, backgroundColor: theme.peach, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }, emptyTitle: { color: theme.ink, fontSize: 17, fontWeight: '800' }, emptyText: { color: theme.muted, fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 8 }, emptyButton: { backgroundColor: theme.green, borderRadius: 13, paddingVertical: 12, paddingHorizontal: 16, marginTop: 18 }, emptyButtonText: { color: '#fff', fontWeight: '700', fontSize: 12 }, footer: { textAlign: 'center', color: '#AAA99F', fontSize: 8, fontWeight: '700', letterSpacing: 1.6, paddingTop: 20 },
  modal: { flex: 1, backgroundColor: theme.background }, modalHeader: { height: 56, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: theme.line, backgroundColor: theme.surface }, cancel: { color: theme.muted, fontSize: 13 }, modalTitle: { color: theme.ink, fontSize: 15, fontWeight: '800' }, save: { color: theme.green, fontSize: 14, fontWeight: '800' }, formContent: { padding: 20, paddingBottom: 42 }, photoBox: { height: 156, borderRadius: 18, overflow: 'hidden', backgroundColor: '#EAE7DE', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E0DDD3', borderStyle: 'dashed', marginBottom: 20 }, photoPreview: { width: '100%', height: '100%' }, photoPlus: { color: theme.green, fontSize: 28 }, photoLabel: { color: theme.green, fontSize: 10, letterSpacing: 1.2, fontWeight: '800', marginTop: 3 }, photoHint: { color: theme.muted, fontSize: 11, marginTop: 5 }, changePhoto: { marginTop: -12, marginBottom: 15, alignSelf: 'flex-end' }, changePhotoText: { color: theme.green, fontSize: 12, fontWeight: '700' }, label: { color: '#77786F', fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginTop: 15, marginBottom: 8 }, input: { backgroundColor: theme.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.line, paddingHorizontal: 13, paddingVertical: 12, color: theme.ink, fontSize: 14 }, formChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, formChip: { borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: theme.surface, borderColor: theme.line, borderWidth: 1 }, formChipActive: { backgroundColor: theme.greenLight, borderColor: theme.green }, formChipText: { color: '#67685F', fontSize: 11, fontWeight: '600' }, formChipTextActive: { color: theme.green }, notesInput: { height: 95, paddingTop: 12 }, deleteButton: { alignItems: 'center', paddingVertical: 17, marginTop: 12 }, deleteText: { color: '#B5483E', fontSize: 13, fontWeight: '700' },
});
