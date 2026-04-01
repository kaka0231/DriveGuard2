import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";

// --- AWS S3 Configuration ---
const MOCK_S3_FOR_TESTING = process.env.MOCK_S3 === "true";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
});

const BUCKET_NAME = process.env.S3_BUCKET || "comp4442-grouproject-group8";
const SUMMARY_PATH = "summary_result/";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Route: Fetch Summary from Spark Output ---
  app.get("/api/driver-summary", async (req, res) => {
    // --- 模擬模式 (用於本地測試) ---
    if (MOCK_S3_FOR_TESTING) {
      console.log("DEBUG: Running in MOCK_S3 mode for local testing.");
      return res.json({ 
        status: "connected", 
        source: "simulated_s3",
        message: "Simulated Spark output: part-00000-simulated.parquet",
        lastModified: new Date().toISOString()
      });
    }

    try {
      // 1. 檢查是否有 AWS 憑證
      if (!process.env.AWS_ACCESS_KEY_ID && !MOCK_S3_FOR_TESTING) {
        return res.json({ status: "offline", message: "No AWS Credentials found" });
      }

      // 1. List files in the Spark output folder
      const listCommand = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: SUMMARY_PATH,
      });
      const listResponse = await s3Client.send(listCommand);

      // 2. Find the Parquet data file (Spark usually names them part-0000...)
      const dataFile = listResponse.Contents?.find(obj => obj.Key?.endsWith(".parquet"));

      if (!dataFile) {
        // Fallback to mock data if no S3 results found
        return res.json({ source: "mock", data: [] });
      }

      // 3. In a real project, you would use `parquetjs` to read the file.
      // For now, we'll return a success message indicating the connection is ready.
      res.json({ 
        status: "connected", 
        message: `Found Spark output: ${dataFile.Key}`,
        lastModified: dataFile.LastModified 
      });

    } catch (error) {
      console.error("S3 Error:", error);
      res.status(500).json({ error: "Failed to fetch from S3. Please check AWS credentials." });
    }
  });

  // --- Vite Middleware for Frontend ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
