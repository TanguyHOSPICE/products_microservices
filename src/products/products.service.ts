import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClientProxy } from '@nestjs/microservices';
import { Product } from './schema/product.schema';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { firstValueFrom } from 'rxjs';
import { RpcCustomException } from 'src/exceptions/rpc-custom.exception';
import { ProductWithPrice } from 'src/utils/types/product.type';
import { getFinalPrice } from 'src/utils/functions/FPricing';
import {
  validateManualStatus,
  validateSalesPeriods,
} from 'src/utils/functions/FValidateSalesPeriod';
import { computeAutomaticStatus } from 'src/utils/functions/FComputeStatus';
import { mergeStatus } from 'src/utils/functions/mergeStatus';
import { tagToStatusFieldMap } from 'src/utils/mappers/product.mapper';
import { QueryProductsDto } from './dtos/queries-Products.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
    @Inject('NATS_GATEWAY') private readonly nats: ClientProxy,
  ) {}

  // ------------------------------
  // 🟢 CREATE
  // ------------------------------
  async create(createProductDto: CreateProductDto): Promise<Product> {
    try {
      // 🟢 1. S.P validation
      validateSalesPeriods(createProductDto.salesPeriods);
      // 🟢 2. Status creation by default
      const createdStatus = await firstValueFrom(
        this.nats.send('PRODUCTS_STATUS_DEFAULT_CREATE', {}),
      );
      // console.log(
      //   '🧙🏽‍♂️ ~ ProductsService ~ create ~ createdStatus:',
      //   createdStatus,
      // ); // ! dev tool
      // 🔥 Check if status creation was successful
      if (!createdStatus || !createdStatus._id) {
        throw new RpcCustomException(
          'Status creation failed',
          HttpStatus.INTERNAL_SERVER_ERROR,
          '500',
        );
      }

      // 3.🟢 Product creation with linked status
      const createdProduct = new this.productModel({
        ...createProductDto,
        status: createdStatus._id,
      });

      // console.log(
      //   '🧙🏽‍♂️ ~ ProductsService ~ create ~ createdProduct:',
      //   createdProduct,
      // ); // ! dev tool
      // console.log(
      //   '🧙🏽‍♂️ ~ ProductsService ~ create ~ createdStatus._id:',
      //   createdStatus._id,
      // ); // ! dev tool

      // 🔥 4. MANUAL VALIDATION
      const validatedManual = validateManualStatus(
        createdProduct,
        createProductDto.manualStatus,
      );
      // 🔥 5. AUTO
      const autoStatus = computeAutomaticStatus(createdProduct);
      // 🔥 6. MERGE FINAL
      const finalStatus = mergeStatus(validatedManual, autoStatus);
      // 🔥 7. Updating & save
      // 7.1. save product FIRST
      const savedProduct = await createdProduct.save();

      // 7.2. update status AFTER
      try {
        await firstValueFrom(
          this.nats.send('PRODUCTS_STATUS_UPDATE', {
            id: createdStatus._id.toString(),
            update: finalStatus,
          }),
        );
      } catch (err) {
        console.warn('⚠️ Status update failed:', err);
      }

      return savedProduct;
      // console.log('🔥 ~ ProductsService ~ create ~ manual:', validatedManual); // ! dev tool
      // console.log('🔥 ~ ProductsService ~ create ~ auto:', autoStatus); // ! dev tool
      // console.log('🔥 ~ ProductsService ~ create ~ final:', finalStatus); // ! dev tool
    } catch (error) {
      if (error instanceof RpcCustomException) {
        throw error;
      }

      if (error instanceof Error) {
        console.error('🔥 VALIDATION ERROR:', error.message);

        throw new RpcCustomException(
          error.message,
          HttpStatus.BAD_REQUEST,
          'VALIDATION_ERROR',
        );
      }

      throw new RpcCustomException(
        'Unknown error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        '500',
      );
    }
  }
  // ------------------------------
  // 🔵 FIND ALL
  // ------------------------------

  async findAll(query: QueryProductsDto): Promise<ProductWithPrice[]> {
    const {
      name,
      description,
      price,
      stock,
      users,
      images,
      tags,
      categories,
      deliveryRules,
      status,
      rating,
      ratingCount,
      reviews,
      brand,
      color,
      material,
      warranty,
      shipping,
      returnPolicy,
      sizes,
      salesPeriods,
    } = query;

    const filter: any = {};
    if (name !== undefined) filter.name = { $regex: name, $options: 'i' };
    if (description !== undefined)
      filter.description = { $regex: description, $options: 'i' };
    if (price !== undefined) filter.price = price;
    if (stock !== undefined) filter.stock = stock;
    if (users !== undefined) filter.users = { $in: users };
    if (images !== undefined) filter.images = { $elemMatch: images };
    if (tags !== undefined) filter.tags = { $in: tags };
    if (categories !== undefined) filter.categories = { $in: categories };
    if (deliveryRules !== undefined)
      filter.deliveryRules = { $in: deliveryRules };
    if (rating !== undefined) filter.rating = rating;
    if (ratingCount !== undefined) filter.ratingCount = ratingCount;
    if (reviews !== undefined) filter.reviews = reviews;
    if (brand !== undefined) filter.brand = brand;
    if (color !== undefined) filter.color = color;
    if (material !== undefined) filter.material = material;
    if (warranty !== undefined) filter.warranty = warranty;
    if (shipping !== undefined) filter.shipping = shipping;
    if (returnPolicy !== undefined) filter.returnPolicy = returnPolicy;
    if (sizes !== undefined) filter.sizes = sizes;
    if (salesPeriods !== undefined) filter.salesPeriods = salesPeriods;

    if (status) {
      // get the status productsStatusId

      const field = tagToStatusFieldMap[status.toLowerCase()];

      if (!field) {
        return []; // status unknown
      }
      // 🔥 Call ProductStatus ms
      const statuses = await firstValueFrom(
        this.nats.send('PRODUCTS_STATUS_GET_ALL', {
          [field]: true,
        }),
      );

      if (!statuses || !Array.isArray(statuses) || statuses.length === 0) {
        return [];
      }
      // Similar to DATALOADER: group multiple calls into a single one (ex:getStatus(product1.status)+getStatus(product2.status))-> getStatuses([product1.status, product2.status]) to optimize performance and reduce NATS calls
      const statusIds = statuses.map((s) => s._id);

      filter.status = { $in: statusIds };
    }

    const products = await this.productModel.find(filter).lean();

    return products.map((product) => ({
      ...product,
      finalPrice: getFinalPrice(product),
    }));
  }
  // ------------------------------
  // 🔵 FIND ONE
  // ------------------------------

  async findOne(id: string): Promise<ProductWithPrice> {
    // .lean() JS object pur & perfect to manipulate & add finalPrice without Mongoose overhead
    const product = await this.productModel.findById(id).lean();

    if (!product) {
      throw new RpcCustomException(
        'Product not found',
        HttpStatus.NOT_FOUND,
        '404',
      );
    }

    return {
      ...product,
      finalPrice: getFinalPrice(product),
    };
  }
  // ------------------------------
  // 🔵 RESERVE STOCK
  // ------------------------------
  async reserveStock(items: any[]) {
    for (const item of items) {
      const updated = await this.productModel.findOneAndUpdate(
        {
          _id: item.product_id,
          stock: { $gte: item.quantity },
        },
        { $inc: { stock: -item.quantity } },
        { new: true },
      );

      if (!updated) {
        return { success: false };
      }
    }

    return { success: true };
  }
  // ------------------------------
  // 🔵 UPDATE
  // ------------------------------

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product | null> {
    try {
      //  CHECK PRODUCT EXISTENCE + GET CURRENT STATUS
      const product = await this.findOne(id);

      if (!product.status) {
        throw new RpcCustomException(
          'No status provided',
          HttpStatus.BAD_REQUEST,
          '400',
        );
      }

      // 🟢 1. S.P VALIDATION
      if (updateProductDto.salesPeriods) {
        validateSalesPeriods(updateProductDto.salesPeriods);
      }

      // 🟢 2. UPDATE PRODUCT
      const updatedProduct = await this.productModel.findByIdAndUpdate(
        id,
        updateProductDto,
        {
          new: true,
          runValidators: true,
        },
      );

      if (!updatedProduct) {
        throw new RpcCustomException(
          'Product not found during update',
          HttpStatus.NOT_FOUND,
          '404',
        );
      }
      // 🔥 3. MANUAL VALIDATION
      const validatedManual = validateManualStatus(
        updatedProduct,
        updateProductDto.manualStatus,
      );
      // 🔥 4. AUTO
      const autoStatus = computeAutomaticStatus(updatedProduct);
      // 🔥 5. MERGE
      const finalStatus = mergeStatus(validatedManual, autoStatus);
      // 🔥 6. UPDATE UNIQUE
      await firstValueFrom(
        this.nats.send('PRODUCTS_STATUS_UPDATE', {
          id: product.status,
          update: finalStatus,
        }),
      );

      return updatedProduct;
    } catch (error) {
      throw new RpcCustomException(
        'Error updating product',
        HttpStatus.INTERNAL_SERVER_ERROR,
        'PRODUCT_UPDATE_ERROR',
      );
    }
  }

  // @Cron('*/5 * * * *') // toutes les 5 minutes
  // async updateStatuses() {
  //   const products = await this.productModel.find();

  //   for (const product of products) {
  //     const autoStatus = computeAutomaticStatus(product);

  //     await this.nats.send('PRODUCTS_STATUS_UPDATE', {
  //       id: product.status,
  //       update: autoStatus,
  //     });
  //   }
  // }
  // ------------------------------
  // 🔴 DELETE
  // ------------------------------
  async remove(
    id: string,
  ): Promise<{ deletedProduct: Product | null; deletedStatus?: any }> {
    // Étape 1 : Vérifie si le produit existe
    const product = await this.productModel.findById(id);
    if (!product) {
      throw new RpcCustomException(
        'Produit non trouvé',
        HttpStatus.NOT_FOUND,
        '404',
      );
    }

    // Étape 2 : Supprime le produit
    const deletedProduct = await this.productModel.findByIdAndDelete(id);

    // Étape 3 : Supprime le statut associé via NATS si présent
    let deletedStatus = null;
    if (product.status) {
      try {
        deletedStatus = await firstValueFrom(
          this.nats.send('PRODUCTS_STATUS_DELETE', product.status.toString()),
        );
      } catch (err) {
        console.warn(`Erreur lors de la suppression du statut lié : ${err}`);
        throw new RpcCustomException(
          `Deleted product failed ${err}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
          '500',
        );
      }
    }

    return { deletedProduct, deletedStatus };
  }
}
