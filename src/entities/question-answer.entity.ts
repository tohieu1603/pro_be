import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { ProductQuestion } from "./product-question.entity";

@Entity("question_answers")
export class QuestionAnswer {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "question_id", type: "uuid" })
  questionId!: string;

  @ManyToOne(() => ProductQuestion, (question) => question.answers, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "question_id" })
  question?: ProductQuestion;

  @Column({ type: "text" })
  answer!: string;

  @Column({ name: "answered_by", length: 200, default: "Admin" })
  answeredBy!: string;

  @Column({ name: "is_official", default: true })
  isOfficial!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
