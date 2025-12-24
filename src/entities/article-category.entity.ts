import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";

@Entity("article_categories")
export class ArticleCategory {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "parent_id", type: "uuid", nullable: true })
  parentId?: string;

  @ManyToOne(() => ArticleCategory, (category) => category.children, {
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "parent_id" })
  parent?: ArticleCategory;

  @OneToMany(() => ArticleCategory, (category) => category.parent)
  children?: ArticleCategory[];

  @Column({ length: 200 })
  name!: string;

  @Column({ length: 200, unique: true })
  slug!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ name: "image_url", length: 500, nullable: true })
  imageUrl?: string;

  @Column({ name: "display_order", default: 0 })
  displayOrder!: number;

  @Column({ name: "is_active", default: true })
  isActive!: boolean;

  // SEO fields
  @Column({ name: "meta_title", length: 200, nullable: true })
  metaTitle?: string;

  @Column({ name: "meta_description", length: 500, nullable: true })
  metaDescription?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  // Relation to articles - will be added after Article entity is created
  @OneToMany("Article", "category")
  articles?: any[];
}
