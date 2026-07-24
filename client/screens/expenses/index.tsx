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
  ScrollView,
} from "react-native";
import { Screen } from "@/components/Screen";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome6 } from "@expo/vector-icons";
import { useSafeRouter } from "@/hooks/useSafeRouter";

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface Expense {
  id: number;
  vehicle_id: number;
  type: string;
  amount: string;
  description: string;
  mileage: number;
  expense_date: string;
  created_at: string;
}

interface Vehicle {
  id: number;
  name: string;
}

const TYPE_MAP: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  fuel: { label: "加油", color: "#F59E0B", bg: "rgba(245,158,11,0.12)", icon: "gas-pump" },
  maintenance: { label: "维修", color: "#2563EB", bg: "rgba(37,99,235,0.12)", icon: "wrench" },
};

export default function ExpensesScreen() {
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [expensesRes, vehiclesRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/expenses${selectedVehicleId ? `?vehicle_id=${selectedVehicleId}` : ""}`),
        fetch(`${API_BASE}/api/v1/vehicles`),
      ]);
      const expensesData = await expensesRes.json();
      const vehiclesData = await vehiclesRes.json();
      setExpenses(expensesData);
      setVehicles(vehiclesData);
      if (vehiclesData.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(vehiclesData[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedVehicleId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleDelete = (id: number) => {
    Alert.alert("删除确认", "确定要删除这条费用记录吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: async () => {
          try {
            await fetch(`${API_BASE}/api/v1/expenses/${id}`, { method: "DELETE" });
            fetchData();
          } catch (err) {
            console.error("Delete failed:", err);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Expense }) => {
    const config = TYPE_MAP[item.type] || TYPE_MAP.fuel;
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onLongPress={() => handleDelete(item.id)}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={[styles.iconWrap, { backgroundColor: config.bg }]}>
            <FontAwesome6 name={config.icon as any} size={20} color={config.color} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.cardTitle}>
              {item.description || config.label}
            </Text>
            <Text style={styles.cardSub}>
              {new Date(item.expense_date).toLocaleDateString("zh-CN")}
              {item.mileage ? ` · ${item.mileage}km` : ""}
            </Text>
          </View>
          <Text style={[styles.amount, { color: config.color }]}>
            ¥{Number(item.amount).toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Screen safeAreaEdges={["left", "right", "bottom"]} backgroundColor="#F0F4F8">
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.pageTitle}>费用记录</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push("/expenses/add")}
          activeOpacity={0.7}
        >
          <FontAwesome6 name="plus" size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>记一笔</Text>
        </TouchableOpacity>
      </View>

      {/* Vehicle Filter */}
      {vehicles.length > 1 && (
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <TouchableOpacity
              style={[styles.filterChip, !selectedVehicleId && styles.filterChipActive]}
              onPress={() => setSelectedVehicleId(null)}
            >
              <Text style={[styles.filterChipText, !selectedVehicleId && styles.filterChipTextActive]}>全部</Text>
            </TouchableOpacity>
            {vehicles.map((v) => (
              <TouchableOpacity
                key={v.id}
                style={[styles.filterChip, selectedVehicleId === v.id && styles.filterChipActive]}
                onPress={() => setSelectedVehicleId(v.id)}
              >
                <Text style={[styles.filterChipText, selectedVehicleId === v.id && styles.filterChipTextActive]}>
                  {v.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : expenses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome6 name="receipt" size={40} color="#B2BEC3" />
          <Text style={styles.emptyText}>暂无费用记录</Text>
          <Text style={styles.emptySubText}>点击右上角「记一笔」开始记录</Text>
        </View>
      ) : (
        <FlatList
          data={expenses}
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
    paddingHorizontal: 20,
    marginBottom: 8,
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
    padding: 16,
    shadowColor: "#94A3B8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    ...(Platform.OS === "android" && { elevation: 2 }),
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
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
  amount: {
    fontSize: 18,
    fontWeight: "700",
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
  emptySubText: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 6,
  },
});
