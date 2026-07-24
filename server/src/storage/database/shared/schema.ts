import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  text,
  numeric,
  timestamp,
  boolean,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

// Keep system table
export const healthCheck = pgTable("health_check", {
  id: serial().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

// ========== Vehicles ==========
export const vehicles = pgTable(
  "vehicles",
  {
    id: serial().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    plate_number: varchar("plate_number", { length: 20 }),
    brand: varchar("brand", { length: 100 }),
    model: varchar("model", { length: 100 }),
    year: integer("year"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("vehicles_plate_number_idx").on(table.plate_number),
    index("vehicles_created_at_idx").on(table.created_at),
  ]
);

// ========== Expenses ==========
export const expenses = pgTable(
  "expenses",
  {
    id: serial().primaryKey(),
    vehicle_id: integer("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 20 }).notNull(), // 'fuel' | 'maintenance'
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    description: text("description"),
    mileage: integer("mileage"),
    attachment_key: text("attachment_key"),
    attachment_name: varchar("attachment_name", { length: 255 }),
    expense_date: timestamp("expense_date", { withTimezone: true }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("expenses_vehicle_id_idx").on(table.vehicle_id),
    index("expenses_type_idx").on(table.type),
    index("expenses_expense_date_idx").on(table.expense_date),
  ]
);

// ========== Vehicle Files ==========
export const vehicleFiles = pgTable(
  "vehicle_files",
  {
    id: serial().primaryKey(),
    vehicle_id: integer("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    file_name: varchar("file_name", { length: 255 }).notNull(),
    file_key: text("file_key").notNull(),
    file_type: varchar("file_type", { length: 100 }),
    category: varchar("category", { length: 50 }), // 'photo' | 'document' | 'insurance' | 'inspection' | 'other'
    file_size: integer("file_size"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("vehicle_files_vehicle_id_idx").on(table.vehicle_id),
    index("vehicle_files_category_idx").on(table.category),
    index("vehicle_files_created_at_idx").on(table.created_at),
  ]
);

// ========== Reminders ==========
export const reminders = pgTable(
  "reminders",
  {
    id: serial().primaryKey(),
    vehicle_id: integer("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 20 }).notNull(), // 'fuel' | 'maintenance' | 'insurance' | 'inspection' | 'other'
    title: varchar("title", { length: 200 }).notNull(),
    due_date: timestamp("due_date", { withTimezone: true }).notNull(),
    notes: text("notes"),
    is_completed: boolean("is_completed").default(false).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("reminders_vehicle_id_idx").on(table.vehicle_id),
    index("reminders_type_idx").on(table.type),
    index("reminders_due_date_idx").on(table.due_date),
    index("reminders_is_completed_idx").on(table.is_completed),
  ]
);

// ========== Zod Schemas ==========
const { createInsertSchema: createCoercedInsertSchema } = createSchemaFactory({
  coerce: { date: true },
});

export const insertVehicleSchema = createCoercedInsertSchema(vehicles).pick({
  name: true,
  plate_number: true,
  brand: true,
  model: true,
  year: true,
});
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export const insertExpenseSchema = createCoercedInsertSchema(expenses).pick({
  vehicle_id: true,
  type: true,
  amount: true,
  description: true,
  mileage: true,
  attachment_key: true,
  attachment_name: true,
  expense_date: true,
});
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export const insertVehicleFileSchema = createCoercedInsertSchema(vehicleFiles).pick({
  vehicle_id: true,
  file_name: true,
  file_key: true,
  file_type: true,
  category: true,
  file_size: true,
});
export type VehicleFile = typeof vehicleFiles.$inferSelect;
export type InsertVehicleFile = z.infer<typeof insertVehicleFileSchema>;

export const insertReminderSchema = createCoercedInsertSchema(reminders).pick({
  vehicle_id: true,
  type: true,
  title: true,
  due_date: true,
  notes: true,
  is_completed: true,
});
export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;
