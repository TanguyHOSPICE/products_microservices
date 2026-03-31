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
      console.log(
        '🧙🏽‍♂️ ~ ProductsService ~ create ~ createdStatus:',
        createdStatus,
      ); // ! dev tool
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

      console.log(
        '🧙🏽‍♂️ ~ ProductsService ~ create ~ createdProduct:',
        createdProduct,
      ); // ! dev tool
      console.log(
        '🧙🏽‍♂️ ~ ProductsService ~ create ~ createdStatus._id:',
        createdStatus._id,
      ); // ! dev tool

      // 🔥 4. MANUAL VALIDATION
      const validatedManual = validateManualStatus(
        createdProduct,
        createProductDto.manualStatus,
      );
      // 🔥 5. AUTO
      const autoStatus = computeAutomaticStatus(createdProduct);
      // 🔥 6. MERGE FINAL
      const finalStatus = mergeStatus(validatedManual, autoStatus);
      // 🔥 7. UPDATE UNIQUE
      await firstValueFrom(
        this.nats.send('PRODUCTS_STATUS_UPDATE', {
          id: createdStatus._id,
          update: finalStatus,
        }),
      );
      // console.log('🔥 ~ ProductsService ~ create ~ manual:', validatedManual); // ! dev tool
      // console.log('🔥 ~ ProductsService ~ create ~ auto:', autoStatus); // ! dev tool
      // console.log('🔥 ~ ProductsService ~ create ~ final:', finalStatus); // ! dev tool

      return createdProduct.save();
    } catch (error) {
      throw new RpcCustomException(
        error?.message || 'Error creating product',
        error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        error?.code || '500',
      );
    }
  }
  // ------------------------------
  // 🔵 FIND ALL
  // ------------------------------
  async findAll(): Promise<ProductWithPrice[]> {
    const products = await this.productModel.find().lean();

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
        error.message || 'Error updating product',
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
        console.warn(
          `Erreur lors de la suppression du statut lié : ${err.message}`,
        );
      }
    }

    return { deletedProduct, deletedStatus };
  }
}
