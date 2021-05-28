import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import { IFindProducts } from '@modules/products/infra/typeorm/repositories/ProductsRepository';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';
import ICreateOrderDTO from '../dtos/ICreateOrderDTO';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not found.');
    }

    const orderData: ICreateOrderDTO = { customer, products: [] };

    const productIds: IFindProducts[] = [];

    products.forEach(p => {
      productIds.push({ id: p.id });
    });

    const productsList = await this.productsRepository.findAllById(productIds);

    if (!productsList) {
      throw new AppError('Products not found.');
    }
    const updatedProducts: IUpdateProductsQuantityDTO[] = [];

    if (products.length !== productsList.length) {
      throw new AppError("You can't create a order with invalid product.");
    }

    productsList.forEach(p => {
      const productInOrder = products.find(p2 => p2.id === p.id);

      if (!productInOrder) {
        throw new AppError("You can't create a order with invalid product.");
      }

      if (p.quantity < productInOrder.quantity) {
        throw new AppError('Product quantity insufficient');
      }

      orderData.products.push({
        product_id: p.id,
        quantity: productInOrder.quantity,
        price: p.price,
      });

      updatedProducts.push({
        id: p.id,
        quantity: p.quantity - productInOrder.quantity,
      });
    });

    const order = await this.ordersRepository.create(orderData);

    await this.productsRepository.updateQuantity(updatedProducts);

    return order;
  }
}

export default CreateOrderService;
