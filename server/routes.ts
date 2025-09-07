import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { insertNewspaperSchema, insertArticleSchema } from "@shared/schema";
import type { Request, Response } from "express";

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

  // Alternative JSON route to create a newspaper when file is already uploaded to Telegram
  app.post("/api/newspapers/json", async (req: Request, res: Response) => {
    try {
      const newspaperData = {
        name: req.body.name,
        date: req.body.date,
        filePath: req.body.filePath, // can be a local path or tg:<file_id>
        originalFileName: req.body.originalFileName,
        fileSize: req.body.fileSize,
        mimeType: req.body.mimeType,
        status: req.body.status || 'uploaded',
      };
      const validatedData = insertNewspaperSchema.parse(newspaperData);
      const newspaper = await storage.createNewspaper(validatedData);
      res.status(201).json(newspaper);
    } catch (error) {
      console.error("Error creating newspaper (JSON):", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Creation failed" });
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

  // Telegram Bot API integration
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID; // numeric chat id (negative for channels)

  // Upload a document to Telegram channel via Bot API and return file_id
  app.post("/api/tg/upload", upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!BOT_TOKEN || !CHANNEL_ID) {
        return res.status(500).json({ message: "Telegram is not configured (set TELEGRAM_BOT_TOKEN and TELEGRAM_CHANNEL_ID)" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileBuffer = await fs.promises.readFile(req.file.path);
      const fileBlob = new Blob([fileBuffer], { type: req.file.mimetype });
      const form = new FormData();
      form.append("chat_id", CHANNEL_ID);
      form.append("document", fileBlob, req.file.originalname);
      if (req.body.caption) form.append("caption", req.body.caption);

      const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
        method: "POST",
        body: form as any,
      });
      const tgJson = await tgRes.json();
      if (!tgRes.ok || !tgJson.ok) {
        const msg = tgJson?.description || tgRes.statusText;
        return res.status(502).json({ message: `Telegram upload failed: ${msg}` });
      }

      const fileId: string | undefined = tgJson.result?.document?.file_id;
      return res.json({
        ok: true,
        file_id: fileId,
        original: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      });
    } catch (error) {
      console.error("Error uploading to Telegram:", error);
      return res.status(500).json({ message: "Failed to upload to Telegram" });
    }
  });

  // Proxy a Telegram file_id to a downloadable stream without exposing bot token
  app.get("/api/tg/file/:fileId", async (req: Request, res: Response) => {
    try {
      if (!BOT_TOKEN) {
        return res.status(500).json({ message: "Telegram is not configured (set TELEGRAM_BOT_TOKEN)" });
      }
      const { fileId } = req.params;
      const getFileRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${encodeURIComponent(fileId)}`);
      const getFileJson: any = await getFileRes.json();
      if (!getFileRes.ok || !getFileJson.ok) {
        const msg = getFileJson?.description || getFileRes.statusText;
        return res.status(502).json({ message: `Telegram getFile failed: ${msg}` });
      }

      const filePathTg: string = getFileJson.result.file_path;
      const downloadUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePathTg}`;
      const streamRes = await fetch(downloadUrl);
      if (!streamRes.ok) {
        return res.status(502).json({ message: `Telegram file download failed: ${streamRes.statusText}` });
      }

      // Pass through content headers
      const contentType = streamRes.headers.get("content-type");
      const contentLength = streamRes.headers.get("content-length");
      if (contentType) res.setHeader("Content-Type", contentType);
      if (contentLength) res.setHeader("Content-Length", contentLength);

      // Stream the body
      if (streamRes.body) {
        const reader = (streamRes.body as any).getReader?.();
        if (reader) {
          res.flushHeaders?.();
          const pump = async () => {
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              res.write(Buffer.from(value));
            }
            res.end();
          };
          pump();
          return;
        }
      }

      const arrayBuf = await streamRes.arrayBuffer();
      res.end(Buffer.from(arrayBuf));
    } catch (error) {
      console.error("Error proxying Telegram file:", error);
      return res.status(500).json({ message: "Failed to proxy Telegram file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
