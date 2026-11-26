import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport/index.js";
import { env } from "../config/env.js";

type SendEmailInput = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

type EmailSendResult = {
  accepted: string[];
  rejected: string[];
  messageId?: string;
};

const smtpOptions: SMTPTransport.Options & { family?: number } = {
  host: env.MAIL_HOST,
  port: env.MAIL_PORT,
  secure: env.MAIL_SECURE,
  family: 4,
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 15_000,
  auth: {
    user: env.MAIL_USER,
    pass: env.MAIL_PASSWORD,
  },
};

const transporter = nodemailer.createTransport(smtpOptions);

const CLOUD_SMTP_NETWORK_ERRORS = new Set([
  "ENETUNREACH",
  "ETIMEDOUT",
  "ESOCKET",
  "ECONNREFUSED",
  "ECONNRESET",
  "EHOSTUNREACH",
]);

const isSmtpNetworkError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; message?: string };
  if (err.code && CLOUD_SMTP_NETWORK_ERRORS.has(err.code.toUpperCase())) {
    return true;
  }
  const msg = (err.message ?? "").toUpperCase();
  return Array.from(CLOUD_SMTP_NETWORK_ERRORS).some((code) => msg.includes(code));
};

const sendViaBrevo = async ({
  to,
  subject,
  text,
  html,
}: SendEmailInput): Promise<EmailSendResult> => {
  if (!env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY no está configurada para el fallback HTTP.");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: env.MAIL_FROM_NAME,
        email: env.MAIL_FROM_EMAIL,
      },
      to: [{ email: to }],
      subject,
      ...(html ? { htmlContent: html } : {}),
      ...(text ? { textContent: text } : {}),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `Brevo API respondió ${response.status} ${response.statusText}: ${errorBody}`,
    );
  }

  const payload = (await response.json().catch(() => ({}))) as {
    messageId?: string;
  };

  console.info(
    `[email] Envío exitoso vía fallback Brevo HTTP API hacia ${to} (messageId: ${payload.messageId ?? "sin-id"}).`,
  );

  return {
    accepted: [to],
    rejected: [],
    ...(payload.messageId ? { messageId: payload.messageId } : {}),
  };
};

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}: SendEmailInput): Promise<EmailSendResult> => {
  try {
    const result = await transporter.sendMail({
      from: {
        name: env.MAIL_FROM_NAME,
        address: env.MAIL_FROM_EMAIL,
      },
      to,
      subject,
      text,
      html,
    });

    const accepted = Array.isArray(result.accepted)
      ? result.accepted.map(String)
      : [];
    const rejected = Array.isArray(result.rejected)
      ? result.rejected.map(String)
      : [];

    if (accepted.length === 0) {
      throw new Error(
        `El servidor SMTP no aceptó el destinatario ${to} (rejected: ${rejected.join(", ") || "ninguno"}).`,
      );
    }

    return {
      accepted,
      rejected,
      ...(result.messageId ? { messageId: result.messageId } : {}),
    };
  } catch (smtpError) {
    if (env.BREVO_API_KEY && isSmtpNetworkError(smtpError)) {
      console.warn(
        `[email] Falló conexión SMTP hacia ${to}; intentando fallback por Brevo HTTP API...`,
        smtpError,
      );
      return sendViaBrevo({
        to,
        subject,
        ...(text !== undefined ? { text } : {}),
        ...(html !== undefined ? { html } : {}),
      });
    }

    throw smtpError;
  }
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
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f766e; margin-top: 0;">CORA — SAPS Turno</h2>
        <p style="color: #334155; font-size: 16px;">Tu código de verificación de correo electrónico es:</p>
        <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; color: #0f766e; margin: 24px 0;">
          ${code}
        </div>
        <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">Este código vence en 10 minutos. Si no solicitaste esta verificación, podés ignorar este correo.</p>
      </div>
    `,
  });
  if (result.accepted.length === 0) {
    throw new Error("El servidor SMTP no aceptó el correo de verificación.");
  }
};

export const sendPasswordRecoveryCode = async (to: string, code: string) => {
  const result = await sendEmail({
    to,
    subject: "Recuperá tu contraseña — SAPS Turno",
    text: `Tu código para restablecer la contraseña es: ${code}\n\nEste código vence en 15 minutos. Si no solicitaste esta operación, ignorá este correo.`,
  });

  if (result.accepted.length === 0) {
    throw new Error("El servidor SMTP no aceptó el correo de recuperación.");
  }
};
