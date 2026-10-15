import { Request, Response } from 'express';
import { prisma } from '../db';

export async function getAllProducts(req: Request, res: Response) {
  try {
    const products = await prisma.product.findMany();
    return res.json({ success: true, data: products });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function getProductById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: String(id).toUpperCase().trim() },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.json({ success: true, data: product });
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
