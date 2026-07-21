import mongoose, { Schema } from "mongoose";

const newsletterSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    isSource: {
      type: String,
      required: true,
      default: "website",
    },
  },
  {
    timestamps: true,
  },
);

const Newsletter =
  mongoose.models.Newsletter || mongoose.model("Newsletter", newsletterSchema);

export default Newsletter;
