import { type Newspaper, type InsertNewspaper, type UpscSubject, type InsertUpscSubject, type Article, type InsertArticle } from "@shared/schema";
import { randomUUID } from "crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface IStorage {
  // Newspaper operations
  createNewspaper(newspaper: InsertNewspaper): Promise<Newspaper>;
  getNewspapers(): Promise<Newspaper[]>;
  getNewspaperById(id: string): Promise<Newspaper | undefined>;
  updateNewspaperStatus(id: string, status: string): Promise<void>;
  
  // Subject operations
  getUpscSubjects(): Promise<UpscSubject[]>;
  getUpscSubjectById(id: string): Promise<UpscSubject | undefined>;
  getUpscSubjectBySlug(slug: string): Promise<UpscSubject | undefined>;
  createUpscSubject(subject: InsertUpscSubject): Promise<UpscSubject>;
  updateSubjectArticleCount(id: string, count: number): Promise<void>;
  
  // Article operations
  createArticle(article: InsertArticle): Promise<Article>;
  getArticlesBySubjectId(subjectId: string): Promise<Article[]>;
  getArticlesByDate(date: string): Promise<Article[]>;
  getArticlesBySubjectAndDate(subjectId: string, date: string): Promise<Article[]>;
  getArticleById(id: string): Promise<Article | undefined>;
  searchArticles(query: string, subjectId?: string): Promise<Article[]>;
  // Auth
  getUserByUsername?(username: string): Promise<{ id: string; username: string; passwordHash: string } | undefined>;
}

export class MemStorage implements IStorage {
  private newspapers: Map<string, Newspaper> = new Map();
  private upscSubjects: Map<string, UpscSubject> = new Map();
  private articles: Map<string, Article> = new Map();

  constructor() {
    // Initialize with default UPSC subjects
    this.initializeDefaultSubjects();
  }

  private initializeDefaultSubjects() {
    const defaultSubjects = [
      { name: "Economy", slug: "economy", description: "Economic policies, trade, budget, and financial matters" },
      { name: "Politics", slug: "politics", description: "Political developments, governance, and policy decisions" },
      { name: "International Relations", slug: "international-relations", description: "Foreign policy, diplomacy, and global affairs" },
      { name: "Environment", slug: "environment", description: "Environmental issues, climate change, and sustainability" },
      { name: "Science & Technology", slug: "science-technology", description: "Scientific developments and technological advances" },
      { name: "Social Issues", slug: "social-issues", description: "Society, culture, and social welfare matters" },
      { name: "History", slug: "history", description: "Historical events and their contemporary relevance" },
      { name: "Geography", slug: "geography", description: "Physical and human geography topics" },
      { name: "Current Affairs", slug: "current-affairs", description: "General current affairs and miscellaneous news" },
    ];

    defaultSubjects.forEach(subject => {
      const id = randomUUID();
      const upscSubject: UpscSubject = {
        id,
        ...subject,
        articleCount: 0,
      };
      this.upscSubjects.set(id, upscSubject);
    });
  }

  // Newspaper operations
  async createNewspaper(insertNewspaper: InsertNewspaper): Promise<Newspaper> {
    const id = randomUUID();
    const newspaper: Newspaper = {
      ...insertNewspaper,
      id,
      status: insertNewspaper.status || "uploaded",
      createdAt: new Date(),
    };
    this.newspapers.set(id, newspaper);
    return newspaper;
  }

  async getNewspapers(): Promise<Newspaper[]> {
    return Array.from(this.newspapers.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getNewspaperById(id: string): Promise<Newspaper | undefined> {
    return this.newspapers.get(id);
  }

  async updateNewspaperStatus(id: string, status: string): Promise<void> {
    const newspaper = this.newspapers.get(id);
    if (newspaper) {
      newspaper.status = status;
    }
  }

  // Subject operations
  async getUpscSubjects(): Promise<UpscSubject[]> {
    return Array.from(this.upscSubjects.values());
  }

  async getUpscSubjectById(id: string): Promise<UpscSubject | undefined> {
    return this.upscSubjects.get(id);
  }

  async getUpscSubjectBySlug(slug: string): Promise<UpscSubject | undefined> {
    return Array.from(this.upscSubjects.values()).find(subject => subject.slug === slug);
  }

  async createUpscSubject(insertSubject: InsertUpscSubject): Promise<UpscSubject> {
    const id = randomUUID();
    const subject: UpscSubject = {
      ...insertSubject,
      id,
      description: insertSubject.description || null,
      articleCount: insertSubject.articleCount || 0,
    };
    this.upscSubjects.set(id, subject);
    return subject;
  }

  async updateSubjectArticleCount(id: string, count: number): Promise<void> {
    const subject = this.upscSubjects.get(id);
    if (subject) {
      subject.articleCount = count;
    }
  }

  // Article operations
  async createArticle(insertArticle: InsertArticle): Promise<Article> {
    const id = randomUUID();
    const article: Article = {
      ...insertArticle,
      id,
      pdfPath: insertArticle.pdfPath || null,
      pageCount: insertArticle.pageCount || 1,
      readTime: insertArticle.readTime || 5,
      createdAt: new Date(),
    };
    this.articles.set(id, article);
    
    // Update subject article count
    const subjectArticles = await this.getArticlesBySubjectId(insertArticle.subjectId);
    await this.updateSubjectArticleCount(insertArticle.subjectId, subjectArticles.length + 1);
    
    return article;
  }

  async getArticlesBySubjectId(subjectId: string): Promise<Article[]> {
    return Array.from(this.articles.values())
      .filter(article => article.subjectId === subjectId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getArticlesByDate(date: string): Promise<Article[]> {
    return Array.from(this.articles.values())
      .filter(article => article.date === date)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getArticlesBySubjectAndDate(subjectId: string, date: string): Promise<Article[]> {
    return Array.from(this.articles.values())
      .filter(article => article.subjectId === subjectId && article.date === date)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getArticleById(id: string): Promise<Article | undefined> {
    return this.articles.get(id);
  }

  async searchArticles(query: string, subjectId?: string): Promise<Article[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.articles.values())
      .filter(article => {
        const matchesQuery = article.title.toLowerCase().includes(searchTerm) ||
                           article.summary.toLowerCase().includes(searchTerm) ||
                           article.content.toLowerCase().includes(searchTerm);
        const matchesSubject = !subjectId || article.subjectId === subjectId;
        return matchesQuery && matchesSubject;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

class SupabaseStorage implements IStorage {
  private client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  }

  async createNewspaper(newspaper: InsertNewspaper): Promise<Newspaper> {
    const { data, error } = await this.client
      .from("newspapers")
      .insert({
        name: newspaper.name,
        date: newspaper.date,
        file_path: newspaper.filePath,
        original_file_name: newspaper.originalFileName,
        file_size: newspaper.fileSize,
        mime_type: newspaper.mimeType,
        status: newspaper.status ?? 'uploaded',
      })
      .select()
      .single();
    if (error) throw error;
    // Map snake_case to our types
    return {
      id: data.id,
      name: data.name,
      date: data.date,
      filePath: data.file_path,
      originalFileName: data.original_file_name,
      fileSize: data.file_size,
      mimeType: data.mime_type,
      status: data.status,
      createdAt: new Date(data.created_at),
    } as Newspaper;
  }

  async getNewspapers(): Promise<Newspaper[]> {
    const { data, error } = await this.client
      .from("newspapers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((n: any) => ({
      id: n.id,
      name: n.name,
      date: n.date,
      filePath: n.file_path,
      originalFileName: n.original_file_name,
      fileSize: n.file_size,
      mimeType: n.mime_type,
      status: n.status,
      createdAt: new Date(n.created_at),
    }));
  }

  async getNewspaperById(id: string): Promise<Newspaper | undefined> {
    const { data, error } = await this.client
      .from("newspapers")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return undefined;
    return {
      id: data.id,
      name: data.name,
      date: data.date,
      filePath: data.file_path,
      originalFileName: data.original_file_name,
      fileSize: data.file_size,
      mimeType: data.mime_type,
      status: data.status,
      createdAt: new Date(data.created_at),
    } as Newspaper;
  }

  async updateNewspaperStatus(id: string, status: string): Promise<void> {
    const { error } = await this.client
      .from("newspapers")
      .update({ status })
      .eq("id", id);
    if (error) throw error;
  }

  async getUpscSubjects(): Promise<UpscSubject[]> {
    const { data, error } = await this.client.from("upsc_subjects").select("*");
    if (error) throw error;
    return (data || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description,
      articleCount: s.article_count,
    }));
  }

  async getUpscSubjectById(id: string): Promise<UpscSubject | undefined> {
    const { data } = await this.client.from("upsc_subjects").select("*").eq("id", id).single();
    if (!data) return undefined;
    return { id: data.id, name: data.name, slug: data.slug, description: data.description, articleCount: data.article_count };
  }

  async getUpscSubjectBySlug(slug: string): Promise<UpscSubject | undefined> {
    const { data } = await this.client.from("upsc_subjects").select("*").eq("slug", slug).single();
    if (!data) return undefined;
    return { id: data.id, name: data.name, slug: data.slug, description: data.description, articleCount: data.article_count };
  }

  async createUpscSubject(subject: InsertUpscSubject): Promise<UpscSubject> {
    const { data, error } = await this.client
      .from("upsc_subjects")
      .insert({ name: subject.name, slug: subject.slug, description: subject.description ?? null, article_count: subject.articleCount ?? 0 })
      .select()
      .single();
    if (error) throw error;
    return { id: data.id, name: data.name, slug: data.slug, description: data.description, articleCount: data.article_count };
  }

  async updateSubjectArticleCount(id: string, count: number): Promise<void> {
    const { error } = await this.client.from("upsc_subjects").update({ article_count: count }).eq("id", id);
    if (error) throw error;
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    const { data, error } = await this.client
      .from("articles")
      .insert({
        newspaper_id: article.newspaperId,
        subject_id: article.subjectId,
        title: article.title,
        content: article.content,
        summary: article.summary,
        date: article.date,
        pdf_path: article.pdfPath ?? null,
        page_count: article.pageCount ?? 1,
        read_time: article.readTime ?? 5,
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      newspaperId: data.newspaper_id,
      subjectId: data.subject_id,
      title: data.title,
      content: data.content,
      summary: data.summary,
      date: data.date,
      pdfPath: data.pdf_path,
      pageCount: data.page_count,
      readTime: data.read_time,
      createdAt: new Date(data.created_at),
    } as Article;
  }

  async getArticlesBySubjectId(subjectId: string): Promise<Article[]> {
    const { data, error } = await this.client
      .from("articles")
      .select("*")
      .eq("subject_id", subjectId)
      .order("date", { ascending: false });
    if (error) throw error;
    return (data || []).map((a: any) => ({
      id: a.id,
      newspaperId: a.newspaper_id,
      subjectId: a.subject_id,
      title: a.title,
      content: a.content,
      summary: a.summary,
      date: a.date,
      pdfPath: a.pdf_path,
      pageCount: a.page_count,
      readTime: a.read_time,
      createdAt: new Date(a.created_at),
    }));
  }

  async getArticlesByDate(date: string): Promise<Article[]> {
    const { data, error } = await this.client
      .from("articles")
      .select("*")
      .eq("date", date)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((a: any) => ({
      id: a.id,
      newspaperId: a.newspaper_id,
      subjectId: a.subject_id,
      title: a.title,
      content: a.content,
      summary: a.summary,
      date: a.date,
      pdfPath: a.pdf_path,
      pageCount: a.page_count,
      readTime: a.read_time,
      createdAt: new Date(a.created_at),
    }));
  }

  async getArticlesBySubjectAndDate(subjectId: string, date: string): Promise<Article[]> {
    const { data, error } = await this.client
      .from("articles")
      .select("*")
      .eq("subject_id", subjectId)
      .eq("date", date)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((a: any) => ({
      id: a.id,
      newspaperId: a.newspaper_id,
      subjectId: a.subject_id,
      title: a.title,
      content: a.content,
      summary: a.summary,
      date: a.date,
      pdfPath: a.pdf_path,
      pageCount: a.page_count,
      readTime: a.read_time,
      createdAt: new Date(a.created_at),
    }));
  }

  async getArticleById(id: string): Promise<Article | undefined> {
    const { data, error } = await this.client
      .from("articles")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return undefined;
    return {
      id: data.id,
      newspaperId: data.newspaper_id,
      subjectId: data.subject_id,
      title: data.title,
      content: data.content,
      summary: data.summary,
      date: data.date,
      pdfPath: data.pdf_path,
      pageCount: data.page_count,
      readTime: data.read_time,
      createdAt: new Date(data.created_at),
    } as Article;
  }

  async searchArticles(query: string, subjectId?: string): Promise<Article[]> {
    let q = this.client.from("articles").select("*").ilike("title", `%${query}%`);
    if (subjectId) q = q.eq("subject_id", subjectId);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map((a: any) => ({
      id: a.id,
      newspaperId: a.newspaper_id,
      subjectId: a.subject_id,
      title: a.title,
      content: a.content,
      summary: a.summary,
      date: a.date,
      pdfPath: a.pdf_path,
      pageCount: a.page_count,
      readTime: a.read_time,
      createdAt: new Date(a.created_at),
    })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getUserByUsername(username: string): Promise<{ id: string; username: string; passwordHash: string } | undefined> {
    const { data, error } = await this.client
      .from("users")
      .select("id, username, password_hash")
      .eq("username", username)
      .single();
    if (error || !data) return undefined;
    return { id: data.id, username: data.username, passwordHash: data.password_hash };
  }
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const storage: IStorage = (supabaseUrl && supabaseServiceKey)
  ? new SupabaseStorage(supabaseUrl, supabaseServiceKey)
  : new MemStorage();
