import { View, StyleSheet } from 'react-native';
import { type Lot } from '@/constants/mockData';
import LotCard from './LotCard';

type Props = {
  lots: Lot[];
  boostedIds?: Set<number>;
};

export default function LotGrid({ lots, boostedIds = new Set() }: Props) {
  const pairs: Array<{ left: Lot; right?: Lot }> = [];
  for (let i = 0; i < lots.length; i += 2) {
    pairs.push({ left: lots[i], right: lots[i + 1] });
  }

  return (
    <View>
      {pairs.map((pair, i) => (
        <View key={i} style={styles.row}>
          <View style={styles.cell}>
            <LotCard lot={pair.left} isBoosted={boostedIds.has(pair.left.id)} />
          </View>
          {pair.right ? (
            <View style={styles.cell}>
              <LotCard lot={pair.right} isBoosted={boostedIds.has(pair.right.id)} />
            </View>
          ) : (
            <View style={styles.cell} />
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', paddingHorizontal: 4, marginBottom: 2 },
  cell: { flex: 1, paddingHorizontal: 4 },
});
