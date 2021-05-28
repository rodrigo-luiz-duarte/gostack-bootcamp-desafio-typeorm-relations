import { getRepository, Repository } from 'typeorm';

import IOrdersRepository from '@modules/orders/repositories/IOrdersRepository';
import ICreateOrderDTO from '@modules/orders/dtos/ICreateOrderDTO';
import Order from '../entities/Order';
import OrdersProducts from '../entities/OrdersProducts';

class OrdersRepository implements IOrdersRepository {
  private ormRepository: Repository<Order>;

  constructor() {
    this.ormRepository = getRepository(Order);
  }

  public async create({ customer, products }: ICreateOrderDTO): Promise<Order> {
    const order = await this.ormRepository.create({ customer });

    const ordersProducts: OrdersProducts[] = [];

    products.forEach(product => {
      const orderProducts = new OrdersProducts();
      const { product_id, price, quantity } = product;
      Object.assign(orderProducts, { product_id, price, quantity });
      ordersProducts.push(orderProducts);
    });

    order.order_products = ordersProducts;

    await this.ormRepository.save(order);

    return order;
  }

  public async findById(id: string): Promise<Order | undefined> {
    const order = await this.ormRepository.findOne({
      where: {
        id,
      },
      relations: ['order_products', 'customer', 'order_products.product'],
    });
    return order;
  }
}

export default OrdersRepository;
