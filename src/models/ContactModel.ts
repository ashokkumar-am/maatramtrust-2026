import mongoose, { Schema } from "mongoose";

const contactSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
      required: true,
    },
    comments: {
      type: String,
      required: true,
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

const Contact =
  mongoose.models.Contact || mongoose.model("Contact", contactSchema);

export default Contact;
