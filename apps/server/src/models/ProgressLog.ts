import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ProgressLogSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
    challenge: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Challenge",
      index: true,
    },
    date: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

ProgressLogSchema.index({ user: 1, challenge: 1, date: 1 }, { unique: true });

export type ProgressLogDoc = InferSchemaType<typeof ProgressLogSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type ProgressLogModelType = Model<ProgressLogDoc>;

export const ProgressLogModel: ProgressLogModelType =
  (mongoose.models.ProgressLog as ProgressLogModelType | undefined) ??
  mongoose.model<ProgressLogDoc>(
    "ProgressLog",
    ProgressLogSchema,
    "progress_logs",
  );
