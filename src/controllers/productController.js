"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProducts = getProducts;
exports.postProduct = postProduct;
exports.getProductId = getProductId;
exports.deleteProduct = deleteProduct;
exports.patchProduct = patchProduct;
exports.postFavorites = postFavorites;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// 상품 목록 가져오기
function getProducts(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const page = parseInt(req.query.page, 10) || 1;
            const pageSize = parseInt(req.query.pageSize, 10) || 10;
            const skip = (page - 1) * pageSize;
            const orderByField = req.query.orderByField || 'createdAt';
            const orderDir = req.query.orderDir || 'desc';
            const products = yield prisma.product.findMany({
                skip,
                take: pageSize,
                orderBy: { [orderByField]: orderDir },
            });
            return res.status(200).json({ message: '상품 정보 추출', products });
        }
        catch (error) {
            console.error('상품 정보 추출 중 오류 발생:', error);
            return res.status(500).json({ message: '상품 정보를 추출할 수 없습니다.' });
        }
    });
}
// 상품 추가
function postProduct(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { name, description, price, tags, images } = req.body;
            const { userId } = req.user;
            const tagText = tags.map((tag) => tag.text);
            const parsedPrice = parseInt(price, 10);
            const imagesUrls = images.map((image) => image.url);
            const product = yield prisma.product.create({
                data: {
                    name,
                    description,
                    price: parsedPrice,
                    tags: tagText,
                    images: imagesUrls,
                    userId,
                },
            });
            return res.status(201).json({ message: '상품 정보 추가', product });
        }
        catch (error) {
            console.error('상품 정보 추가 중 오류 발생:', error);
            return res.status(500).json({ message: '상품 정보를 추가할 수 없습니다.' });
        }
    });
}
// 상품 ID로 정보 가져오기
function getProductId(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { productId } = req.params;
            const product = yield prisma.product.findUnique({
                where: { id: parseInt(productId, 10) },
            });
            return res.status(200).json({ message: '상품 정보 추출', product });
        }
        catch (error) {
            console.error('상품 정보 추출 중 오류 발생:', error);
            return res.status(500).json({ message: '상품 정보를 추출할 수 없습니다.' });
        }
    });
}
// 상품 삭제
function deleteProduct(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { productId } = req.params;
            const product = yield prisma.product.findUnique({
                where: { id: parseInt(productId, 10) },
                select: {
                    id: true,
                    userId: true,
                },
            });
            if (!product) {
                return res
                    .status(404)
                    .json({ message: '해당 상품이 존재하지 않습니다.' });
            }
            if (product.userId !== req.user.userId) {
                return res
                    .status(403)
                    .json({ message: '해당 상품을 삭제할 권한이 없습니다.' });
            }
            const deletedProduct = yield prisma.product.delete({
                where: { id: parseInt(productId, 10) },
            });
            return res
                .status(200)
                .json({ message: '상품 정보 삭제 성공', deletedProduct });
        }
        catch (error) {
            console.error('상품 정보 삭제 중 오류 발생:', error);
            return res.status(500).json({ message: '상품 정보를 삭제할 수 없습니다.' });
        }
    });
}
// 상품 수정
function patchProduct(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { productId } = req.params;
            const { name, description, price, tags, images } = req.body;
            const product = yield prisma.product.findUnique({
                where: { id: parseInt(productId, 10) },
                select: {
                    id: true,
                    userId: true,
                },
            });
            if (!product) {
                return res
                    .status(404)
                    .json({ message: '해당 상품이 존재하지 않습니다.' });
            }
            if (product.userId !== req.user.userId) {
                return res
                    .status(403)
                    .json({ message: '해당 상품을 수정할 권한이 없습니다.' });
            }
            const tagText = tags
                ? tags.map((tag) => tag.text)
                : [];
            const parsedPrice = price ? parseInt(price, 10) : undefined;
            const imagesUrls = images
                ? images.map((image) => image.url)
                : [];
            const updatedProduct = yield prisma.product.update({
                where: { id: parseInt(productId, 10) },
                data: {
                    name: name || undefined,
                    description: description || undefined,
                    price: parsedPrice || undefined,
                    tags: tagText.length ? tagText : undefined,
                    images: imagesUrls.length ? imagesUrls : undefined,
                },
            });
            return res
                .status(200)
                .json({ message: '상품 정보 변경 성공', updatedProduct });
        }
        catch (error) {
            console.error('상품 정보 변경 중 오류 발생:', error);
            return res.status(500).json({ message: '상품 정보를 변경할 수 없습니다.' });
        }
    });
}
// 좋아요 추가/취소
function postFavorites(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { productId } = req.params;
            const userId = req.user.userId;
            if (!productId) {
                return res.status(400).json({ message: 'Product ID가 필요합니다.' });
            }
            const existingFavorite = yield prisma.favorite.findUnique({
                where: {
                    userId_productId: {
                        userId: userId,
                        productId: parseInt(productId),
                    },
                },
            });
            if (existingFavorite) {
                // 좋아요 취소
                yield prisma.favorite.delete({
                    where: {
                        id: existingFavorite.id,
                    },
                });
                yield prisma.product.update({
                    where: { id: parseInt(productId) },
                    data: {
                        favoriteCount: { decrement: 1 },
                    },
                });
                return res.status(200).json({ message: '좋아요가 취소되었습니다.' });
            }
            else {
                // 좋아요 추가
                yield prisma.favorite.create({
                    data: {
                        userId: userId,
                        productId: parseInt(productId),
                    },
                });
                yield prisma.product.update({
                    where: { id: parseInt(productId) },
                    data: {
                        favoriteCount: { increment: 1 },
                    },
                });
                return res.status(200).json({ message: '좋아요가 추가되었습니다.' });
            }
        }
        catch (error) {
            console.error('좋아요 처리 중 오류 발생:', error);
            return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
        }
    });
}
exports.default = {
    getProducts,
    postProduct,
    getProductId,
    deleteProduct,
    patchProduct,
    postFavorites,
};
