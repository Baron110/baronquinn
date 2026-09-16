import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import Order from "@/models/Order";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const body = await req.json();
  const { productSlug, sender, recipient, loveNote, address } = body;

  if (!productSlug || !sender?.email || !sender?.name || !sender?.phone || !recipient?.name || !address?.street) {
    return NextResponse.json({ error: "Missing required order fields" }, { status: 400 });
  }

  await connectDB();

  const product = await Product.findOne({ slug: productSlug, active: true });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const order = await Order.create({
    user: session.user.id,
    product: product._id,
    productSlug: product.slug,
    productName: product.name,
    amount: product.price,
    sender,
    recipient,
    loveNote,
    address,
    reference: `${product.slug}-${Date.now()}`,
    status: "pending"
  });

  return NextResponse.json({
    orderId: order._id.toString(),
    reference: order.reference,
    amount: order.amount
  });
}
