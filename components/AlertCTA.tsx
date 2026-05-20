'use client';

import { useState } from 'react';

interface AlertCTAProps {
  projectId: string;
  projectName: string;
}

export default function AlertCTA({ projectId, projectName }: AlertCTAProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribed(true);
  };

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Get Alerts</h3>

      {subscribed ? (
        <div className="text-center py-6">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-text-primary font-medium">Subscribed</p>
          <p className="text-text-secondary text-sm mt-1">
            We&apos;ll notify you about {projectName}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubscribe}>
          <p className="text-text-secondary text-sm mb-4">
            Get notified when the trust score changes.
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full bg-bg-secondary border-0 rounded-xl px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue mb-3"
            required
          />
          <button type="submit" className="btn-primary w-full">
            Subscribe
          </button>
        </form>
      )}
    </div>
  );
}
