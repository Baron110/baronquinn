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
  const { items: cartItems, sender, recipient, loveNote, address } = body;

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
  }
  if (!sender?.email || !sender?.name || !sender?.phone || !recipient?.name || !address?.street) {
    return NextResponse.json({ error: "Missing required order fields" }, { status: 400 });
  }

  await connectDB();

  const orderItems = [];
  let amount = 0;

  for (const ci of cartItems) {
    const product = await Product.findOne({ slug: ci.slug, active: true });
    if (!product) {
      return NextResponse.json({ error: `Product no longer available: ${ci.slug}` }, { status: 404 });
    }
    const quantity = Math.max(1, Number(ci.quantity) || 1);
    orderItems.push({
      product: product._id,
      productSlug: product.slug,
      productName: product.name,
      price: product.price,
      quantity
    });
    amount += product.price * quantity;
  }

  const order = await Order.create({
    user: session.user.id,
    items: orderItems,
    amount,
    sender,
    recipient,
    loveNote,
    address,
    reference: `order-${Date.now()}`,
    status: "pending"
  });

  return NextResponse.json({
    orderId: order._id.toString(),
    reference: order.reference,
    amount: order.amount
  });
}
