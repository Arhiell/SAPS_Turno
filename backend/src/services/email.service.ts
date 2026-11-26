import nodemailer, { type Transporter } from "nodemailer";
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

let smtpTransporter: Transporter | null = null;

const getSmtpTransporter = (): Transporter => {
  if (!smtpTransporter) {
    const smtpOptions: SMTPTransport.Options & { family?: number } = {
      host: env.MAIL_HOST,
      port: env.MAIL_PORT,
      secure: env.MAIL_SECURE,
      family: 4,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      auth: {
        user: env.MAIL_USER,
        pass: env.MAIL_PASSWORD,
      },
    };
    smtpTransporter = nodemailer.createTransport(smtpOptions);
  }
  return smtpTransporter;
};

const escapeHtml = (raw: string): string =>
  raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const sendViaBrevo = async ({
  to,
  subject,
  text,
  html,
}: SendEmailInput): Promise<EmailSendResult> => {
  const apiKey = env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("BREVO_API_KEY no está configurada.");
  }

  const recipient = to.trim();
  const htmlContent =
    html ??
    (text
      ? `<div style="font-family: Arial, sans-serif; white-space: pre-wrap;">${escapeHtml(text)}</div>`
      : "<p></p>");

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: env.MAIL_FROM_NAME,
        email: env.MAIL_FROM_EMAIL,
      },
      to: [{ email: recipient }],
      subject,
      htmlContent,
      ...(text ? { textContent: text } : {}),
    }),
  });

  if (!response.ok) {
    const errorDetail = await response.text().catch(() => "");
    const message = `[email][Brevo] Error HTTP ${response.status} ${response.statusText} al enviar correo a ${recipient}: ${errorDetail || "sin detalle"}`;
    console.error(message);
    throw new Error(message);
  }

  const payload = (await response.json().catch(() => ({}))) as {
    messageId?: string;
  };

  return {
    accepted: [recipient],
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
  const recipient = to.trim();

  if (env.BREVO_API_KEY) {
    return sendViaBrevo({
      to: recipient,
      subject,
      ...(text !== undefined ? { text } : {}),
      ...(html !== undefined ? { html } : {}),
    });
  }

  const result = await getSmtpTransporter().sendMail({
    from: {
      name: env.MAIL_FROM_NAME,
      address: env.MAIL_FROM_EMAIL,
    },
    to: recipient,
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

  return {
    accepted,
    rejected,
    ...(result.messageId ? { messageId: result.messageId } : {}),
  };
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
