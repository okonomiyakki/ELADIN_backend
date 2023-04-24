const { Product } = require('../db/models/index');
const { AppError } = require('../middlewares/errorHandler');

const productService = {
    // [사용자] 카테고리 조회 - 카테고리 목록 조회
    async getCategoryList(req, res, next) {
        if (req.method !== 'GET') return next(new AppError(405, '잘못된 요청입니다.'));

        try {
            const foundCategories = await Product.distinct('category');

            if (!foundCategories) next(new AppError(404, '카테고리 목록이 존재하지 않습니다.'));

            res.status(200).json({ message: '카테고리 목록 조회 성공 ', data: foundCategories });
        } catch (error) {
            console.error(error);
            next(new AppError(500, '카테고리 목록 조회 실패'));
        }
    },

    // [관리자] 카테고리 추가 - 카테고리 추가
    async createCategory(req, res, next) {
        if (req.method !== 'POST') return next(new AppError(405, '잘못된 요청입니다.'));

        try {
            const addCategory = req.body.category;

            if (!addCategory) return next(new AppError(400, '등록하실 카테고리를 입력해주세요.'));

            const foundCategories = await Product.distinct('category');

            if (foundCategories.includes(addCategory)) {
                return next(
                    new AppError(404, `등록하실 '${addCategory}' 카테고리는 이미 존재합니다.`)
                );
            }

            const minProductId = await Product.find()
                .sort({ productId: 1 })
                .limit(1)
                .select('productId')
                .lean();

            const newProductId = minProductId.length ? minProductId[0].productId - 1 : 0;

            const createInfo = {
                productId: newProductId,
                title: ' ',
                author: ' ',
                price: ' ',
                category: addCategory,
                introduction: ' ',
                imgUrl: ' ',
                bestSeller: false,
                newBook: false,
                recommend: false,
                publisher: ' ',
            };

            const createdProduct = await Product.create(createInfo);

            res.status(201).json({ message: '카테고리 등록 성공 ', data: addCategory });
        } catch (error) {
            console.error(error);
            next(new AppError(500, { message: '카테고리 등록 실패' }));
        }
    },

    // [관리자] 카테고리 수정 - 카테고리 수정 (해당하는 모든 책에 반영)
    async updateCategory(req, res, next) {
        if (req.method !== 'PATCH') return next(new AppError(405, '잘못된 요청입니다.'));

        try {
            const { currentCategory, updateCategory } = req.body;

            if (!currentCategory || !updateCategory)
                return next(
                    new AppError(400, '현재 카테고리와, 수정하실 카테고리를 모두 입력해주세요.')
                );

            if (currentCategory === updateCategory)
                return next(new AppError(400, '현재 카테고리와 수정하실 카테고리가 동일합니다.'));

            const updatedCategory = await Product.updateMany(
                { category: currentCategory },
                { category: updateCategory },
                { new: true }
            );

            res.status(200).json({ message: '카테고리 수정 성공', data: { updateCategory } });
        } catch (error) {
            console.error(error);
            next(new AppError(500, '카테고리 수정 실패'));
        }
    },

    // [관리자] 카테고리 삭제 - 카테고리 삭제
    async deleteCategory(req, res, next) {
        if (req.method !== 'DELETE') return next(new AppError(405, '잘못된 요청입니다.'));

        try {
            const removeCategory = req.body.category;

            if (!removeCategory)
                return next(new AppError(400, '삭제하실 카테고리를 입력해주세요.'));

            const foundCategories = await Product.distinct('category');

            if (!foundCategories.includes(removeCategory))
                return next(
                    new AppError(404, `삭제하실 '${removeCategory}' 카테고리가 존재하지 않습니다.`)
                );

            const deletedCategory = await Product.deleteMany({ category: removeCategory });

            res.status(200).json({
                message: '카테고리 삭제 성공 ',
                data: deletedCategory,
                removeCategory: removeCategory,
            });
        } catch (error) {
            console.error(error);
            next(new AppError(500, '카테고리 삭제 실패'));
        }
    },

    // [관리자] 상품 추가 - 책 정보 추가
    async createProduct(req, res, next) {
        if (req.method !== 'POST') return next(new AppError(405, '잘못된 요청입니다.'));

        try {
            // productId는 서버에서 새로 생성함
            const { title, author, price, category, introduction, imgUrl, publisher } = req.body;

            if (!title || !author || !price || !category || !introduction || !imgUrl || !publisher)
                return next(new AppError(400, '책 정보를 모두 입력해 주세요.'));

            const maxProductId = await Product.find()
                .sort({ productId: -1 })
                .limit(1)
                .select('productId')
                .lean();

            const newProductId = maxProductId.length > 0 ? maxProductId[0].productId + 1 : 1;

            const createInfo = {
                productId: newProductId,
                title,
                author,
                price,
                category,
                introduction,
                imgUrl,
                bestSeller: Math.random() >= 0.5,
                newBook: Math.random() >= 0.5,
                recommend: Math.random() >= 0.5,
                publisher,
            };

            const createdProduct = await Product.create(createInfo);

            res.status(201).json({ message: '책 추가 성공', data: createdProduct });
        } catch (error) {
            console.error(error);
            next(new AppError(500, '책 추가 실패'));
        }
    },

    // [관리자] 상품 수정 - 책 정보 수정
    async updateProduct(req, res, next) {
        if (req.method !== 'PATCH') return next(new AppError(405, '잘못된 요청입니다.'));

        try {
            const { productId } = req.params;

            const { title, author, price, category, introduction, imgUrl, publisher } = req.body;

            if (!productId) return next(new AppError(400, 'productId를 입력해 주세요.'));

            if (!title || !author || !price || !category || !introduction || !imgUrl || !publisher)
                return next(new AppError(400, '책 정보를 모두 입력해 주세요.'));

            const foundProduct = await Product.findOne({ productId });

            if (!foundProduct) return next(new AppError(404, '수정하실 책이 존재하지 않습니다.'));

            const updateInfo = {
                title,
                author,
                price,
                category,
                introduction,
                imgUrl,
                bestSeller: Math.random() >= 0.5,
                newBook: Math.random() >= 0.5,
                recommend: Math.random() >= 0.5,
                publisher,
            };

            const updatedProduct = await Product.updateOne({ productId }, updateInfo, {
                new: true,
            });

            const foundUpdatedProduct = await Product.findOne({ productId });

            res.status(200).json({ message: '책 정보 수정 성공', data: foundUpdatedProduct });
        } catch (error) {
            console.error(error);
            next(new AppError(500, '책 정보 수정 실패'));
        }
    },

    // [관리자] 상품 삭제 - 책 정보 삭제
    async deleteProduct(req, res, next) {
        if (req.method !== 'DELETE') return next(new AppError(405, '잘못된 요청입니다.'));

        try {
            const { productId } = req.params;

            if (!productId) return next(new AppError(400, 'productId를 입력해 주세요.'));

            const foundProduct = await Product.findOne({ productId });

            if (!foundProduct) return next(new AppError(404, '삭제하실 책이 존재하지 않습니다.'));

            const deletedProduct = await Product.deleteOne({ productId });

            res.status(200).json({ message: '책 정보 삭제 성공', data: deletedProduct });
        } catch (error) {
            console.error(error);
            next(new AppError(500, '책 정보 삭제 실패'));
        }
    },

    // [사용자] 상품 목록 - 전체 책 조회
    async getAllProducts(req, res, next) {
        if (req.method !== 'GET') return next(new AppError(405, '잘못된 요청입니다.'));

        try {
            const foundAllProductsExceptEmpty = await Product.find({ productId: { $gt: 0 } });

            if (!foundAllProductsExceptEmpty)
                next(new AppError(404, 'DB에 책 데이터가 더이상 존재하지 않습니다.'));

            res.status(200).json({
                message: '모든 책 조회 성공',
                data: foundAllProductsExceptEmpty,
            });
        } catch (error) {
            console.error(error);
            next(new AppError(500, '모든 책 조회 실패'));
        }
    },

    // [사용자] 상품 목록 - 카테고리별 책 목록 조회
    async getProductByCategory(req, res, next) {
        if (req.method !== 'GET') return next(new AppError(405, '잘못된 요청입니다.'));

        try {
            const { category } = req.params;

            if (!category) return next(new AppError(400, '카테고리를 입력해 주세요.'));

            const foundCategories = await Product.distinct('category');

            if (!foundCategories.includes(currentCategory))
                return next(
                    new AppError(404, `조회하실 '${category}' 카테고리는 존재하지 않습니다.`)
                );

            const foundProduct = await Product.find({ category, productId: { $gt: 0 } });

            if (!foundProduct || foundProduct.length === 0)
                return next(
                    new AppError(404, `'${category}' 카테고리 관련 책이 존재하지 않습니다.`)
                );

            res.status(200).json({ message: '카테고리별 책 목록 조회 성공', data: foundProduct });
        } catch (error) {
            console.error(error);
            next(new AppError(500, '카테고리별 책 조회 실패'));
        }
    },

    // [사용자] 상품 상세 - 선택한 책의 상세정보 조회
    async getProductByProductId(req, res, next) {
        if (req.method !== 'GET') return next(new AppError(405, '잘못된 요청입니다.'));

        try {
            const { productId } = req.params;

            if (!productId) return next(new AppError(400, 'productId를 입력해 주세요.'));

            const foundProduct = await Product.findOne({ productId });

            if (!foundProduct) return next(new AppError(404, '선택하신 책이 존재하지 않습니다.'));

            res.status(200).json({ message: '선택한 책 조회 성공 ', data: foundProduct });
        } catch (error) {
            console.error(error);
            next(new AppError(500, '선택한 책 조회 실패'));
        }
    },
};

module.exports = productService;
