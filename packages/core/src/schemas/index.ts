import { z } from 'zod';

export const siteConfigSchema = z.object({
  title: z.string(),
  tagline: z.string().optional(),
  description: z.string(),
  institution: z.string(),
  logoUrl: z.string().optional(),
  contact: z.object({
    email: z.string().email(),
    phone: z.string(),
    address: z.string(),
    hours: z.string().optional()
  }),
  socialLinks: z.array(z.object({
    platform: z.string(),
    url: z.string().url()
  })).optional()
});

export const serviceSchema = z.object({
  title: z.string(),
  slug: z.string(),
  category: z.string(),
  summary: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  cost: z.string().default('Gratuit'),
  processingTime: z.string().optional(),
  requirements: z.array(z.string()).default([]),
  onlineServiceUrl: z.string().url().optional(),
  badgeText: z.string().optional(),
  featured: z.boolean().default(false)
});

export const newsSchema = z.object({
  title: z.string(),
  slug: z.string(),
  date: z.string(),
  category: z.string(),
  excerpt: z.string(),
  content: z.string().optional(),
  author: z.string().optional(),
  featuredImage: z.string().optional(),
  importantNotice: z.boolean().default(false)
});

export const faqSchema = z.object({
  question: z.string(),
  answer: z.string(),
  category: z.string().default('Général')
});

export const cmsSavePayloadSchema = z.object({
  drafts: z.record(z.string(), z.string()),
  filePath: z.string().optional()
});

export type SiteConfig = z.infer<typeof siteConfigSchema>;
export type Service = z.infer<typeof serviceSchema>;
export type News = z.infer<typeof newsSchema>;
export type Faq = z.infer<typeof faqSchema>;
export type CmsSavePayload = z.infer<typeof cmsSavePayloadSchema>;

