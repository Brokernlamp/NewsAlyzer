import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { insertNewspaperSchema, insertArticleSchema } from "@shared/schema";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_multer,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Newspaper routes
  app.post("/api/newspapers", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const newspaperData = {
        name: req.body.name,
        date: req.body.date,
        filePath: req.file.path,
        originalFileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      };

      const validatedData = insertNewspaperSchema.parse(newspaperData);
      const newspaper = await storage.createNewspaper(validatedData);
      
      res.status(201).json(newspaper);
    } catch (error) {
      console.error("Error uploading newspaper:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Upload failed" });
    }
  });

  app.get("/api/newspapers", async (req, res) => {
    try {
      const newspapers = await storage.getNewspapers();
      res.json(newspapers);
    } catch (error) {
      console.error("Error fetching newspapers:", error);
      res.status(500).json({ message: "Failed to fetch newspapers" });
    }
  });

  app.get("/api/newspapers/:id", async (req, res) => {
    try {
      const newspaper = await storage.getNewspaperById(req.params.id);
      if (!newspaper) {
        return res.status(404).json({ message: "Newspaper not found" });
      }
      res.json(newspaper);
    } catch (error) {
      console.error("Error fetching newspaper:", error);
      res.status(500).json({ message: "Failed to fetch newspaper" });
    }
  });

  app.patch("/api/newspapers/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      await storage.updateNewspaperStatus(req.params.id, status);
      res.json({ message: "Status updated successfully" });
    } catch (error) {
      console.error("Error updating newspaper status:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  // Subject routes
  app.get("/api/subjects", async (req, res) => {
    try {
      const subjects = await storage.getUpscSubjects();
      res.json(subjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  app.get("/api/subjects/:id", async (req, res) => {
    try {
      const subject = await storage.getUpscSubjectById(req.params.id);
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      res.json(subject);
    } catch (error) {
      console.error("Error fetching subject:", error);
      res.status(500).json({ message: "Failed to fetch subject" });
    }
  });

  // Article routes
  app.post("/api/articles", async (req, res) => {
    try {
      const validatedData = insertArticleSchema.parse(req.body);
      const article = await storage.createArticle(validatedData);
      res.status(201).json(article);
    } catch (error) {
      console.error("Error creating article:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create article" });
    }
  });

  app.get("/api/subjects/:subjectId/articles", async (req, res) => {
    try {
      const { subjectId } = req.params;
      const { date } = req.query;
      
      let articles;
      if (date) {
        articles = await storage.getArticlesBySubjectAndDate(subjectId, date as string);
      } else {
        articles = await storage.getArticlesBySubjectId(subjectId);
      }
      
      res.json(articles);
    } catch (error) {
      console.error("Error fetching articles:", error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  app.get("/api/articles/:id", async (req, res) => {
    try {
      const article = await storage.getArticleById(req.params.id);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });

  app.get("/api/search", async (req, res) => {
    try {
      const { q: query, subject: subjectId } = req.query;
      if (!query) {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }
      
      const articles = await storage.searchArticles(query as string, subjectId as string);
      res.json(articles);
    } catch (error) {
      console.error("Error searching articles:", error);
      res.status(500).json({ message: "Failed to search articles" });
    }
  });

  // Serve uploaded files
  app.use("/uploads", (req, res, next) => {
    const filePath = path.join(uploadDir, req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: "File not found" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
