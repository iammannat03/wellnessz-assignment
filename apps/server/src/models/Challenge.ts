import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ChallengeSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    metric: {
      type: String,
      required: true,
      enum: ["steps", "minutes", "liters"],
    },
    dailyTarget: { type: Number, required: true, min: 0 },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    visibility: { type: String, required: true, enum: ["public", "private"] },
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
  },
  { timestamps: true },
);

export type ChallengeDoc = InferSchemaType<typeof ChallengeSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type ChallengeModelType = Model<ChallengeDoc>;

export const ChallengeModel: ChallengeModelType =
  (mongoose.models.Challenge as ChallengeModelType | undefined) ??
  mongoose.model<ChallengeDoc>("Challenge", ChallengeSchema, "challenges");
