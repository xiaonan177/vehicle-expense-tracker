import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { getSupabaseClient } from "../storage/database/supabase-client.js";

const router = Router();
const client = getSupabaseClient();

// GET /api/v1/reminders - List reminders (optional vehicle_id, type, is_completed filter)
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { vehicle_id, type, is_completed } = req.query;

    let query = client
      .from("reminders")
      .select("id, vehicle_id, type, title, due_date, notes, is_completed, created_at")
      .order("due_date", { ascending: true });

    if (vehicle_id) {
      query = query.eq("vehicle_id", Number(vehicle_id));
    }
    if (type) {
      query = query.eq("type", type as string);
    }
    if (is_completed !== undefined) {
      query = query.eq("is_completed", is_completed === "true");
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/reminders - Create a reminder
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { vehicle_id, type, title, due_date, notes } = req.body;
    if (!vehicle_id || !type || !title || !due_date) {
      res.status(400).json({ error: "缺少必填字段" });
      return;
    }
    const { data, error } = await client
      .from("reminders")
      .insert({ vehicle_id: Number(vehicle_id), type, title, due_date, notes })
      .select()
      .single();
    if (error) throw new Error(error.message);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/reminders/:id - Update a reminder
router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { type, title, due_date, notes, is_completed } = req.body;
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (type !== undefined) updateData.type = type;
    if (title !== undefined) updateData.title = title;
    if (due_date !== undefined) updateData.due_date = due_date;
    if (notes !== undefined) updateData.notes = notes;
    if (is_completed !== undefined) updateData.is_completed = is_completed;

    const { data, error } = await client
      .from("reminders")
      .update(updateData)
      .eq("id", Number(id))
      .select()
      .single();
    if (error) throw new Error(error.message);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/reminders/:id - Delete a reminder
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { error } = await client
      .from("reminders")
      .delete()
      .eq("id", Number(id));
    if (error) throw new Error(error.message);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
