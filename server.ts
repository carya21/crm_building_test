import express from "express";
import { createServer as createViteServer } from "vite";
import { SolapiMessageService } from "solapi";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post("/api/send-sms", async (req, res) => {
    try {
      const { to, content } = req.body;
      
      const apiKey = process.env.SOLAPI_API_KEY;
      const apiSecret = process.env.SOLAPI_API_SECRET;
      const from = process.env.SOLAPI_SENDER_NUMBER;

      if (!apiKey || !apiSecret || !from) {
        return res.status(500).json({ error: "솔라피 API 설정이 누락되었습니다." });
      }

      const messageService = new SolapiMessageService(apiKey, apiSecret);
      
      const result = await messageService.sendOne({
        to: to.replace(/[^0-9]/g, ''),
        from: from.replace(/[^0-9]/g, ''),
        text: content,
      });

      res.json({ success: true, result });
    } catch (error: any) {
      console.error("SMS 발송 오류:", error);
      res.status(500).json({ error: error.message || "문자 발송에 실패했습니다." });
    }
  });

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
