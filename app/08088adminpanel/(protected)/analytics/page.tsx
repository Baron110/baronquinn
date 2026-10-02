"use client";

import { useEffect, useState } from "react";

type Analytics = {
  visitsToday: number;
  visitsThisWeek: number;
  signupsToday: number;
  signupsThisWeek: number;
  totalUsers: number;
  dailyVisits: { _id: string; visits: number }[];
  dailySignups: { _id: string; signups: number }[];
  topPaths: { _id: string; visits: number }[];
};

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line p-5">
      <p className="text-xs uppercase tracking-wide text-ink/50">{label}</p>
      <p className="text-2xl mt-2">{value}</p>
    </div>
  );
}

export default function AdminAnalytics() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then(setData);
  }, []);

  // Merge the two daily series onto one set of dates, so the table reads
  // as "this is what happened on this day" rather than two disconnected
  // lists.
  const days = Array.from(
    new Set([...(data?.dailyVisits.map((d) => d._id) ?? []), ...(data?.dailySignups.map((d) => d._id) ?? [])])
  ).sort();

  return (
    <div>
      <h1 className="text-3xl mb-6">Analytics</h1>

      {!data ? (
        <p className="text-ink/40">Loading...</p>
      ) : (
        <>
          <div className="grid sm:grid-cols-5 gap-4">
            <Card label="Visits today" value={String(data.visitsToday)} />
            <Card label="Visits this week" value={String(data.visitsThisWeek)} />
            <Card label="New signups today" value={String(data.signupsToday)} />
            <Card label="New signups this week" value={String(data.signupsThisWeek)} />
            <Card label="Total registered users" value={String(data.totalUsers)} />
          </div>

          <section className="mt-10">
            <h2 className="text-sm uppercase tracking-wide text-ink/50 mb-4">Last 14 days</h2>
            {days.length === 0 ? (
              <p className="text-ink/40 text-sm">No visits recorded yet.</p>
            ) : (
              <div className="border border-line">
                <div className="flex justify-between px-4 py-2.5 border-b border-line text-xs uppercase tracking-wide text-ink/40">
                  <span>Date</span>
                  <span>Visits · New signups</span>
                </div>
                {days.map((day) => {
                  const visits = data.dailyVisits.find((d) => d._id === day)?.visits ?? 0;
                  const signups = data.dailySignups.find((d) => d._id === day)?.signups ?? 0;
                  return (
                    <div
                      key={day}
                      className="flex justify-between px-4 py-2.5 border-b border-line last:border-b-0 text-sm"
                    >
                      <span className="text-ink/60">{day}</span>
                      <span>
                        {visits} visit{visits === 1 ? "" : "s"} · {signups} signup{signups === 1 ? "" : "s"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="mt-10">
            <h2 className="text-sm uppercase tracking-wide text-ink/50 mb-4">Most visited pages this week</h2>
            {data.topPaths.length === 0 ? (
              <p className="text-ink/40 text-sm">No visits recorded yet.</p>
            ) : (
              <div className="border border-line">
                {data.topPaths.map((p) => (
                  <div
                    key={p._id}
                    className="flex justify-between px-4 py-2.5 border-b border-line last:border-b-0 text-sm"
                  >
                    <span className="text-ink/60">{p._id}</span>
                    <span>{p.visits}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
