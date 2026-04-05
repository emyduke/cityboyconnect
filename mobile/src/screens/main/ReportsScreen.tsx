import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../../theme';
import { getReports } from '../../api/reports';
import { unwrap } from '../../api/client';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/EmptyState';

export default function ReportsScreen() {
  const navigation = useNavigation<any>();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const data = unwrap(await getReports());
      setReports(Array.isArray(data) ? data : data?.results || []);
    } catch { /* handled */ }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return <View style={styles.container}>{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="card" style={{ marginBottom: spacing.sm }} />)}</View>;

  const statusVariant = (s: string) => s === 'SUBMITTED' ? 'info' : s === 'ACKNOWLEDGED' ? 'success' : s === 'REVIEWED' ? 'success' : 'warning';

  return (
    <View style={styles.container}>
      <FlatList
        data={reports}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: spacing.sm }}>
            <View style={styles.row}>
              <Text style={styles.period}>{item.report_period}</Text>
              <Badge label={item.status || 'DRAFT'} variant={statusVariant(item.status)} />
            </View>
            <Text style={styles.summary} numberOfLines={2}>{item.summary_of_activities}</Text>
          </Card>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor={colors.primary} />}
        ListEmptyComponent={<EmptyState icon="📋" title="No Reports" description="Submit your first grassroots report" actionLabel="New Report" onAction={() => navigation.navigate('NewReport')} />}
        ListHeaderComponent={
          <Button variant="secondary" size="sm" onPress={() => navigation.navigate('NewReport')} style={{ marginBottom: spacing.md, alignSelf: 'flex-end' }}>
            + New Report
          </Button>
        }
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  period: { ...typography.bodyMedium, color: colors.text },
  summary: { ...typography.bodySm, color: colors.textSecondary, marginTop: spacing.xs },
});
