import express from "express";
import path from "path";
import fs from "fs"; // 新增：用於讀取本地文件系統
import { createServer as createViteServer } from "vite";
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";

// --- 配置 ---
const MOCK_S3_FOR_TESTING = process.env.MOCK_S3 === "true";
const LOCAL_DATA_PATH = path.join(process.cwd(), "data", "summary_result");

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Route: Fetch Summary ---
  app.get("/api/driver-summary", async (req, res) => {
    // 1. 優先檢查本地數據 (Localhost Data)
    if (fs.existsSync(LOCAL_DATA_PATH)) {
      try {
        const files = fs.readdirSync(LOCAL_DATA_PATH);
        // 尋找 .txt 或 .parquet 文件
        const dataFile = files.find(f => f.endsWith(".txt") || f.endsWith(".parquet"));
        
        if (dataFile) {
          console.log(`DEBUG: Loading local data from ${dataFile}`);
          const filePath = path.join(LOCAL_DATA_PATH, dataFile);
          const stats = fs.statSync(filePath);
          
          // 如果是 .txt 文件，我們可以讀取前幾行來驗證數據
          let preview = "";
          if (dataFile.endsWith(".txt")) {
            const content = fs.readFileSync(filePath, 'utf8');
            preview = content.split('\n').slice(0, 5).join('\n'); // 獲取前 5 行
          }

          return res.json({ 
            status: "connected", 
            source: "local_filesystem",
            message: `Found local Spark output: ${dataFile}`,
            lastModified: stats.mtime,
            preview: preview // 將數據預覽傳回前端
          });
        }
      } catch (err) {
        console.error("Local data read error:", err);
      }
    }

    // 2. 模擬模式 (用於本地測試，無 AWS 憑證時)
    if (MOCK_S3_FOR_TESTING) {
      return res.json({ 
        status: "connected", 
        source: "simulated_s3",
        message: "Simulated Spark output (Mock Mode)",
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
