import { PrismaClient } from "@prisma/client"; // Prisma ORM 사용 예시 (필요시 다른 ORM 또는 DB 라이브러리 사용 가능)

const prisma = new PrismaClient();
export async function getProducts(req, res, next) {
  try {
    const products = await prisma.product.findMany();
    return res.status(200).json({ message: "상품 정보 추출", products });
  } catch (error) {
    console.error("상품 정보 추출 중 오류 발생:", error);
    return res.status(500).json({ message: "상품 정보를 추출할 수 없습니다." });
  }
}

export async function postProduct(req, res, next) {
  try {
    const { name, description, price, tags, images } = req.body;
    const { userId } = req.user;

    const tagText = tags.map((tag) => tag.text);
    const parsedPrice = parseInt(price, 10);
    const imagesUrls = images.map((image) => image.url);
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parsedPrice,
        tags: tagText,
        images: imagesUrls,
        userId,
      },
    });
    return res.status(201).json({ message: "상품 정보 추가", product });
  } catch (error) {
    console.error("상품 정보 추가 중 오류 발생:", error);
    return res.status(500).json({ message: "상품 정보를 추가할 수 없습니다." });
  }
}

export default {
  getProducts,
  postProduct,
};