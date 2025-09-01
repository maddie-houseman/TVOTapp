// client/src/pages/Dashboard.tsx
import { useEffect, useState } from 'react';
import { api, type Me, type L4Snapshot } from '../lib/api';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Dashboard() {
    const [me, setMe] = useState<Me | null>(null);
    const [data, setData] = useState<L4Snapshot[]>([]);

  // load user
    useEffect(() => {
        api.me().then(setMe).catch(() => setMe(null));
    }, []);

  // load snapshots once we know the company
    useEffect(() => {
        if (!me?.companyId) return;
        api.snapshots(me.companyId).then(setData).catch(() => setData([]));
    }, [me]);

    async function exportPdf() {
        const node = document.getElementById('dash');
        if (!(node instanceof HTMLElement)) return;

        const canvas = await html2canvas(node);
        const img = canvas.toDataURL('image/png');

        // A4 portrait
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageUsableWidth = 190; // ~10mm margins
        const imgW = pageUsableWidth;
        const imgH = (canvas.height * imgW) / canvas.width;

        pdf.addImage(img, 'PNG', 10, 10, imgW, imgH);
        pdf.save('dashboard.pdf');
    }

    if (!me) return <div>Login first.</div>;

    return (
    <div className="card">
        <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">ROI over time</h2>
            <button className="btn" onClick={exportPdf}>
            Export PDF
            </button>
        </div>

        <div id="dash" className="bg-white p-2">
            <ResponsiveContainer width="100%" height={360}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="roiPct" dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    </div>
    );
}
