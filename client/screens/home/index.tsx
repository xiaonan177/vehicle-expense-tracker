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

interface MonthlyData {
  fuel: number;
  maintenance: number;
  purchase: number;
  paperwork: number;
  insurance_fee: number;
  count: number;
}

interface MonthlyStats {
  year: number;
  total_fuel: number;
  total_maintenance: number;
  total_purchase: number;
  total_paperwork: number;
  total_insurance_fee: number;
  total_amount: number;
  total_count: number;
  monthly: Record<number, MonthlyData>;
}

interface Reminder {
  id: number;
  type: string;
  title: string;
  due_date: string;
  is_completed: boolean;
}

const MONTH_NAMES = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  fuel: { label: "加油", color: "#F59E0B", bg: "rgba(245,158,11,0.12)", icon: "gas-pump" },
  maintenance: { label: "维修", color: "#2563EB", bg: "rgba(37,99,235,0.12)", icon: "wrench" },
  purchase: { label: "购车", color: "#3B82F6", bg: "rgba(59,130,246,0.12)", icon: "car" },
  paperwork: { label: "手续", color: "#8B5CF6", bg: "rgba(139,92,246,0.12)", icon: "file-lines" },
  insurance_fee: { label: "保险费", color: "#10B981", bg: "rgba(16,185,129,0.12)", icon: "shield-halved" },
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

function formatCurrency(amount: number): string {
  return `฿${amount.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"year" | "month">("year");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, remindersRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/expenses/monthly-stats?year=${selectedYear}`),
        fetch(`${API_BASE}/api/v1/reminders?is_completed=false`),
      ]);
      const statsData = await statsRes.json();
      const remindersData = await remindersRes.json();
      setStats(statsData);
      setReminders(remindersData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const upcomingReminders = reminders
    .filter((r) => !r.is_completed)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 4);

  // Get current view data
  const currentMonthData = stats?.monthly?.[selectedMonth] || { fuel: 0, maintenance: 0, purchase: 0, paperwork: 0, insurance_fee: 0, count: 0 };
  const displayFuel = viewMode === "year" ? (stats?.total_fuel || 0) : currentMonthData.fuel;
  const displayMaintenance = viewMode === "year" ? (stats?.total_maintenance || 0) : currentMonthData.maintenance;
  const displayPurchase = viewMode === "year" ? (stats?.total_purchase || 0) : currentMonthData.purchase;
  const displayPaperwork = viewMode === "year" ? (stats?.total_paperwork || 0) : currentMonthData.paperwork;
  const displayInsuranceFee = viewMode === "year" ? (stats?.total_insurance_fee || 0) : currentMonthData.insurance_fee;
  const displayTotal = viewMode === "year" ? (stats?.total_amount || 0) : (currentMonthData.fuel + currentMonthData.maintenance + currentMonthData.purchase + currentMonthData.paperwork + currentMonthData.insurance_fee);
  const displayCount = viewMode === "year" ? (stats?.total_count || 0) : currentMonthData.count;

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
          <Text style={styles.pageSubtitle}>加油费用看板</Text>
        </View>

        {/* Year / Month Toggle */}
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === "year" && styles.toggleBtnActive]}
              onPress={() => setViewMode("year")}
              activeOpacity={0.7}
            >
              <FontAwesome6 name="calendar" size={14} color={viewMode === "year" ? "#FFFFFF" : "#64748B"} />
              <Text style={[styles.toggleText, viewMode === "year" && styles.toggleTextActive]}>
                {selectedYear}年
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, viewMode === "month" && styles.toggleBtnActive]}
              onPress={() => setViewMode("month")}
              activeOpacity={0.7}
            >
              <FontAwesome6 name="calendar-day" size={14} color={viewMode === "month" ? "#FFFFFF" : "#64748B"} />
              <Text style={[styles.toggleText, viewMode === "month" && styles.toggleTextActive]}>
                {selectedMonth}月
              </Text>
            </TouchableOpacity>
          </View>

          {/* Month selector for month view */}
          {viewMode === "month" && (
            <View style={styles.monthSelector}>
              {MONTH_NAMES.map((name, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.monthChip, selectedMonth === idx + 1 && styles.monthChipActive]}
                  onPress={() => setSelectedMonth(idx + 1)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.monthChipText, selectedMonth === idx + 1 && styles.monthChipTextActive]}
                  >
                    {name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Year selector for year view */}
          {viewMode === "year" && (
            <View style={styles.yearSelector}>
              {[selectedYear - 1, selectedYear, selectedYear + 1].map((y) => (
                <TouchableOpacity
                  key={y}
                  style={[styles.yearChip, y === selectedYear && styles.yearChipActive]}
                  onPress={() => setSelectedYear(y)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.yearChipText, y === selectedYear && styles.yearChipTextActive]}>
                    {y}年
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Main Expense Dashboard Card */}
        <View style={styles.section}>
          <View style={styles.mainCard}>
            <View style={styles.mainCardHeader}>
              <View style={styles.mainCardIconWrap}>
                <FontAwesome6 name="chart-pie" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.mainCardTitle}>
                {viewMode === "year" ? `${selectedYear}年度总花费` : `${selectedMonth}月总花费`}
              </Text>
            </View>
            <Text style={styles.mainCardValue}>{formatCurrency(displayTotal)}</Text>
            <View style={styles.mainCardSubRow}>
              <View style={styles.mainCardSubItem}>
                <Text style={styles.mainCardSubLabel}>加油</Text>
                <Text style={styles.mainCardSubValue}>{formatCurrency(displayFuel)}</Text>
              </View>
              <View style={styles.mainCardDivider} />
              <View style={styles.mainCardSubItem}>
                <Text style={styles.mainCardSubLabel}>维修</Text>
                <Text style={styles.mainCardSubValue}>{formatCurrency(displayMaintenance)}</Text>
              </View>
              <View style={styles.mainCardDivider} />
              <View style={styles.mainCardSubItem}>
                <Text style={styles.mainCardSubLabel}>购车</Text>
                <Text style={styles.mainCardSubValue}>{formatCurrency(displayPurchase)}</Text>
              </View>
            </View>
            <View style={[styles.mainCardSubRow, { marginTop: 12 }]}>
              <View style={styles.mainCardSubItem}>
                <Text style={styles.mainCardSubLabel}>手续</Text>
                <Text style={styles.mainCardSubValue}>{formatCurrency(displayPaperwork)}</Text>
              </View>
              <View style={styles.mainCardDivider} />
              <View style={styles.mainCardSubItem}>
                <Text style={styles.mainCardSubLabel}>保险费</Text>
                <Text style={styles.mainCardSubValue}>{formatCurrency(displayInsuranceFee)}</Text>
              </View>
              <View style={styles.mainCardDivider} />
              <View style={styles.mainCardSubItem}>
                <Text style={styles.mainCardSubLabel}>总记录</Text>
                <Text style={styles.mainCardSubValue}>{displayCount} 笔</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Monthly Bar Chart (Year View) */}
        {viewMode === "year" && stats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>月度花费趋势</Text>
            <View style={styles.chartCard}>
              {(() => {
                const maxTotal = Math.max(...Object.values(stats.monthly).map((m) => m.fuel + m.maintenance + m.purchase + m.paperwork + m.insurance_fee), 1);
                return (
                  <View style={styles.chartContainer}>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                      const data = stats.monthly[m];
                      const total = data.fuel + data.maintenance + data.purchase + data.paperwork + data.insurance_fee;
                      const barHeight = Math.max((total / maxTotal) * 100, 4);
                      const isCurrentMonth = m === new Date().getMonth() + 1 && stats.year === new Date().getFullYear();
                      return (
                        <TouchableOpacity
                          key={m}
                          style={styles.chartBarWrap}
                          onPress={() => {
                            setSelectedMonth(m);
                            setViewMode("month");
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={styles.chartBarContainer}>
                            <View
                              style={[
                                styles.chartBar,
                                { height: barHeight },
                                isCurrentMonth && styles.chartBarCurrent,
                              ]}
                            />
                          </View>
                          <Text style={[styles.chartLabel, isCurrentMonth && styles.chartLabelCurrent]}>
                            {m}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })()}
            </View>
          </View>
        )}

        {/* Month Detail (Month View) */}
        {viewMode === "month" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{selectedMonth}月费用明细</Text>
            <View style={styles.detailRow}>
              <View style={styles.detailCard}>
                <View style={[styles.detailIconWrap, { backgroundColor: "rgba(245,158,11,0.12)" }]}>
                  <FontAwesome6 name="gas-pump" size={18} color="#F59E0B" />
                </View>
                <Text style={styles.detailLabel}>加油</Text>
                <Text style={[styles.detailValue, { color: "#F59E0B" }]}>
                  {formatCurrency(currentMonthData.fuel)}
                </Text>
              </View>
              <View style={styles.detailCard}>
                <View style={[styles.detailIconWrap, { backgroundColor: "rgba(37,99,235,0.12)" }]}>
                  <FontAwesome6 name="wrench" size={18} color="#2563EB" />
                </View>
                <Text style={styles.detailLabel}>维修</Text>
                <Text style={[styles.detailValue, { color: "#2563EB" }]}>
                  {formatCurrency(currentMonthData.maintenance)}
                </Text>
              </View>
              <View style={styles.detailCard}>
                <View style={[styles.detailIconWrap, { backgroundColor: "rgba(59,130,246,0.12)" }]}>
                  <FontAwesome6 name="car" size={18} color="#3B82F6" />
                </View>
                <Text style={styles.detailLabel}>购车</Text>
                <Text style={[styles.detailValue, { color: "#3B82F6" }]}>
                  {formatCurrency(currentMonthData.purchase)}
                </Text>
              </View>
            </View>
            <View style={[styles.detailRow, { marginTop: 12 }]}>
              <View style={styles.detailCard}>
                <View style={[styles.detailIconWrap, { backgroundColor: "rgba(139,92,246,0.12)" }]}>
                  <FontAwesome6 name="file-lines" size={18} color="#8B5CF6" />
                </View>
                <Text style={styles.detailLabel}>手续</Text>
                <Text style={[styles.detailValue, { color: "#8B5CF6" }]}>
                  {formatCurrency(currentMonthData.paperwork)}
                </Text>
              </View>
              <View style={styles.detailCard}>
                <View style={[styles.detailIconWrap, { backgroundColor: "rgba(16,185,129,0.12)" }]}>
                  <FontAwesome6 name="shield-halved" size={18} color="#10B981" />
                </View>
                <Text style={styles.detailLabel}>保险费</Text>
                <Text style={[styles.detailValue, { color: "#10B981" }]}>
                  {formatCurrency(currentMonthData.insurance_fee)}
                </Text>
              </View>
            </View>
            {/* Total for month */}
            <View style={styles.monthTotalCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View>
                  <Text style={styles.monthTotalLabel}>{selectedMonth}月总花费</Text>
                  <Text style={styles.monthTotalSub}>{currentMonthData.count} 笔记录</Text>
                </View>
                <Text style={styles.monthTotalValue}>{formatCurrency(displayTotal)}</Text>
              </View>
            </View>
          </View>
        )}

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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  // Toggle
  toggleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    gap: 6,
    shadowColor: "#94A3B8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    ...(Platform.OS === "android" && { elevation: 2 }),
  },
  toggleBtnActive: {
    backgroundColor: "#2563EB",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  toggleTextActive: {
    color: "#FFFFFF",
  },
  // Month selector
  monthSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  monthChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    shadowColor: "#94A3B8",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    ...(Platform.OS === "android" && { elevation: 1 }),
  },
  monthChipActive: {
    backgroundColor: "#2563EB",
  },
  monthChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  monthChipTextActive: {
    color: "#FFFFFF",
  },
  // Year selector
  yearSelector: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 4,
  },
  yearChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#94A3B8",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    ...(Platform.OS === "android" && { elevation: 1 }),
  },
  yearChipActive: {
    backgroundColor: "#2563EB",
  },
  yearChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  yearChipTextActive: {
    color: "#FFFFFF",
  },
  // Main card
  mainCard: {
    backgroundColor: "#2563EB",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    ...(Platform.OS === "android" && { elevation: 6 }),
  },
  mainCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  mainCardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  mainCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
  },
  mainCardValue: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  mainCardSubRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  mainCardSubItem: {
    flex: 1,
  },
  mainCardDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  mainCardSubLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 2,
  },
  mainCardSubValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  // Chart
  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#94A3B8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    ...(Platform.OS === "android" && { elevation: 3 }),
  },
  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 140,
    paddingTop: 8,
  },
  chartBarWrap: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  chartBarContainer: {
    height: 100,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  chartBar: {
    width: 16,
    borderRadius: 8,
    backgroundColor: "#DBEAFE",
  },
  chartBarCurrent: {
    backgroundColor: "#2563EB",
  },
  chartLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "500",
  },
  chartLabelCurrent: {
    color: "#2563EB",
    fontWeight: "700",
  },
  // Month detail
  detailRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  detailCard: {
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
  detailIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  monthTotalCard: {
    backgroundColor: "#0F172A",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    ...(Platform.OS === "android" && { elevation: 5 }),
  },
  monthTotalLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 4,
  },
  monthTotalSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
  },
  monthTotalValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  // Reminder
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
    color: "#94A3B8",
    marginTop: 2,
  },
  daysBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#F0F4F8",
  },
  daysBadgeOverdue: {
    backgroundColor: "rgba(239,68,68,0.1)",
  },
  daysBadgeUrgent: {
    backgroundColor: "rgba(245,158,11,0.1)",
  },
  daysText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  daysTextOverdue: {
    color: "#EF4444",
  },
  daysTextUrgent: {
    color: "#F59E0B",
  },
  // Empty
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    shadowColor: "#94A3B8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    ...(Platform.OS === "android" && { elevation: 2 }),
  },
  emptyText: {
    fontSize: 15,
    color: "#94A3B8",
    marginTop: 12,
    fontWeight: "500",
  },
});
