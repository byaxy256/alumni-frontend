import { useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../../api';

type GenericRecord = Record<string, any>;

export interface OfficeRealtimeData {
  loading: boolean;
  loans: GenericRecord[];
  supports: GenericRecord[];
  disbursements: GenericRecord[];
  users: GenericRecord[];
  notifications: GenericRecord[];
  donations: GenericRecord;
  monthlyPipeline: Array<{ month: string; requested: number; disbursed: number; count: number }>;
  statusBreakdown: Array<{ name: string; value: number }>;
}

const toAmount = (item: GenericRecord): number =>
  Number(
    item?.disbursedAmount ??
      item?.amount_disbursed ??
      item?.approved_amount ??
      item?.amountRequested ??
      item?.amount_requested ??
      item?.amount ??
      item?.net_amount ??
      item?.original_amount ??
      0,
  );

const parseDate = (item: GenericRecord): Date | null => {
  const raw =
    item?.createdAt ?? item?.created_at ?? item?.approved_at ?? item?.updatedAt ?? item?.date ?? null;
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const monthLabel = (date: Date) =>
  date.toLocaleDateString('en-US', {
    month: 'short',
    year: '2-digit',
  });

export function useOfficeRealtimeData(): OfficeRealtimeData {
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState<GenericRecord[]>([]);
  const [supports, setSupports] = useState<GenericRecord[]>([]);
  const [disbursements, setDisbursements] = useState<GenericRecord[]>([]);
  const [users, setUsers] = useState<GenericRecord[]>([]);
  const [notifications, setNotifications] = useState<GenericRecord[]>([]);
  const [donations, setDonations] = useState<GenericRecord>({});

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [loansRes, supportsRes, disburseRes, usersRes, notificationsRes, donationsRes] =
          await Promise.all([
            fetch(`${API_BASE}/loans`, { headers }),
            fetch(`${API_BASE}/support`, { headers }),
            fetch(`${API_BASE}/disburse`, { headers }),
            fetch(`${API_BASE}/users`, { headers }),
            fetch(`${API_BASE}/notifications?limit=50`, { headers }),
            fetch(`${API_BASE}/donations/stats`, { headers }),
          ]);

        const loansData = loansRes.ok ? await loansRes.json() : [];
        const supportsData = supportsRes.ok ? await supportsRes.json() : [];
        const disburseData = disburseRes.ok ? await disburseRes.json() : [];
        const usersData = usersRes.ok ? await usersRes.json() : [];
        const notificationsData = notificationsRes.ok ? await notificationsRes.json() : [];
        const donationsData = donationsRes.ok ? await donationsRes.json() : {};

        setLoans(Array.isArray(loansData) ? loansData : []);
        setSupports(Array.isArray(supportsData) ? supportsData : []);
        setDisbursements(Array.isArray(disburseData) ? disburseData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);
        setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
        setDonations(donationsData && typeof donationsData === 'object' ? donationsData : {});
      } catch (error) {
        console.error('Realtime dashboard data load failed:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const monthlyPipeline = useMemo(() => {
    const bucket = new Map<string, { requested: number; disbursed: number; count: number; sortDate: Date }>();

    [...loans, ...supports].forEach((item) => {
      const date = parseDate(item) ?? new Date();
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const label = monthLabel(date);
      const existing = bucket.get(key) ?? { requested: 0, disbursed: 0, count: 0, sortDate: new Date(date.getFullYear(), date.getMonth(), 1) };
      existing.requested += toAmount(item);
      existing.count += 1;
      bucket.set(key, { ...existing, sortDate: new Date(date.getFullYear(), date.getMonth(), 1), requested: existing.requested, count: existing.count });
      if (!bucket.get(key)?.sortDate) {
        bucket.set(key, { ...existing, sortDate: new Date(date.getFullYear(), date.getMonth(), 1) });
      }
      const updated = bucket.get(key);
      if (updated) {
        (updated as any).month = label;
      }
    });

    disbursements.forEach((item) => {
      const date = parseDate(item) ?? new Date();
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const existing = bucket.get(key) ?? { requested: 0, disbursed: 0, count: 0, sortDate: new Date(date.getFullYear(), date.getMonth(), 1) };
      existing.disbursed += toAmount(item);
      bucket.set(key, existing);
    });

    return Array.from(bucket.entries())
      .map(([_, value]) => ({
        month: monthLabel(value.sortDate),
        requested: value.requested,
        disbursed: value.disbursed,
        count: value.count,
        sortDate: value.sortDate,
      }))
      .sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime())
      .slice(-6)
      .map(({ sortDate, ...item }) => item);
  }, [loans, supports, disbursements]);

  const statusBreakdown = useMemo(() => {
    const counter = new Map<string, number>();
    [...loans, ...supports].forEach((item) => {
      const status = String(item?.status || 'unknown').toLowerCase();
      counter.set(status, (counter.get(status) ?? 0) + 1);
    });
    return Array.from(counter.entries()).map(([name, value]) => ({ name, value }));
  }, [loans, supports]);

  return {
    loading,
    loans,
    supports,
    disbursements,
    users,
    notifications,
    donations,
    monthlyPipeline,
    statusBreakdown,
  };
}
