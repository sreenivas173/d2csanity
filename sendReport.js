const fs = require("fs");
const nodemailer = require("nodemailer");

function getSummary() {
  const data = JSON.parse(fs.readFileSync("report.json", "utf-8"));

  let total = 0, passed = 0, failed = 0, skipped = 0;
  let failedTests = [];

  function parseSuite(suite) {
    suite.specs?.forEach(spec => {
      spec.tests.forEach(test => {
        total++;
        const result = test.results[0];

        if (result.status === "passed") passed++;
        else if (result.status === "failed") {
          failed++;
          failedTests.push(spec.title);
        }
        else if (result.status === "skipped") skipped++;
      });
    });

    suite.suites?.forEach(parseSuite);
  }

  parseSuite(data);

  return { total, passed, failed, skipped, failedTests };
}

async function sendMail() {
  const summary = getSummary();

  const transporter = nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });

  const subject = summary.failed > 0
    ? `❌ Sanity Failed | ${summary.failed} Failed`
    : `✅ Sanity Passed | All Passed`;

  const html = `
    <h2>Playwright Sanity Report</h2>
    <table border="1" cellpadding="8">
      <tr><th>Total</th><th>Passed</th><th>Failed</th><th>Skipped</th></tr>
      <tr>
        <td>${summary.total}</td>
        <td style="color:green">${summary.passed}</td>
        <td style="color:red">${summary.failed}</td>
        <td>${summary.skipped}</td>
      </tr>
    </table>
  `;

  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: process.env.MAIL_USER,
    subject,
    html,
    attachments: [
      {
        filename: "report.html",
        path: "./playwright-report/index.html"
      }
    ]
  });

  console.log("✅ Email sent");
}

sendMail();