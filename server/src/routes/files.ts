import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import { getSupabaseClient } from "../storage/database/supabase-client.js";

const router = Router();
const client = getSupabaseClient();

const S3_ENDPOINT = process.env.COZE_BUCKET_ENDPOINT_URL || "";
const BUCKET_NAME = process.env.COZE_BUCKET_NAME || "";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

// Helper: Generate presigned URL (simplified - returns direct URL)
function getPresignedUrl(fileKey: string): string {
  // For Coze S3 proxy, construct direct access URL
  return `${S3_ENDPOINT}/${BUCKET_NAME}/${fileKey}?expires=86400`;
}

// Helper: Upload file to S3 via fetch
async function uploadToS3(buffer: Buffer, fileKey: string, contentType: string): Promise<void> {
  const url = `${S3_ENDPOINT}/${BUCKET_NAME}/${fileKey}`;
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    body: buffer,
  });
  if (!response.ok) {
    throw new Error(`S3 upload failed: ${response.status} ${response.statusText}`);
  }
}

// Helper: Delete file from S3 via fetch
async function deleteFromS3(fileKey: string): Promise<void> {
  const url = `${S3_ENDPOINT}/${BUCKET_NAME}/${fileKey}`;
  await fetch(url, {
    method: "DELETE",
  });
}

// GET /api/v1/files - List files (optional vehicle_id & category filter)
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
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

    // Add URLs to files
    const filesWithUrls = (data || []).map((file) => ({
      ...file,
      url: getPresignedUrl(file.file_key),
    }));

    res.json(filesWithUrls);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/files/upload - Upload a file
router.post("/upload", upload.single("file"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { vehicle_id, category } = req.body;
    if (!vehicle_id || !req.file) {
      res.status(400).json({ error: "缺少必填字段或文件" });
      return;
    }

    const { buffer, originalname, mimetype, size } = req.file;
    const fileKey = `vehicle-files/${Date.now()}-${originalname}`;

    // Upload to S3
    await uploadToS3(buffer, fileKey, mimetype);

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

    res.status(201).json({ ...data, url: getPresignedUrl(fileKey) });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/files/:id/url - Get URL for a file
router.get("/:id/url", async (req: Request, res: Response, next: NextFunction) => {
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

    res.json({ url: getPresignedUrl(data.file_key) });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/files/:id - Delete a file
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
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
      await deleteFromS3(file.file_key);
    } catch {
      // Continue even if S3 delete fails
    }

    // Delete from database
    const { error } = await client
      .from("vehicle_files")
      .delete()
      .eq("id", Number(id));
    if (error) throw new Error(error.message);

    res.json({ message: "文件已删除" });
  } catch (err) {
    next(err);
  }
});

export default router;
