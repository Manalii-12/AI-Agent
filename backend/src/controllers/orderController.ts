import { Request, Response } from 'express';
import { prisma } from '../db';
import { seedDatabase } from '../seed';

export async function getAllOrders(req: Request, res: Response) {
  try {
    const customer = req.query.customer as string | undefined;
    if (customer) {
      const cleanCustomer = customer.toLowerCase().trim();
      const orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
      });
      const filtered = orders.filter((o) => o.customer.toLowerCase().includes(cleanCustomer));
      return res.json({ success: true, data: filtered });
    }

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: orders });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function getOrderById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const normalizedId = String(id).toUpperCase().trim();

    const order = await prisma.order.findUnique({
      where: { id: normalizedId },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `I could not find an order with ID ${normalizedId}. Could you please verify the number?`,
      });
    }

    let message = '';
    if (order.status === 'Out for Delivery') {
      message = `Your order ${order.id} containing ${order.product} is currently Out for Delivery with ${order.courier || 'our delivery partner'}. Tracking number is ${order.trackingNumber || 'BD-982103'}, and it is expected by 6 PM today.`;
    } else if (order.status === 'Delivered') {
      message = `Your order ${order.id} containing ${order.product} was successfully delivered ${order.deliveredDaysAgo || 14} days ago via ${order.courier || 'Delhivery'}.`;
    } else if (order.status === 'Processing') {
      message = `Your order ${order.id} for ${order.product} is currently in Processing. It was placed recently and is eligible for cancellation.`;
    } else if (order.status === 'Cancelled') {
      message = `Your order ${order.id} has already been cancelled.`;
    }

    return res.json({
      success: true,
      data: order,
      message,
    });
  } catch (error: any) {
    console.error('Error fetching order by ID:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function createOrder(req: Request, res: Response) {
  try {
    const { customer, product, value, paymentMethod } = req.body;

    const count = await prisma.order.count();
    const newId = `ORD-${104 + count}`;

    const newOrder = await prisma.order.create({
      data: {
        id: newId,
        customer: customer || 'Valued Customer',
        product: product || 'Organic Skincare Pack',
        value: Number(value) || 499,
        status: 'Processing',
        notes: `Placed via ${paymentMethod || 'ONLINE'}. Eligible for cancellation while in Processing.`,
        orderPlacedHoursAgo: 0,
        paymentMethod: paymentMethod || 'ONLINE',
      },
    });

    return res.status(201).json({
      success: true,
      data: newOrder,
      message: `Order ${newId} created successfully.`,
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function cancelOrder(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const normalizedId = String(id).toUpperCase().trim();

    const order = await prisma.order.findUnique({
      where: { id: normalizedId },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `I could not find an order with ID ${normalizedId}. Could you please double check your order number?`,
      });
    }

    if (order.status === 'Processing') {
      const updated = await prisma.order.update({
        where: { id: normalizedId },
        data: {
          status: 'Cancelled',
          notes: `Cancelled by customer support request. (${order.notes})`,
        },
      });

      return res.json({
        success: true,
        data: updated,
        message: `Your order ${normalizedId} has been successfully cancelled, as it was still in Processing status. Any pre-paid amount will be refunded within 3 to 5 business days.`,
      });
    }

    // Guardrail: Out for delivery or delivered cannot be cancelled
    return res.status(400).json({
      success: false,
      data: order,
      message: `I apologize, but order ${normalizedId} cannot be cancelled because its status is already "${order.status}". Under our cancellation policy, orders can only be cancelled while in Processing. You may politely refuse the shipment upon arrival.`,
    });
  } catch (error: any) {
    console.error('Error cancelling order:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function checkReturnEligibility(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const isOpened = req.query.is_opened === 'true';
    const isDamaged = req.query.is_damaged === 'true';
    const normalizedId = String(id).toUpperCase().trim();

    const order = await prisma.order.findUnique({
      where: { id: normalizedId },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `I could not locate order ${normalizedId}. Please verify your order ID.`,
      });
    }

    // Return policy rules
    if (isDamaged) {
      return res.json({
        success: true,
        eligible: true,
        message: `I'm very sorry to hear your product arrived damaged. Since this was reported within 48 hours of delivery, we will issue a free replacement right away!`,
      });
    }

    if (isOpened) {
      return res.status(400).json({
        success: false,
        eligible: false,
        message: `Under Aura Skincare policy, opened or used products cannot be returned for hygiene and safety reasons. We can only accept returns for items in their original, sealed packaging.`,
      });
    }

    if (order.deliveredDaysAgo && order.deliveredDaysAgo > 7) {
      return res.status(400).json({
        success: false,
        eligible: false,
        message: `I apologize, but order ${normalizedId} was delivered ${order.deliveredDaysAgo} days ago. Our return policy strictly requires returns to be initiated within 7 days of delivery.`,
      });
    }

    return res.json({
      success: true,
      eligible: true,
      message: `Order ${normalizedId} is eligible for return. The product must remain unopened in its original packaging. Would you like me to initiate the doorstep pickup?`,
    });
  } catch (error: any) {
    console.error('Error checking return eligibility:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function resetOrders(req: Request, res: Response) {
  try {
    await seedDatabase();
    return res.json({
      success: true,
      message: 'Database reset to initial test state (ORD-101, ORD-102, ORD-103).',
    });
  } catch (error: any) {
    console.error('Error resetting database:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
