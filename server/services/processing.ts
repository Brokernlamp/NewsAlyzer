import fs from "fs";
import path from "path";
import PDFParser from "pdf-parse";
import PDFDocument from "pdfkit";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { storage } from "../storage";

type Job = {
  newspaperId: string;
  name: string;
  date: string;
  filePath: string;
  mimeType: string;
};

type JobStatus = {
  id: string;
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  message?: string;
  startedAt?: Date;
  completedAt?: Date;
};

let latestStatus: JobStatus | null = null;
const queue: Job[] = [];
let running = false;

export function enqueueProcessingJob(job: Job) {
  queue.push(job);
  tick();
}

export function getLatestJobStatus(): JobStatus | null {
  return latestStatus;
}

async function tick() {
  if (running) return;
  const job = queue.shift();
  if (!job) return;
  running = true;
  const id = `${job.newspaperId}-${Date.now()}`;
  latestStatus = { id, status: "running", progress: 0, startedAt: new Date() };

  try {
    // 1) Load PDF text (images not handled here yet)
    latestStatus.message = "Extracting text"; latestStatus.progress = 10;
    const uploadsDir = path.join(process.cwd(), "uploads");
    const absPath = path.join(uploadsDir, path.basename(job.filePath));
    const dataBuffer = await fs.promises.readFile(absPath);
    const parsed = await PDFParser(dataBuffer);
    const text = parsed.text || "";

    // 2) Summarize/classify with Gemini
    latestStatus.message = "Summarizing with Gemini"; latestStatus.progress = 40;
    const summaries = await summarizeBySubject(text, job.date);

    // 3) Persist summaries as articles and generate per-subject PDFs
    latestStatus.message = "Generating PDFs"; latestStatus.progress = 70;
    const outDir = path.join(uploadsDir, "summaries", job.date);
    await fs.promises.mkdir(outDir, { recursive: true });

    for (const [subjectName, summary] of Object.entries(summaries)) {
      const pdfFilename = `${slugify(subjectName)}.pdf`;
      const pdfPath = path.join(outDir, pdfFilename);
      await writePdf(pdfPath, `${subjectName} - ${job.date}`, summary);

      // store article record
      await storage.createArticle({
        newspaperId: job.newspaperId,
        subjectId: await resolveSubjectId(subjectName),
        title: `${subjectName} Summary (${job.date})`,
        content: summary,
        summary,
        date: job.date,
        pdfPath: `summaries/${job.date}/${pdfFilename}`,
      } as any);
    }

    latestStatus.status = "completed";
    latestStatus.progress = 100;
    latestStatus.completedAt = new Date();
  } catch (e: any) {
    latestStatus.status = "failed";
    latestStatus.message = e?.message || String(e);
  } finally {
    running = false;
    setImmediate(tick);
  }
}

async function summarizeBySubject(text: string, date: string): Promise<Record<string, string>> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY not configured");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const subjects = await storage.getUpscSubjects();
  const subjectList = subjects.map(s => `- ${s.name}`).join("\n");

  const prompt = `You are an analyst creating UPSC subject-wise briefs. Given the raw newspaper text, extract concise bullets per subject only if relevant. Date: ${date}.
Subjects:\n${subjectList}
Return a strict JSON object mapping subject name to a short markdown summary (<= 10 bullets). Example: {"Economy":"- bullet...","Environment":"- bullet..."}`;

  const response = await model.generateContent([
    { text: prompt },
    { text }
  ]);
  const textOut = response.response.text();
  // try to parse JSON blob from output
  const json = safeJsonExtract(textOut);
  return json || {};
}

function safeJsonExtract(s: string): Record<string, string> | null {
  try {
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(s.slice(start, end + 1));
    }
    return null;
  } catch {
    return null;
  }
}

async function resolveSubjectId(name: string): Promise<string> {
  const subjects = await storage.getUpscSubjects();
  const found = subjects.find(s => s.name.toLowerCase() === name.toLowerCase());
  return found ? found.id : subjects[0].id;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

async function writePdf(filepath: string, title: string, body: string) {
  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);
    doc.fontSize(16).text(title, { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(body, { align: "left" });
    doc.end();
    stream.on("finish", () => resolve());
    stream.on("error", (e) => reject(e));
  });
}


