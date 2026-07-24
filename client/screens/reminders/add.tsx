import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { Screen } from "@/components/Screen";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome6 } from "@expo/vector-icons";
import { useSafeRouter } from "@/hooks/useSafeRouter";

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface Vehicle {
  id: number;
  name: string;
}

const TYPE_OPTIONS = [
  { value: "fuel", label: "加油", icon: "gas-pump", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  { value: "maintenance", label: "维修", icon: "wrench", color: "#2563EB", bg: "rgba(37,99,235,0.12)" },
  { value: "insurance", label: "保险", icon: "shield-halved", color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
  { value: "inspection", label: "年检", icon: "clipboard-check", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  { value: "other", label: "其他", icon: "ellipsis", color: "#64748B", bg: "rgba(100,116,139,0.12)" },
];

export default function AddReminderScreen() {
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [type, setType] = useState("maintenance");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/vehicles`)
      .then((res) => res.json())
      .then((data) => {
        setVehicles(data);
        if (data.length > 0) setSelectedVehicleId(data[0].id);
      })
      .catch(console.error);
  }, []);

  const handleSave = async () => {
    if (!selectedVehicleId) {
      Alert.alert("提示", "请先添加车辆");
      return;
    }
    if (!title.trim()) {
      Alert.alert("提示", "请输入提醒标题");
      return;
    }
    if (!dueDate) {
      Alert.alert("提示", "请选择到期日期");
      return;
    }

    setSaving(true);
    try {
      /**
       * 服务端文件：server/src/routes/reminders.ts
       * 接口：POST /api/v1/reminders
       * Body 参数：vehicle_id: number, type: string, title: string, due_date: string, notes?: string
       */
      const res = await fetch(`${API_BASE}/api/v1/reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_id: selectedVehicleId,
          type,
          title: title.trim(),
          due_date: new Date(dueDate).toISOString(),
          notes: notes.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("保存失败");
      router.back();
    } catch (err) {
      Alert.alert("错误", "保存失败，请重试");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen safeAreaEdges={["left", "right", "bottom"]} backgroundColor="#F0F4F8">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <FontAwesome6 name="arrow-left" size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>添加提醒</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Type Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>提醒类型</Text>
            <View style={styles.typeGrid}>
              {TYPE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.typeItem,
                    type === opt.value && { backgroundColor: opt.bg, borderColor: opt.color },
                  ]}
                  onPress={() => setType(opt.value)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.typeIconWrap, { backgroundColor: type === opt.value ? opt.bg : "transparent" }]}>
                    <FontAwesome6
                      name={opt.icon}
                      size={20}
                      color={type === opt.value ? opt.color : "#94A3B8"}
                    />
                  </View>
                  <Text
                    style={[
                      styles.typeLabel,
                      type === opt.value && { color: opt.color, fontWeight: "700" },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            {/* Vehicle */}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>车辆</Text>
              <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {vehicles.map((v) => (
                    <TouchableOpacity
                      key={v.id}
                      style={[
                        styles.vehicleOption,
                        selectedVehicleId === v.id && styles.vehicleOptionActive,
                      ]}
                      onPress={() => setSelectedVehicleId(v.id)}
                    >
                      <Text
                        style={[
                          styles.vehicleOptionText,
                          selectedVehicleId === v.id && styles.vehicleOptionTextActive,
                        ]}
                      >
                        {v.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Title */}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>标题</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="如：车险续保、年检到期..."
                placeholderTextColor="#B2BEC3"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Due Date */}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>到期日期</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#B2BEC3"
                value={dueDate}
                onChangeText={setDueDate}
              />
            </View>

            {/* Notes */}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>备注</Text>
              <TextInput
                style={[styles.fieldInput, { minHeight: 80, textAlignVertical: "top" }]}
                placeholder="添加备注信息..."
                placeholderTextColor="#B2BEC3"
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.7}
          >
            <Text style={styles.saveBtnText}>
              {saving ? "保存中..." : "保存提醒"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 10,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  typeItem: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "transparent",
    minWidth: 72,
    shadowColor: "#94A3B8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    ...(Platform.OS === "android" && { elevation: 1 }),
  },
  typeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#94A3B8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    ...(Platform.OS === "android" && { elevation: 3 }),
  },
  fieldRow: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 8,
  },
  fieldInput: {
    fontSize: 15,
    color: "#0F172A",
    backgroundColor: "#F0F4F8",
    borderRadius: 12,
    padding: 14,
  },
  vehicleOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: "#F0F4F8",
  },
  vehicleOptionActive: {
    backgroundColor: "#2563EB",
  },
  vehicleOptionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  vehicleOptionTextActive: {
    color: "#FFFFFF",
  },
  saveBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    ...(Platform.OS === "android" && { elevation: 5 }),
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
