import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { connectDB } from "@/lib/mongodb";
import Order from "@/models/Order";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectDB();

  const [totals] = await Order.aggregate([
    { $match: { status: "paid" } },
    { $group: { _id: null, totalRevenue: { $sum: "$amount" }, paidOrders: { $sum: 1 } } }
  ]);

  const pendingCount = await Order.countDocuments({ status: "pending" });
  const failedCount = await Order.countDocuments({ status: "failed" });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const daily = await Order.aggregate([
    { $match: { status: "paid", createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$amount" },
        orders: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return NextResponse.json({
    totalRevenue: totals?.totalRevenue ?? 0,
    paidOrders: totals?.paidOrders ?? 0,
    pendingCount,
    failedCount,
    daily
  });
}
