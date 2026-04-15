import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),              
    publishDate: z.string(),          
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
    video: z
      .object({
        src: z.string(),
        title: z.string().optional(),
        poster: z.string().optional(),
      })
      .optional(),
    tech: z.array(z.string()).default([]),
    github: z.string().url().optional(),
    demo: z.string().url().optional(),
    featured: z.boolean().default(false),
  }),
});

export const collections = {
  projects,
};
