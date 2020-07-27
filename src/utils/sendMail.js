const nodemailer = require("nodemailer");
const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    }
  });
  var content = "";
  content += `
      <div style="padding: 10px; background-color: #003375">
          <div style="padding: 10px; background-color: white;">
              <h4 style="color: #0085ff">MAIL</h4>
              <span style="color: black">${options.subject}</span>
              <a href="${options.url}">${options.url}</a>
          </div>
      </div>
  `;

  const message = {
    from: `${process.env.FROM_NAME} ${process.env.FROM_EMAIL}`,
    to: options.email,
    subject: options.subject,
    html: content,
  };
  const info = await transporter.sendMail(message);
  console.log("send", info.messageId);
};
module.exports = sendEmail;
