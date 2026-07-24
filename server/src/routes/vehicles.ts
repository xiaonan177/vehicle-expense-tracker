import { Router } from "express";
import { getSupabaseClient } from "../storage/database/supabase-client.js";

const router = Router();
const client = getSupabaseClient();

// GET /api/v1/vehicles - List all vehicles
router.get("/", async (_req, res, next) => {
  try {
    const { data, error } = await client
      .from("vehicles")
      .select("id, name, plate_number, brand, model, year, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/vehicles - Create a vehicle
router.post("/", async (req, res, next) => {
  try {
    const { name, plate_number, brand, model, year } = req.body;
    if (!name) {
      res.status(400).json({ error: "车辆名称不能为空" });
      return;
    }
    const { data, error } = await client
      .from("vehicles")
      .insert({ name, plate_number, brand, model, year })
      .select()
      .single();
    if (error) throw new Error(error.message);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/vehicles/:id - Get a single vehicle
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await client
      .from("vehicles")
      .select("*")
      .eq("id", Number(id))
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      res.status(404).json({ error: "车辆不存在" });
      return;
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/vehicles/:id - Update a vehicle
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, plate_number, brand, model, year } = req.body;
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updateData.name = name;
    if (plate_number !== undefined) updateData.plate_number = plate_number;
    if (brand !== undefined) updateData.brand = brand;
    if (model !== undefined) updateData.model = model;
    if (year !== undefined) updateData.year = year;

    const { data, error } = await client
      .from("vehicles")
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

// DELETE /api/v1/vehicles/:id - Delete a vehicle
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await client
      .from("vehicles")
      .delete()
      .eq("id", Number(id));
    if (error) throw new Error(error.message);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
