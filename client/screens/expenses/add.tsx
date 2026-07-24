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

export default function AddExpenseScreen() {
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [type, setType] = useState<"fuel" | "maintenance">("fuel");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [mileage, setMileage] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
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
    if (!amount || Number(amount) <= 0) {
      Alert.alert("提示", "请输入有效金额");
      return;
    }
    if (!expenseDate) {
      Alert.alert("提示", "请选择日期");
      return;
    }

    setSaving(true);
    try {
      /**
       * 服务端文件：server/src/routes/expenses.ts
       * 接口：POST /api/v1/expenses
       * Body 参数：vehicle_id: number, type: string, amount: string, description?: string, mileage?: number, expense_date: string
       */
      const res = await fetch(`${API_BASE}/api/v1/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_id: selectedVehicleId,
          type,
          amount,
          description: description || undefined,
          mileage: mileage ? Number(mileage) : undefined,
          expense_date: new Date(expenseDate).toISOString(),
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
          <Text style={styles.headerTitle}>记一笔费用</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Type Selector */}
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeBtn, type === "fuel" && styles.typeBtnActive]}
              onPress={() => setType("fuel")}
              activeOpacity={0.7}
            >
              <FontAwesome6
                name="gas-pump"
                size={18}
                color={type === "fuel" ? "#FFFFFF" : "#F59E0B"}
              />
              <Text style={[styles.typeBtnText, type === "fuel" && styles.typeBtnTextActive]}>
                加油
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, type === "maintenance" && styles.typeBtnActiveMaint]}
              onPress={() => setType("maintenance")}
              activeOpacity={0.7}
            >
              <FontAwesome6
                name="wrench"
                size={18}
                color={type === "maintenance" ? "#FFFFFF" : "#2563EB"}
              />
              <Text style={[styles.typeBtnText, type === "maintenance" && styles.typeBtnTextActive]}>
                维修
              </Text>
            </TouchableOpacity>
          </View>

          {/* Amount Input */}
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>金额 (泰铢)</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.currencySign}>฿</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="#B2BEC3"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.formCard}>
            {/* Vehicle Selector */}
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

            {/* Date */}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>日期</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#B2BEC3"
                value={expenseDate}
                onChangeText={setExpenseDate}
              />
            </View>

            {/* Mileage */}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>里程 (km)</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="当前里程数"
                placeholderTextColor="#B2BEC3"
                keyboardType="number-pad"
                value={mileage}
                onChangeText={setMileage}
              />
            </View>

            {/* Description */}
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>备注</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="添加备注..."
                placeholderTextColor="#B2BEC3"
                value={description}
                onChangeText={setDescription}
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
              {saving ? "保存中..." : "保存"}
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
  typeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    gap: 8,
    shadowColor: "#94A3B8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    ...(Platform.OS === "android" && { elevation: 2 }),
  },
  typeBtnActive: {
    backgroundColor: "#F59E0B",
  },
  typeBtnActiveMaint: {
    backgroundColor: "#2563EB",
  },
  typeBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748B",
  },
  typeBtnTextActive: {
    color: "#FFFFFF",
  },
  amountCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#94A3B8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    ...(Platform.OS === "android" && { elevation: 3 }),
  },
  amountLabel: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 8,
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencySign: {
    fontSize: 32,
    fontWeight: "700",
    color: "#0F172A",
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: "800",
    color: "#0F172A",
    padding: 0,
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
