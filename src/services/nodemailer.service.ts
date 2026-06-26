import { transporter } from "@/config/nodemailer.config";
import { AppError } from "@/utils/app-error.utils";

export const sendMail = async (
  mailTo: string,
  mailSubject: string,
  mailText: string,
  mailHtml: string,
) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: mailTo,
      subject: mailSubject,
      text: mailText,
      html: mailHtml,
    });
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new AppError(500, "Fail to send mail");
  }
};
