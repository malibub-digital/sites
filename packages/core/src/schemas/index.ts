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

export const cmsSaveOperationSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('ADD_ARRAY_ITEM'),
    arrayPath: z.string(),
    defaultData: z.record(z.string(), z.any()).optional(),
  }),
  z.object({
    type: z.literal('DELETE_ARRAY_ITEM'),
    arrayPath: z.string(),
    index: z.number().int().min(0),
  }),
  z.object({
    type: z.literal('REORDER_ARRAY_ITEM'),
    arrayPath: z.string(),
    fromIndex: z.number().int().min(0),
    toIndex: z.number().int().min(0),
  }),
  z.object({
    type: z.literal('CREATE_CONTENT_FILE'),
    collection: z.string(),
    slug: z.string(),
    frontmatter: z.record(z.string(), z.any()),
    content: z.string().optional(),
  }),
  z.object({
    type: z.literal('DELETE_CONTENT_FILE'),
    collection: z.string(),
    slug: z.string(),
  }),
]);

export const cmsSavePayloadSchema = z.object({
  drafts: z.record(z.string(), z.string()).optional().default({}),
  operations: z.array(cmsSaveOperationSchema).optional().default([]),
  filePath: z.string().optional(),
});

export const cmsLockPayloadSchema = z.object({
  resourceId: z.string(),
  action: z.enum(['acquire', 'release', 'check']),
  holderName: z.string().optional(),
});

export type SiteConfig = z.infer<typeof siteConfigSchema>;
export type Service = z.infer<typeof serviceSchema>;
export type News = z.infer<typeof newsSchema>;
export type Faq = z.infer<typeof faqSchema>;
export type CmsSaveOperation = z.infer<typeof cmsSaveOperationSchema>;
export type CmsSavePayload = z.infer<typeof cmsSavePayloadSchema>;
export type CmsLockPayload = z.infer<typeof cmsLockPayloadSchema>;


