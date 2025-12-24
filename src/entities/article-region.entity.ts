import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from "typeorm";
import { Article } from "./article.entity";
import { Region } from "./region.entity";

/**
 * Article-Region relationship
 * Allows articles to be published in specific regions only
 * If no regions linked, article is available in all regions
 */
@Entity("article_regions")
@Unique(["articleId", "regionId"])
@Index(["articleId"])
@Index(["regionId"])
export class ArticleRegion {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "article_id", type: "uuid" })
  articleId!: string;

  @ManyToOne(() => Article, { onDelete: "CASCADE" })
  @JoinColumn({ name: "article_id" })
  article?: Article;

  @Column({ name: "region_id", type: "uuid" })
  regionId!: string;

  @ManyToOne(() => Region, { onDelete: "CASCADE" })
  @JoinColumn({ name: "region_id" })
  region?: Region;

  // Region-specific override (optional)
  @Column({ name: "custom_title", length: 500, nullable: true })
  customTitle?: string;

  @Column({ name: "custom_excerpt", type: "text", nullable: true })
  customExcerpt?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
