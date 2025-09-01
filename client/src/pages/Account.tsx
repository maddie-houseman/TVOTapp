import { useEffect, useState } from 'react';
import { api, type Me } from '../lib/api';

export default function Account() {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const m = await api.me();
        if (alive) setMe(m);
      } catch {
        if (alive) setMe(null);
      }
    })();

    return () => { alive = false; };
  }, []);

  if (!me) return <div>Login first.</div>;

  return (
    <div className="card">
      <h2 className="font-semibold mb-2">Account</h2>
      <pre className="text-sm">{JSON.stringify(me, null, 2)}</pre>
    </div>
  );
}
