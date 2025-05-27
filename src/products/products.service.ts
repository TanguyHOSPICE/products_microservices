import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClientProxy } from '@nestjs/microservices';
import { Product } from './schema/product.schema';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { firstValueFrom } from 'rxjs';
import { RpcCustomException } from 'src/exceptions/rpc-custom.exception';
import {
  oneMonthAgo,
  tagToStatusFieldMap,
} from 'src/utils/functions/FProducts';
import { IProductStatusPayload } from 'src/utils/interfaces/interfaces';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
    @Inject('NATS_GATEWAY') private readonly nats: ClientProxy,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // const created = new this.productModel(createProductDto);
    // return created.save();
    try {
      // 1. Créer un ProductStatus via NATS avec les valeurs par défaut
      const defaultStatusPayload = {}; // pas besoin de champs, ton schéma les gère par défaut

      const createdStatus = await firstValueFrom(
        this.nats.send('PRODUCTS_STATUS_DEFAULT_CREATE', defaultStatusPayload),
      );

      if (!createdStatus || !createdStatus._id) {
        throw new RpcCustomException(
          'Échec de la création du statut produit',
          HttpStatus.INTERNAL_SERVER_ERROR,
          '500',
        );
      }

      // 2. Créer le produit en liant le status reçu
      const createdProduct = new this.productModel({
        ...createProductDto,
        status: createdStatus._id,
      });
      // console.log(
      //   '🧙🏽‍♂️ ~ ProductsService ~ create ~ createdStatus._id:',
      //   createdStatus._id,
      // ); // ! dev tool

      return createdProduct.save();
    } catch (error) {
      throw new RpcCustomException(
        error?.message || 'Erreur lors de la création du produit',
        error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        error?.code || '500',
      );
    }
  }

  async findAll(): Promise<Product[]> {
    return this.productModel.find().exec();
  }

  async findOne(id: string): Promise<Product | null> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new RpcCustomException(
        'Product not found',
        HttpStatus.NOT_FOUND,
        '404',
      );
    }
    return product;
  }

  // async update(
  //   id: string,
  //   updateProductDto: UpdateProductDto,
  // ): Promise<Product | null> {
  //   try {
  //     const productExist = await this.findOne(id); // Lève déjà une erreur si non trouvé

  //     if (!productExist.status) {
  //       throw new RpcCustomException(
  //         'No status provided for the product',
  //         HttpStatus.BAD_REQUEST,
  //         '400',
  //       );
  //     }

  //     const productStatus = await firstValueFrom(
  //       this.nats.send('PRODUCTS_STATUS_GET_BY_ID', {
  //         id: productExist.status,
  //       }),
  //     );

  //     if (!productStatus) {
  //       throw new RpcCustomException(
  //         'Product status not found',
  //         HttpStatus.NOT_FOUND,
  //         '404',
  //       );
  //     }

  //     // Vérifie si le produit a plus d’un mois
  //     const isOlderThanOneMonth = productExist.createdAt < oneMonthAgo;

  //     if (isOlderThanOneMonth && productStatus.isNewProduct === true) {
  //       // Mise à jour du statut : isNewProduct -> false
  //       await firstValueFrom(
  //         this.nats.send('PRODUCTS_STATUS_UPDATE', {
  //           id: productExist.status,
  //           update: { isNewProduct: false },
  //         }),
  //       );
  //     }

  //     const updatedProduct = await this.productModel.findByIdAndUpdate(
  //       id,
  //       updateProductDto,
  //       { new: true, runValidators: true },
  //     );

  //     if (!updatedProduct) {
  //       throw new RpcCustomException(
  //         'Product not found during update',
  //         HttpStatus.NOT_FOUND,
  //         '404',
  //       );
  //     }

  //     return updatedProduct;
  //   } catch (error) {
  //     throw new RpcCustomException(
  //       error.message || 'Error updating product',
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //       'PRODUCT_UPDATE_ERROR',
  //     );
  //   }
  // }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product | null> {
    try {
      const productExist = await this.findOne(id);

      if (!productExist.status) {
        throw new RpcCustomException(
          'No status provided',
          HttpStatus.BAD_REQUEST,
          '400',
        );
      }

      const productStatus = await firstValueFrom(
        this.nats.send('PRODUCTS_STATUS_GET_BY_ID', {
          id: productExist.status,
        }),
      );

      if (!productStatus) {
        throw new RpcCustomException(
          'Product status not found',
          HttpStatus.NOT_FOUND,
          '404',
        );
      }

      const statusUpdate: Partial<IProductStatusPayload> = {};

      // --- Logic related to stock ---
      const previousStock = productExist.stock;
      const incomingStock = updateProductDto.stock;
      const isStockUpdated =
        incomingStock !== undefined && incomingStock !== previousStock;

      if (isStockUpdated) {
        if (incomingStock === 0 && productStatus.isOutOfStock !== true) {
          statusUpdate.isOutOfStock = true;
          statusUpdate.isAvailable = false;
        } else if (incomingStock > 0 && productStatus.isOutOfStock === true) {
          statusUpdate.isOutOfStock = false;
          statusUpdate.isAvailable = true;
        }
      }

      // --- Logic related to new product status ---
      const isOlderThanOneMonth = productExist.createdAt < oneMonthAgo;
      if (isOlderThanOneMonth && productStatus.isNewProduct === true) {
        statusUpdate.isNewProduct = false;
      }
      // --- Logic related to dynamic tags ---
      for (const [tag, field] of Object.entries(tagToStatusFieldMap)) {
        const hasTag = updateProductDto.tags?.includes(tag);
        const currentStatusValue = productStatus[field];

        if (hasTag && currentStatusValue !== true) {
          statusUpdate[field] = true;
        } else if (!hasTag && currentStatusValue === true) {
          statusUpdate[field] = false;
        }
      }

      // --- Update status if there are changes ---
      if (Object.keys(statusUpdate).length > 0) {
        await firstValueFrom(
          this.nats.send('PRODUCTS_STATUS_UPDATE', {
            id: productExist.status,
            update: statusUpdate,
          }),
        );
      }

      const updatedProduct = await this.productModel.findByIdAndUpdate(
        id,
        updateProductDto,
        { new: true, runValidators: true },
      );

      if (!updatedProduct) {
        throw new RpcCustomException(
          'Product not found during update',
          HttpStatus.NOT_FOUND,
          '404',
        );
      }

      return updatedProduct;
    } catch (error) {
      throw new RpcCustomException(
        error.message || 'Error updating product',
        HttpStatus.INTERNAL_SERVER_ERROR,
        'PRODUCT_UPDATE_ERROR',
      );
    }
  }
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
