import nodemailer from "nodemailer";
import { env } from "../config/env.js";

type SendEmailInput = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

const transporter = nodemailer.createTransport({
  host: env.MAIL_HOST,
  port: env.MAIL_PORT,
  secure: env.MAIL_SECURE,
  auth: {
    user: env.MAIL_USER,
    pass: env.MAIL_PASSWORD,
  },
});

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}: SendEmailInput) => {
  return transporter.sendMail({
    from: {
      name: env.MAIL_FROM_NAME,
      address: env.MAIL_FROM_EMAIL,
    },
    to,
    subject,
    text,
    html,
  });
};