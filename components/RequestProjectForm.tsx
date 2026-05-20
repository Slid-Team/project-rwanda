'use client';

import { useState } from 'react';

export default function RequestProjectForm() {
  const [url, setUrl] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Handle form submission
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="mt-10 p-6 bg-green-50 rounded-2xl">
        <div className="flex items-center gap-3 text-accent-green">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-semibold">Request submitted!</span>
        </div>
        <p className="text-text-secondary text-sm mt-2">
          We&apos;ll review and add it to our monitoring list.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 pt-10 border-t border-gray-200">
      <p className="font-semibold text-text-primary mb-1">Add RWA Project</p>
      <p className="text-text-secondary text-sm mb-4">Submit a project URL for trust analysis</p>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://project-website.com"
          className="flex-1 max-w-[340px] bg-white border border-gray-300 rounded-xl px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
          required
        />
        <button type="submit" className="btn-primary">
          Submit
        </button>
      </form>
    </div>
  );
}
