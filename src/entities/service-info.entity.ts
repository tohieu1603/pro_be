import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("service_info")
export class ServiceInfo {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 200 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ length: 100, nullable: true })
  icon?: string; // icon name (e.g., 'truck', 'shield', 'tool')

  @Column({ name: "applies_to", length: 50, default: "all" })
  appliesTo!: string; // all, category, brand, product

  @Column({ name: "target_ids", type: "uuid", array: true, nullable: true })
  targetIds?: string[];

  @Column({ name: "is_active", default: true })
  isActive!: boolean;

  @Column({ name: "display_order", default: 0 })
  displayOrder!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
