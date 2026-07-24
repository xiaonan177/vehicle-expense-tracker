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
  Image,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Screen } from "@/components/Screen";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome6 } from "@expo/vector-icons";
import { createFormDataFile } from "@/utils";

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_BASE_URL;

interface VehicleFile {
  id: number;
  vehicle_id: number;
  file_name: string;
  file_key: string;
  file_type: string;
  category: string;
  file_size: number;
  created_at: string;
  url: string | null;
}

interface Vehicle {
  id: number;
  name: string;
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  photo: { label: "照片", color: "#F59E0B", bg: "rgba(245,158,11,0.12)", icon: "camera" },
  document: { label: "文档", color: "#2563EB", bg: "rgba(37,99,235,0.12)", icon: "file-lines" },
  insurance: { label: "保险", color: "#8B5CF6", bg: "rgba(139,92,246,0.12)", icon: "shield-halved" },
  inspection: { label: "年检", color: "#10B981", bg: "rgba(16,185,129,0.12)", icon: "clipboard-check" },
  other: { label: "其他", color: "#64748B", bg: "rgba(100,116,139,0.12)", icon: "folder" },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function isImageFile(mimeType: string): boolean {
  return mimeType?.startsWith("image/") || false;
}

export default function FilesScreen() {
  const insets = useSafeAreaInsets();
  const [files, setFiles] = useState<VehicleFile[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [filesRes, vehiclesRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/files${selectedVehicleId ? `?vehicle_id=${selectedVehicleId}` : ""}`),
        fetch(`${API_BASE}/api/v1/vehicles`),
      ]);
      const filesData = await filesRes.json();
      const vehiclesData = await vehiclesRes.json();
      setFiles(filesData);
      setVehicles(vehiclesData);
      if (vehiclesData.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(vehiclesData[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch files:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedVehicleId]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleUpload = async () => {
    if (!selectedVehicleId) {
      Alert.alert("提示", "请先添加车辆");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setUploading(true);

      const file = await createFormDataFile(
        asset.uri,
        asset.fileName || "file",
        asset.mimeType || "application/octet-stream"
      );

      const formData = new FormData();
      formData.append("file", file as any);
      formData.append("vehicle_id", String(selectedVehicleId));
      formData.append("category", isImageFile(asset.mimeType || "") ? "photo" : "document");

      /**
       * 服务端文件：server/src/routes/files.ts
       * 接口：POST /api/v1/files/upload
       * Body 参数：FormData (file: File, vehicle_id: string, category: string)
       */
      const res = await fetch(`${API_BASE}/api/v1/files/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("上传失败");
      fetchData();
    } catch (err) {
      Alert.alert("错误", "上传失败，请重试");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert("删除确认", "确定要删除这个文件吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: async () => {
          try {
            /**
             * 服务端文件：server/src/routes/files.ts
             * 接口：DELETE /api/v1/files/:id
             * Path 参数：id: number
             */
            await fetch(`${API_BASE}/api/v1/files/${id}`, { method: "DELETE" });
            fetchData();
          } catch (err) {
            console.error("Delete failed:", err);
          }
        },
      },
    ]);
  };

  const renderFileItem = ({ item }: { item: VehicleFile }) => {
    const config = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.other;
    const isImage = isImageFile(item.file_type);

    return (
      <TouchableOpacity
        style={styles.fileCard}
        activeOpacity={0.7}
        onLongPress={() => handleDelete(item.id)}
      >
        {isImage && item.url ? (
          <Image source={{ uri: item.url }} style={styles.fileThumbnail} resizeMode="cover" />
        ) : (
          <View style={[styles.fileIconWrap, { backgroundColor: config.bg }]}>
            <FontAwesome6 name={config.icon as any} size={24} color={config.color} />
          </View>
        )}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.fileName} numberOfLines={1}>
            {item.file_name}
          </Text>
          <Text style={styles.fileMeta}>
            {config.label} · {formatFileSize(item.file_size)} ·{" "}
            {new Date(item.created_at).toLocaleDateString("zh-CN")}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Screen safeAreaEdges={["left", "right", "bottom"]} backgroundColor="#F0F4F8">
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.pageTitle}>车辆文件</Text>
        <TouchableOpacity
          style={[styles.uploadBtn, uploading && { opacity: 0.6 }]}
          onPress={handleUpload}
          disabled={uploading}
          activeOpacity={0.7}
        >
          <FontAwesome6 name={uploading ? "spinner" : "upload"} size={14} color="#FFFFFF" spin={uploading} />
          <Text style={styles.uploadBtnText}>
            {uploading ? "上传中" : "上传"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Vehicle Filter */}
      {vehicles.length > 1 && (
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
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
      ) : files.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome6 name="folder-open" size={40} color="#B2BEC3" />
          <Text style={styles.emptyText}>暂无文件</Text>
          <Text style={styles.emptySubText}>点击「上传」添加车辆相关文件</Text>
        </View>
      ) : (
        <FlatList
          data={files}
          renderItem={renderFileItem}
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
  uploadBtn: {
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
  uploadBtnText: {
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
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#94A3B8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    ...(Platform.OS === "android" && { elevation: 2 }),
  },
  fileThumbnail: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  fileIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  fileName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },
  fileMeta: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
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
