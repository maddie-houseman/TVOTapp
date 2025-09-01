import { Router } from 'express';
import { auth } from '../middleware/auth';
import { z } from 'zod';

const r = Router();

const schema = z.object({
    snapshot: z.object({ period: z.string(), totalCost: z.number(), totalBenefit: z.number(), roiPct: z.number() }),
    question: z.string().default('Reflect on this ROI snapshot and suggest actionable improvements using TBM levers.')
    });

    r.post('/reflect', auth(), async (req, res) => {
    if (!process.env.OPENAI_API_KEY) return res.status(400).json({ error: 'OPENAI_API_KEY not configured' });
    const { snapshot, question } = schema.parse(req.body);

    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const resp: any = await client.responses.create({
        model: 'gpt-4.1-mini',
        input: [
        { role: 'system', content: 'You are a TBM-savvy ROI analyst. Provide a numbered action list.' },
        { role: 'user', content: `${question}\n\nSnapshot: ${JSON.stringify(snapshot)}` }
        ]
    } as any);

    const text = resp.output_text || resp.choices?.[0]?.message?.content || 'No response';
    res.json({ text });
});

export default r;