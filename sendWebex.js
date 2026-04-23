const fs = require("fs");
const https = require("https");

// 🔍 Parse Playwright JSON report
function getSummary() {
  let total = 0, passed = 0, failed = 0, skipped = 0;
  let passedTests = [];
  let failedTests = [];

  try {
    const data = JSON.parse(fs.readFileSync("report.json", "utf-8"));

    function parseSuite(suite) {
      suite.specs?.forEach(spec => {
        spec.tests.forEach(test => {
          total++;
          const result = test.results[0];

          if (result.status === "passed") {
            passed++;
            passedTests.push(spec.title);
          } else if (result.status === "failed") {
            failed++;
            failedTests.push(spec.title);
          } else if (result.status === "skipped") {
            skipped++;
          }
        });
      });

      suite.suites?.forEach(parseSuite);
    }

    parseSuite(data);

  } catch (err) {
    console.error("❌ Error reading report:", err.message);
  }

  return { total, passed, failed, skipped, passedTests, failedTests };
}

// 📩 Send message
function sendMessage(message) {
  const data = JSON.stringify({
    roomId: process.env.WEBEX_ROOM_ID,
    markdown: message
  });

  const options = {
    hostname: "webexapis.com",
    path: "/v1/messages",
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.WEBEX_TOKEN}`,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data)
    }
  };

  const req = https.request(options, res => {
    console.log(`📡 Status: ${res.statusCode}`);
  });

  req.on("error", err => console.error("❌ Error:", err.message));

  req.write(data);
  req.end();
}

// 🚀 Build message
const summary = getSummary();

const runUrl = process.env.GITHUB_RUN_URL || "";

// Limit long lists (avoid spam)
const maxItems = 5;

const failedList = summary.failedTests.slice(0, maxItems)
  .map(t => `- ❌ ${t}`).join("\n");

const passedList = summary.passedTests.slice(0, maxItems)
  .map(t => `- ✅ ${t}`).join("\n");

const moreFailed = summary.failedTests.length > maxItems
  ? `\n...and ${summary.failedTests.length - maxItems} more`
  : "";

const morePassed = summary.passedTests.length > maxItems
  ? `\n...and ${summary.passedTests.length - maxItems} more`
  : "";

// 📝 Final message
const message = `
🚀 **Playwright Sanity Report**

📊 **Summary**
- Total: ${summary.total}
- Passed: ${summary.passed} ✅
- Failed: ${summary.failed} ❌
- Skipped: ${summary.skipped}

${summary.failed > 0 ? `
❌ **Failed Tests**
${failedList}${moreFailed}
` : "🎉 **All tests passed successfully!**"}

${summary.passed > 0 ? `
✅ **Sample Passed Tests**
${passedList}${morePassed}
` : ""}

${runUrl ? `🔗 **View Full Report:** ${runUrl}` : ""}
`;

sendMessage(message);