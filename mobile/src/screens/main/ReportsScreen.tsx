import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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

  if (loading) return <View className="flex-1 bg-background p-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="card" className="mb-2" />)}</View>;

  const statusVariant = (s: string) => s === 'SUBMITTED' ? 'info' : s === 'ACKNOWLEDGED' ? 'success' : s === 'REVIEWED' ? 'success' : 'warning';

  return (
    <View className="flex-1 bg-background p-4">
      <FlatList
        data={reports}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Card className="mb-2">
            <View className="flex-row justify-between items-center">
              <Text className="text-base font-body-medium text-gray-900">{item.report_period}</Text>
              <Badge label={item.status || 'DRAFT'} variant={statusVariant(item.status)} />
            </View>
            <Text className="text-sm font-body text-gray-500 mt-1" numberOfLines={2}>{item.summary_of_activities}</Text>
          </Card>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor="#1a472a" />}
        ListEmptyComponent={<EmptyState icon="📋" title="No Reports" description="Submit your first grassroots report" actionLabel="New Report" onAction={() => navigation.navigate('NewReport')} />}
        ListHeaderComponent={
          <Button variant="secondary" size="sm" onPress={() => navigation.navigate('NewReport')} className="mb-4 self-end">
            + New Report
          </Button>
        }
        contentContainerClassName="pb-12"
      />
    </View>
  );
}
