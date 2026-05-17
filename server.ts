import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(express.json());

  // Gemini API setup for AI Assistant
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // AI Assistant Endpoint
  app.post('/api/ai-assistant', async (req, res) => {
    try {
      const { prompt, context } = req.body;
      const systemMsg = `أنت مساعد ذكي لنظام Rahab ERP السحابي. 
      هذا النظام مخصص لشركة "رحاب" التعليمية والتدريبية.
      السياق الحالي للمستخدم: ${context || 'اللوحة الرئيسية'}.
      كن مساعداً تنفيذياً، ودوداً، واحترافياً. أجب دائماً باللغة العربية الفصحى.`;

      const result = await (ai as any).models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          systemInstruction: systemMsg
        }
      });
      
      res.json({ text: result.text || 'عذراً، لم أتمكن من توليد إجابة.' });
    } catch (error) {
      console.error('AI Error:', error);
      res.status(500).json({ error: 'حدث خطأ في معالجة طلبك' });
    }
  });

  // Vite middleware for development
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
