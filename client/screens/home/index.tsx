import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Screen } from "@/components/Screen";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome6 } from "@expo/vector-icons";
import { useSafeRouter } from "@/hooks/useSafeRouter";

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface Vehicle {
  id: number;
  name: string;
  plate_number: string;
  brand: string;
  model: string;
}

interface ExpenseStats {
  total_fuel: number;
  total_maintenance: number;
  total_amount: number;
  total_count: number;
}

interface Reminder {
  id: number;
  vehicle_id: number;
  type: string;
  title: string;
  due_date: string;
  is_completed: boolean;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  fuel: { label: "加油", color: "#F59E0B", bg: "rgba(245,158,11,0.12)", icon: "gas-pump" },
  maintenance: { label: "维修", color: "#2563EB", bg: "rgba(37,99,235,0.12)", icon: "wrench" },
  insurance: { label: "保险", color: "#8B5CF6", bg: "rgba(139,92,246,0.12)", icon: "shield-halved" },
  inspection: { label: "年检", color: "#10B981", bg: "rgba(16,185,129,0.12)", icon: "clipboard-check" },
  other: { label: "其他", color: "#64748B", bg: "rgba(100,116,139,0.12)", icon: "ellipsis" },
};

function getDaysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stats, setStats] = useState<ExpenseStats>({ total_fuel: 0, total_maintenance: 0, total_amount: 0, total_count: 0 });
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [vehiclesRes, statsRes, remindersRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/vehicles`),
        fetch(`${API_BASE}/api/v1/expenses/stats${selectedVehicleId ? `?vehicle_id=${selectedVehicleId}` : ""}`),
        fetch(`${API_BASE}/api/v1/reminders?is_completed=false`),
      ]);
      const vehiclesData = await vehiclesRes.json();
      const statsData = await statsRes.json();
      const remindersData = await remindersRes.json();

      setVehicles(vehiclesData);
      setStats(statsData);
      setReminders(remindersData);
      if (vehiclesData.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(vehiclesData[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedVehicleId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const upcomingReminders = reminders
    .filter((r) => !r.is_completed)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <Screen safeAreaEdges={["left", "right", "bottom"]}>
        <View style={[styles.headerArea, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.pageTitle}>车辆管家</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeAreaEdges={["left", "right", "bottom"]} backgroundColor="#F0F4F8">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.headerArea, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.pageTitle}>车辆管家</Text>
          <Text style={styles.pageSubtitle}>费用统计与到期提醒</Text>
        </View>

        {/* Vehicle Selector */}
        {vehicles.length > 0 && (
          <View style={styles.section}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 20 }}>
              {vehicles.map((v) => (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.vehicleChip, selectedVehicleId === v.id && styles.vehicleChipActive]}
                  onPress={() => setSelectedVehicleId(v.id)}
                  activeOpacity={0.7}
                >
                  <FontAwesome6
                    name="car"
                    size={14}
                    color={selectedVehicleId === v.id ? "#FFFFFF" : "#64748B"}
                  />
                  <Text
                    style={[
                      styles.vehicleChipText,
                      selectedVehicleId === v.id && styles.vehicleChipTextActive,
                    ]}
                  >
                    {v.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Expense Overview Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>费用概览</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: "rgba(245,158,11,0.12)" }]}>
                <FontAwesome6 name="gas-pump" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.statLabel}>加油花费</Text>
              <Text style={[styles.statValue, { color: "#F59E0B" }]}>
                ¥{stats.total_fuel.toFixed(0)}
              </Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: "rgba(37,99,235,0.12)" }]}>
                <FontAwesome6 name="wrench" size={20} color="#2563EB" />
              </View>
              <Text style={styles.statLabel}>维修花费</Text>
              <Text style={[styles.statValue, { color: "#2563EB" }]}>
                ¥{stats.total_maintenance.toFixed(0)}
              </Text>
            </View>
          </View>
          {/* Total Card */}
          <View style={styles.totalCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View>
                <Text style={styles.totalLabel}>总花费</Text>
                <Text style={styles.totalSubLabel}>共 {stats.total_count} 笔记录</Text>
              </View>
              <Text style={styles.totalValue}>¥{stats.total_amount.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Upcoming Reminders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>即将到期</Text>
            <TouchableOpacity onPress={() => router.push("/reminders")} activeOpacity={0.7}>
              <Text style={styles.seeAllText}>查看全部</Text>
            </TouchableOpacity>
          </View>
          {upcomingReminders.length === 0 ? (
            <View style={styles.emptyCard}>
              <FontAwesome6 name="bell-slash" size={24} color="#B2BEC3" />
              <Text style={styles.emptyText}>暂无待办提醒</Text>
            </View>
          ) : (
            upcomingReminders.map((reminder) => {
              const config = TYPE_CONFIG[reminder.type] || TYPE_CONFIG.other;
              const days = getDaysUntil(reminder.due_date);
              const isOverdue = days < 0;
              const isUrgent = days >= 0 && days <= 7;

              return (
                <View key={reminder.id} style={styles.reminderCard}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={[styles.reminderIcon, { backgroundColor: config.bg }]}>
                      <FontAwesome6 name={config.icon as any} size={18} color={config.color} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.reminderTitle}>{reminder.title}</Text>
                      <Text style={styles.reminderDate}>
                        {new Date(reminder.due_date).toLocaleDateString("zh-CN")}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.daysBadge,
                        isOverdue && styles.daysBadgeOverdue,
                        isUrgent && styles.daysBadgeUrgent,
                      ]}
                    >
                      <Text
                        style={[
                          styles.daysText,
                          isOverdue && styles.daysTextOverdue,
                          isUrgent && styles.daysTextUrgent,
                        ]}
                      >
                        {isOverdue ? `已过期${Math.abs(days)}天` : days === 0 ? "今天到期" : `还剩${days}天`}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* No Vehicle Prompt */}
        {vehicles.length === 0 && (
          <View style={styles.section}>
            <View style={styles.emptyCard}>
              <FontAwesome6 name="car-side" size={32} color="#B2BEC3" />
              <Text style={styles.emptyText}>还没有添加车辆</Text>
              <Text style={styles.emptySubText}>请先添加一辆车辆开始使用</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerArea: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#F0F4F8",
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563EB",
  },
  vehicleChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: "#FFFFFF",
    gap: 6,
    shadowColor: "#94A3B8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    ...(Platform.OS === "android" && { elevation: 2 }),
  },
  vehicleChipActive: {
    backgroundColor: "#2563EB",
  },
  vehicleChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  vehicleChipTextActive: {
    color: "#FFFFFF",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#94A3B8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    ...(Platform.OS === "android" && { elevation: 3 }),
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
  },
  totalCard: {
    backgroundColor: "#2563EB",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    ...(Platform.OS === "android" && { elevation: 5 }),
  },
  totalLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 4,
  },
  totalSubLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
  totalValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  reminderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#94A3B8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    ...(Platform.OS === "android" && { elevation: 2 }),
  },
  reminderIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },
  reminderDate: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  daysBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: "rgba(37,99,235,0.1)",
  },
  daysBadgeUrgent: {
    backgroundColor: "rgba(245,158,11,0.12)",
  },
  daysBadgeOverdue: {
    backgroundColor: "rgba(239,68,68,0.12)",
  },
  daysText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563EB",
  },
  daysTextUrgent: {
    color: "#F59E0B",
  },
  daysTextOverdue: {
    color: "#EF4444",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    shadowColor: "#94A3B8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    ...(Platform.OS === "android" && { elevation: 2 }),
  },
  emptyText: {
    fontSize: 15,
    color: "#64748B",
    marginTop: 12,
    fontWeight: "600",
  },
  emptySubText: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
