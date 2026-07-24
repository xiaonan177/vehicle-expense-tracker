import { Router } from "express";
import { getSupabaseClient } from "../storage/database/supabase-client.js";

const router = Router();
const client = getSupabaseClient();

// GET /api/v1/expenses - List expenses (with optional vehicle_id & type filter)
router.get("/", async (req, res, next) => {
  try {
    const { vehicle_id, type, limit: limitStr, offset: offsetStr } = req.query;
    const limit = limitStr ? Number(limitStr) : 50;
    const offset = offsetStr ? Number(offsetStr) : 0;

    let query = client
      .from("expenses")
      .select("id, vehicle_id, type, amount, description, mileage, attachment_key, attachment_name, expense_date, created_at")
      .order("expense_date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (vehicle_id) {
      query = query.eq("vehicle_id", Number(vehicle_id));
    }
    if (type) {
      query = query.eq("type", type as string);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/expenses/stats - Get expense statistics
router.get("/stats", async (req, res, next) => {
  try {
    const { vehicle_id } = req.query;

    let query = client
      .from("expenses")
      .select("id, type, amount, expense_date");

    if (vehicle_id) {
      query = query.eq("vehicle_id", Number(vehicle_id));
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const expenses = data || [];
    let totalFuel = 0;
    let totalMaintenance = 0;
    let totalPurchase = 0;
    let totalPaperwork = 0;
    let totalInsuranceFee = 0;
    let totalCount = expenses.length;

    for (const exp of expenses) {
      const amount = Number(exp.amount);
      if (exp.type === "fuel") totalFuel += amount;
      else if (exp.type === "maintenance") totalMaintenance += amount;
      else if (exp.type === "purchase") totalPurchase += amount;
      else if (exp.type === "paperwork") totalPaperwork += amount;
      else if (exp.type === "insurance_fee") totalInsuranceFee += amount;
    }

    res.json({
      total_fuel: Math.round(totalFuel * 100) / 100,
      total_maintenance: Math.round(totalMaintenance * 100) / 100,
      total_purchase: Math.round(totalPurchase * 100) / 100,
      total_paperwork: Math.round(totalPaperwork * 100) / 100,
      total_insurance_fee: Math.round(totalInsuranceFee * 100) / 100,
      total_amount: Math.round((totalFuel + totalMaintenance + totalPurchase + totalPaperwork + totalInsuranceFee) * 100) / 100,
      total_count: totalCount,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/expenses/monthly-stats - Get monthly fuel stats for dashboard
router.get("/monthly-stats", async (req, res, next) => {
  try {
    const { vehicle_id, year } = req.query;
    const targetYear = year ? Number(year) : new Date().getFullYear();

    let query = client
      .from("expenses")
      .select("id, type, amount, expense_date")
      .gte("expense_date", `${targetYear}-01-01T00:00:00Z`)
      .lt("expense_date", `${targetYear + 1}-01-01T00:00:00Z`);

    if (vehicle_id) {
      query = query.eq("vehicle_id", Number(vehicle_id));
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const expenses = data || [];
    // Group by month
    const monthlyData: Record<number, { fuel: number; maintenance: number; purchase: number; paperwork: number; insurance_fee: number; count: number }> = {};
    for (let m = 1; m <= 12; m++) {
      monthlyData[m] = { fuel: 0, maintenance: 0, purchase: 0, paperwork: 0, insurance_fee: 0, count: 0 };
    }

    for (const exp of expenses) {
      const month = new Date(exp.expense_date).getMonth() + 1;
      const amount = Number(exp.amount);
      if (exp.type === "fuel") monthlyData[month].fuel += amount;
      else if (exp.type === "maintenance") monthlyData[month].maintenance += amount;
      else if (exp.type === "purchase") monthlyData[month].purchase += amount;
      else if (exp.type === "paperwork") monthlyData[month].paperwork += amount;
      else if (exp.type === "insurance_fee") monthlyData[month].insurance_fee += amount;
      monthlyData[month].count += 1;
    }

    // Calculate yearly totals
    let totalFuel = 0;
    let totalMaintenance = 0;
    let totalPurchase = 0;
    let totalPaperwork = 0;
    let totalInsuranceFee = 0;
    let totalCount = 0;
    for (const m of Object.values(monthlyData)) {
      totalFuel += m.fuel;
      totalMaintenance += m.maintenance;
      totalPurchase += m.purchase;
      totalPaperwork += m.paperwork;
      totalInsuranceFee += m.insurance_fee;
      totalCount += m.count;
    }

    res.json({
      year: targetYear,
      total_fuel: Math.round(totalFuel * 100) / 100,
      total_maintenance: Math.round(totalMaintenance * 100) / 100,
      total_purchase: Math.round(totalPurchase * 100) / 100,
      total_paperwork: Math.round(totalPaperwork * 100) / 100,
      total_insurance_fee: Math.round(totalInsuranceFee * 100) / 100,
      total_amount: Math.round((totalFuel + totalMaintenance + totalPurchase + totalPaperwork + totalInsuranceFee) * 100) / 100,
      total_count: totalCount,
      monthly: monthlyData,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/expenses - Create an expense
router.post("/", async (req, res, next) => {
  try {
    const { vehicle_id, type, amount, description, mileage, attachment_key, attachment_name, expense_date } = req.body;
    if (!vehicle_id || !type || !amount || !expense_date) {
      res.status(400).json({ error: "缺少必填字段" });
      return;
    }
    const { data, error } = await client
      .from("expenses")
      .insert({ vehicle_id: Number(vehicle_id), type, amount: String(amount), description, mileage, attachment_key, attachment_name, expense_date })
      .select()
      .single();
    if (error) throw new Error(error.message);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/expenses/:id - Get a single expense
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await client
      .from("expenses")
      .select("*")
      .eq("id", Number(id))
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      res.status(404).json({ error: "费用记录不存在" });
      return;
    }
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/expenses/:id - Update an expense
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, amount, description, mileage, attachment_key, attachment_name, expense_date } = req.body;
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (type !== undefined) updateData.type = type;
    if (amount !== undefined) updateData.amount = String(amount);
    if (description !== undefined) updateData.description = description;
    if (mileage !== undefined) updateData.mileage = mileage;
    if (attachment_key !== undefined) updateData.attachment_key = attachment_key;
    if (attachment_name !== undefined) updateData.attachment_name = attachment_name;
    if (expense_date !== undefined) updateData.expense_date = expense_date;

    const { data, error } = await client
      .from("expenses")
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

// DELETE /api/v1/expenses/:id - Delete an expense
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await client
      .from("expenses")
      .delete()
      .eq("id", Number(id));
    if (error) throw new Error(error.message);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
