const fs = require("fs");
const https = require("https");

function getSummary() {
  const data = JSON.parse(fs.readFileSync("report.json", "utf-8"));

  let total = 0, passed = 0, failed = 0;

  function parseSuite(suite) {
    suite.specs?.forEach(spec => {
      spec.tests.forEach(test => {
        total++;
        const result = test.results[0];
        if (result.status === "passed") passed++;
        if (result.status === "failed") failed++;
      });
    });
    suite.suites?.forEach(parseSuite);
  }

  parseSuite(data);

  return { total, passed, failed };
}

function sendMessage(message) {
  const data = JSON.stringify({
    roomId: process.env.WEBEX_ROOM_ID,
    text: message
  });

  const options = {
    hostname: "webexapis.com",
    path: "/v1/messages",
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.WEBEX_TOKEN}`,
      "Content-Type": "application/json",
      "Content-Length": data.length
    }
  };

  const req = https.request(options, res => {
    console.log(`Status: ${res.statusCode}`);
  });

  req.write(data);
  req.end();
}

const summary = getSummary();

const message = `
🚀 Playwright Sanity Report

Total: ${summary.total}
Passed: ${summary.passed}
Failed: ${summary.failed}

${summary.failed > 0 ? "❌ Some tests failed" : "✅ All tests passed"}
`;

sendMessage(message);