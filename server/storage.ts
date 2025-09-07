import { type Newspaper, type InsertNewspaper, type UpscSubject, type InsertUpscSubject, type Article, type InsertArticle } from "@shared/schema";
import { randomUUID } from "crypto";

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

export const storage = new MemStorage();
