const fs = require("fs");
const https = require("https");

// 🔍 Parse Playwright JSON report
function getSummary() {
  let total = 0;
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let failedTests = [];

  try {
    const data = JSON.parse(fs.readFileSync("report.json", "utf-8"));

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

  } catch (err) {
    console.error("❌ Failed to read report.json:", err.message);
  }

  return { total, passed, failed, skipped, failedTests };
}

// 📩 Send message to Webex
function sendMessage(message) {
  const data = JSON.stringify({
    roomId: process.env.WEBEX_ROOM_ID,
    markdown: message   // ✅ important (fixes 400 error)
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
    console.log(`📡 Webex Response Status: ${res.statusCode}`);

    let responseBody = "";
    res.on("data", chunk => responseBody += chunk);

    res.on("end", () => {
      if (res.statusCode !== 200) {
        console.error("❌ Webex Error Response:", responseBody);
      } else {
        console.log("✅ Message sent to Webex successfully");
      }
    });
  });

  req.on("error", err => {
    console.error("❌ Request Error:", err.message);
  });

  req.write(data);
  req.end();
}

// 🚀 Main execution
const summary = getSummary();

// 🔗 Optional: GitHub run link
const runUrl = process.env.GITHUB_RUN_URL || "";

// 📝 Build message
const message = `
🚀 **Playwright Sanity Report**

📊 **Summary**
- Total: ${summary.total}
- Passed: ${summary.passed} ✅
- Failed: ${summary.failed} ❌
- Skipped: ${summary.skipped}

${summary.failed > 0 ? `
❌ **Failed Tests**
${summary.failedTests.map(t => `- ${t}`).join("\n")}
` : "🎉 All tests passed successfully!"}

${runUrl ? `🔗 [View Full Report](${runUrl})` : ""}
`;

// 📤 Send message
sendMessage(message);