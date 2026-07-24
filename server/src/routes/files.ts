import { Router } from "express";
import multer from "multer";
import { S3Storage } from "coze-coding-dev-sdk";
import { getSupabaseClient } from "../storage/database/supabase-client.js";

const router = Router();
const client = getSupabaseClient();

const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

// GET /api/v1/files - List files (optional vehicle_id & category filter)
router.get("/", async (req, res, next) => {
  try {
    const { vehicle_id, category } = req.query;

    let query = client
      .from("vehicle_files")
      .select("id, vehicle_id, file_name, file_key, file_type, category, file_size, created_at")
      .order("created_at", { ascending: false });

    if (vehicle_id) {
      query = query.eq("vehicle_id", Number(vehicle_id));
    }
    if (category) {
      query = query.eq("category", category as string);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    // Generate presigned URLs for each file
    const filesWithUrls = await Promise.all(
      (data || []).map(async (file) => {
        try {
          const url = await storage.generatePresignedUrl({
            key: file.file_key,
            expireTime: 86400,
          });
          return { ...file, url };
        } catch {
          return { ...file, url: null };
        }
      })
    );

    res.json(filesWithUrls);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/files/upload - Upload a file
router.post("/upload", upload.single("file"), async (req, res, next) => {
  try {
    const { vehicle_id, category } = req.body;
    if (!vehicle_id || !req.file) {
      res.status(400).json({ error: "缺少必填字段或文件" });
      return;
    }

    const { buffer, originalname, mimetype, size } = req.file;

    // Upload to S3
    const fileKey = await storage.uploadFile({
      fileContent: buffer,
      fileName: `vehicle-files/${originalname}`,
      contentType: mimetype,
    });

    // Save record to database
    const { data, error } = await client
      .from("vehicle_files")
      .insert({
        vehicle_id: Number(vehicle_id),
        file_name: originalname,
        file_key: fileKey,
        file_type: mimetype,
        category: category || "other",
        file_size: size,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Generate presigned URL
    const url = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 86400,
    });

    res.status(201).json({ ...data, url });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/files/:id/url - Get presigned URL for a file
router.get("/:id/url", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await client
      .from("vehicle_files")
      .select("file_key")
      .eq("id", Number(id))
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      res.status(404).json({ error: "文件不存在" });
      return;
    }

    const url = await storage.generatePresignedUrl({
      key: data.file_key,
      expireTime: 86400,
    });
    res.json({ url });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/files/:id - Delete a file
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: file, error: fetchError } = await client
      .from("vehicle_files")
      .select("file_key")
      .eq("id", Number(id))
      .maybeSingle();
    if (fetchError) throw new Error(fetchError.message);
    if (!file) {
      res.status(404).json({ error: "文件不存在" });
      return;
    }

    // Delete from S3
    try {
      await storage.deleteFile({ fileKey: file.file_key });
    } catch {
      // Continue even if S3 delete fails
    }

    // Delete from database
    const { error } = await client
      .from("vehicle_files")
      .delete()
      .eq("id", Number(id));
    if (error) throw new Error(error.message);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
