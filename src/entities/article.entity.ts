import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  Index,
} from "typeorm";
import { ArticleCategory } from "./article-category.entity";
import { Tag } from "./tag.entity";
import { User } from "./user.entity";

export enum ArticleStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  SCHEDULED = "scheduled",
  ARCHIVED = "archived",
}

@Entity("articles")
@Index(["slug"], { unique: true })
@Index(["status", "publishedAt"])
@Index(["categoryId"])
export class Article {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 500 })
  title!: string;

  @Column({ length: 500, unique: true })
  slug!: string;

  @Column({ type: "text", nullable: true })
  excerpt?: string;

  // Markdown content
  @Column({ type: "text" })
  content!: string;

  // Featured image
  @Column({ name: "featured_image", length: 500, nullable: true })
  featuredImage?: string;

  @Column({ name: "featured_image_alt", length: 200, nullable: true })
  featuredImageAlt?: string;

  // Category
  @Column({ name: "category_id", type: "uuid", nullable: true })
  categoryId?: string;

  @ManyToOne(() => ArticleCategory, (category) => category.articles, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "category_id" })
  category?: ArticleCategory;

  // Author
  @Column({ name: "author_id", type: "uuid", nullable: true })
  authorId?: string;

  @ManyToOne(() => User, { onDelete: "SET NULL" })
  @JoinColumn({ name: "author_id" })
  author?: User;

  // Status & Publishing
  @Column({
    type: "varchar",
    length: 20,
    default: ArticleStatus.DRAFT,
  })
  status!: ArticleStatus;

  @Column({ name: "published_at", type: "timestamptz", nullable: true })
  publishedAt?: Date;

  @Column({ name: "scheduled_at", type: "timestamptz", nullable: true })
  scheduledAt?: Date;

  // SEO Fields
  @Column({ name: "meta_title", length: 200, nullable: true })
  metaTitle?: string;

  @Column({ name: "meta_description", length: 500, nullable: true })
  metaDescription?: string;

  @Column({ name: "meta_keywords", type: "text", array: true, nullable: true })
  metaKeywords?: string[];

  // Open Graph
  @Column({ name: "og_title", length: 200, nullable: true })
  ogTitle?: string;

  @Column({ name: "og_description", length: 500, nullable: true })
  ogDescription?: string;

  @Column({ name: "og_image", length: 500, nullable: true })
  ogImage?: string;

  // Twitter Card
  @Column({ name: "twitter_title", length: 200, nullable: true })
  twitterTitle?: string;

  @Column({ name: "twitter_description", length: 500, nullable: true })
  twitterDescription?: string;

  @Column({ name: "twitter_image", length: 500, nullable: true })
  twitterImage?: string;

  // Canonical URL (for SEO)
  @Column({ name: "canonical_url", length: 500, nullable: true })
  canonicalUrl?: string;

  // Schema.org structured data
  @Column({ name: "schema_markup", type: "jsonb", nullable: true })
  schemaMarkup?: Record<string, any>;

  // Robots meta
  @Column({ name: "robots_index", default: true })
  robotsIndex!: boolean;

  @Column({ name: "robots_follow", default: true })
  robotsFollow!: boolean;

  // Analytics
  @Column({ name: "view_count", default: 0 })
  viewCount!: number;

  @Column({ name: "reading_time", nullable: true })
  readingTime?: number; // in minutes

  // Featured/Sticky
  @Column({ name: "is_featured", default: false })
  isFeatured!: boolean;

  @Column({ name: "is_sticky", default: false })
  isSticky!: boolean;

  // Display order for sorting
  @Column({ name: "display_order", default: 0 })
  displayOrder!: number;

  // Timestamps
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  // Tags relation
  @ManyToMany(() => Tag)
  @JoinTable({
    name: "article_tags",
    joinColumn: { name: "article_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "tag_id", referencedColumnName: "id" },
  })
  tags?: Tag[];
}
