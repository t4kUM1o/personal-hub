import "server-only";
import nodemailer from "nodemailer";

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error("GMAIL_USER / GMAIL_APP_PASSWORD が .env に設定されていません");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"Personal Hub" <${process.env.GMAIL_USER}>`,
    to,
    subject: "【Personal Hub】パスワード再設定のご案内",
    text: [
      "パスワード再設定のリクエストを受け付けました。",
      "以下のリンクから新しいパスワードを設定してください（1時間有効）。",
      "",
      resetUrl,
      "",
      "このメールに心当たりがない場合は、無視していただいて構いません。",
    ].join("\n"),
  });
}
