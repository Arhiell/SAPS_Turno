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

export const sendAuthEmail = async (to: string, path: "verificar-email" | "restablecer-contrasena", token: string) => {
  
  const url = new URL(path, `${env.FRONTEND_URL.replace(/\/$/, "")}/`);
  
  url.searchParams.set("token", token);
  
  await sendEmail({ to, subject: path === "verificar-email" ? "Verificá tu correo — SAPS Turno" : "Recuperá tu contraseña — SAPS Turno",
    text: `Para continuar, abrí este enlace: ${url.toString()}\nSi no solicitaste esta operación, ignorá este mensaje.` });
};

export const sendEmailVerificationCode = async (to: string, code: string) => {
  const result = await sendEmail({
    to,
    subject: "Verificá tu correo — SAPS Turno",
    text: `Tu código de verificación es: ${code}\n\nEste código vence en 10 minutos. Si no solicitaste este registro, ignorá este correo.`,
  });
  if (result.accepted.length === 0) {
    throw new Error("El servidor SMTP no aceptó el correo de verificación.");
  }
};
