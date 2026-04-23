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

// 📩 Send message to Webex
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
    console.log(`📡 Webex Status: ${res.statusCode}`);
  });

  req.on("error", err => console.error("❌ Error:", err.message));

  req.write(data);
  req.end();
}

// 📦 Get artifact download link from GitHub
async function getArtifactLink() {
  return new Promise((resolve) => {
    const repo = process.env.GITHUB_REPOSITORY;
    const runId = process.env.GITHUB_RUN_ID;

    const options = {
      hostname: "api.github.com",
      path: `/repos/${repo}/actions/runs/${runId}/artifacts`,
      method: "GET",
      headers: {
        "Authorization": `Bearer ${process.env.GITHUB_TOKEN}`,
        "User-Agent": "node"
      }
    };

    https.get(options, res => {
      let data = "";
      res.on("data", chunk => data += chunk);

      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          const artifact = json.artifacts.find(a => a.name === "playwright-report");

          if (artifact) {
            resolve(artifact.archive_download_url);
          } else {
            resolve("");
          }
        } catch (err) {
          console.error("❌ Error parsing artifact response");
          resolve("");
        }
      });
    }).on("error", err => {
      console.error("❌ Artifact API error:", err.message);
      resolve("");
    });
  });
}

// 🚀 Main execution
(async () => {
  const summary = getSummary();

  const runUrl = process.env.GITHUB_RUN_URL || "";
  const artifactUrl = await getArtifactLink();

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

🔗 **View Run:** ${runUrl}

📦 **Download Report ZIP:**
${artifactUrl || "Check artifacts in run page"}
`;

  sendMessage(message);
})();