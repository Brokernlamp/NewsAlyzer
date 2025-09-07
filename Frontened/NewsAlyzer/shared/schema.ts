import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const newspapers = pgTable("newspapers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  date: text("date").notNull(),
  filePath: text("file_path").notNull(),
  originalFileName: text("original_file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  status: text("status").notNull().default("uploaded"), // uploaded, processing, processed, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const upscSubjects = pgTable("upsc_subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  articleCount: integer("article_count").default(0).notNull(),
});

export const articles = pgTable("articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  newspaperId: varchar("newspaper_id").notNull().references(() => newspapers.id),
  subjectId: varchar("subject_id").notNull().references(() => upscSubjects.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  summary: text("summary").notNull(),
  date: text("date").notNull(),
  pdfPath: text("pdf_path"),
  pageCount: integer("page_count").default(1),
  readTime: integer("read_time").default(5), // in minutes
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNewspaperSchema = createInsertSchema(newspapers).omit({
  id: true,
  createdAt: true,
});

export const insertUpscSubjectSchema = createInsertSchema(upscSubjects).omit({
  id: true,
});

export const insertArticleSchema = createInsertSchema(articles).omit({
  id: true,
  createdAt: true,
});

export type InsertNewspaper = z.infer<typeof insertNewspaperSchema>;
export type InsertUpscSubject = z.infer<typeof insertUpscSubjectSchema>;
export type InsertArticle = z.infer<typeof insertArticleSchema>;

export type Newspaper = typeof newspapers.$inferSelect;
export type UpscSubject = typeof upscSubjects.$inferSelect;
export type Article = typeof articles.$inferSelect;
