const transporter = require("../config/mailer");
const { renderTemplate } = require("./emailTemplates");

async function sendEmailTemplate(to, subject, templateName, templateData) {
  const html = renderTemplate(templateName, templateData);
  const mailOptions = {
    from: process.env.MAIL_FROM,
    to,
    subject,
    html,
  };
  const info = await transporter.sendMail(mailOptions);
  return info;
}

module.exports = sendEmailTemplate;