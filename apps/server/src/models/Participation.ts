import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ParticipationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, required: true, ref: "User", index: true },
    challenge: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Challenge",
      index: true,
    },
    joinedAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: false },
);

ParticipationSchema.index({ user: 1, challenge: 1 }, { unique: true });

export type ParticipationDoc = InferSchemaType<typeof ParticipationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type ParticipationModelType = Model<ParticipationDoc>;

export const ParticipationModel: ParticipationModelType =
  (mongoose.models.Participation as ParticipationModelType | undefined) ??
  mongoose.model<ParticipationDoc>("Participation", ParticipationSchema, "participations");

