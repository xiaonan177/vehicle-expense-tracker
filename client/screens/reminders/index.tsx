import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { Screen } from "@/components/Screen";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome6 } from "@expo/vector-icons";
import { useSafeRouter } from "@/hooks/useSafeRouter";

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface Reminder {
  id: number;
  vehicle_id: number;
  type: string;
  title: string;
  due_date: string;
  notes: string;
  is_completed: boolean;
}

interface Vehicle {
  id: number;
  name: string;
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

export default function RemindersScreen() {
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("pending");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [remindersRes, vehiclesRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/reminders`),
        fetch(`${API_BASE}/api/v1/vehicles`),
      ]);
      const remindersData = await remindersRes.json();
      const vehiclesData = await vehiclesRes.json();
      setReminders(remindersData);
      setVehicles(vehiclesData);
    } catch (err) {
      console.error("Failed to fetch reminders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleToggleComplete = async (reminder: Reminder) => {
    try {
      /**
       * 服务端文件：server/src/routes/reminders.ts
       * 接口：PUT /api/v1/reminders/:id
       * Path 参数：id: number
       * Body 参数：is_completed: boolean
       */
      await fetch(`${API_BASE}/api/v1/reminders/${reminder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_completed: !reminder.is_completed }),
      });
      fetchData();
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert("删除确认", "确定要删除这条提醒吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: async () => {
          try {
            /**
             * 服务端文件：server/src/routes/reminders.ts
             * 接口：DELETE /api/v1/reminders/:id
             * Path 参数：id: number
             */
            await fetch(`${API_BASE}/api/v1/reminders/${id}`, { method: "DELETE" });
            fetchData();
          } catch (err) {
            console.error("Delete failed:", err);
          }
        },
      },
    ]);
  };

  const filteredReminders = reminders.filter((r) => {
    if (filter === "pending") return !r.is_completed;
    if (filter === "completed") return r.is_completed;
    return true;
  });

  const getVehicleName = (vehicleId: number) => {
    const v = vehicles.find((v) => v.id === vehicleId);
    return v?.name || "未知车辆";
  };

  const renderItem = ({ item }: { item: Reminder }) => {
    const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.other;
    const days = getDaysUntil(item.due_date);
    const isOverdue = days < 0 && !item.is_completed;
    const isUrgent = days >= 0 && days <= 7 && !item.is_completed;

    return (
      <TouchableOpacity
        style={[styles.card, item.is_completed && styles.cardCompleted]}
        activeOpacity={0.7}
        onLongPress={() => !item.is_completed && handleDelete(item.id)}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {/* Complete Toggle */}
          <TouchableOpacity
            style={[
              styles.checkBtn,
              item.is_completed && styles.checkBtnActive,
            ]}
            onPress={() => handleToggleComplete(item)}
            activeOpacity={0.7}
          >
            {item.is_completed && (
              <FontAwesome6 name="check" size={14} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          <View style={[styles.iconWrap, { backgroundColor: config.bg, marginLeft: 12 }]}>
            <FontAwesome6 name={config.icon as any} size={18} color={config.color} />
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.cardTitle, item.is_completed && styles.textCompleted]}>
              {item.title}
            </Text>
            <Text style={styles.cardSub}>
              {getVehicleName(item.vehicle_id)} · {new Date(item.due_date).toLocaleDateString("zh-CN")}
            </Text>
          </View>

          {!item.is_completed && (
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
                {isOverdue ? `过期${Math.abs(days)}天` : days === 0 ? "今天" : `${days}天`}
              </Text>
            </View>
          )}
        </View>
        {item.notes ? (
          <Text style={[styles.notesText, item.is_completed && styles.textCompleted]} numberOfLines={2}>
            {item.notes}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <Screen safeAreaEdges={["left", "right", "bottom"]} backgroundColor="#F0F4F8">
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.pageTitle}>到期提醒</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push("/reminders/add")}
          activeOpacity={0.7}
        >
          <FontAwesome6 name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>添加</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(["pending", "all", "completed"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f === "pending" ? "待处理" : f === "all" ? "全部" : "已完成"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : filteredReminders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome6 name="bell-slash" size={40} color="#B2BEC3" />
          <Text style={styles.emptyText}>
            {filter === "pending" ? "暂无待处理提醒" : filter === "completed" ? "暂无已完成提醒" : "暂无提醒"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredReminders}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "#F0F4F8",
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
    gap: 6,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    ...(Platform.OS === "android" && { elevation: 4 }),
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
    backgroundColor: "#FFFFFF",
  },
  filterChipActive: {
    backgroundColor: "#2563EB",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#94A3B8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    ...(Platform.OS === "android" && { elevation: 2 }),
  },
  cardCompleted: {
    opacity: 0.6,
  },
  checkBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
  },
  checkBtnActive: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },
  cardSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 3,
  },
  textCompleted: {
    textDecorationLine: "line-through",
    color: "#94A3B8",
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
  notesText: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 8,
    paddingLeft: 52,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 120,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 16,
  },
});
