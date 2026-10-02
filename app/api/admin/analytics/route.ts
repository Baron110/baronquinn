import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { connectDB } from "@/lib/mongodb";
import PageView from "@/models/PageView";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectDB();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const [visitsToday, visitsThisWeek, signupsToday, signupsThisWeek, totalUsers] = await Promise.all([
    PageView.countDocuments({ createdAt: { $gte: startOfToday } }),
    PageView.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    User.countDocuments({ createdAt: { $gte: startOfToday } }),
    User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    User.countDocuments()
  ]);

  const dailyVisits = await PageView.aggregate([
    { $match: { createdAt: { $gte: fourteenDaysAgo } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, visits: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);

  const dailySignups = await User.aggregate([
    { $match: { createdAt: { $gte: fourteenDaysAgo } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, signups: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);

  const topPaths = await PageView.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    { $group: { _id: "$path", visits: { $sum: 1 } } },
    { $sort: { visits: -1 } },
    { $limit: 10 }
  ]);

  return NextResponse.json({
    visitsToday,
    visitsThisWeek,
    signupsToday,
    signupsThisWeek,
    totalUsers,
    dailyVisits,
    dailySignups,
    topPaths
  });
}
