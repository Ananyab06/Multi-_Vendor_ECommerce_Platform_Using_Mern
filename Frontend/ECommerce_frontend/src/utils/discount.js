export const getProductDiscountInfo = (product) => {
  if (!product || !product.price) {
    return { hasDiscount: false, discountPercent: 0, originalPrice: 0 };
  }
  
  // If originalPrice exists and is greater than price, calculate discount percentage
  if (product.originalPrice !== undefined && product.originalPrice !== null && product.originalPrice > product.price) {
    const discountPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    return {
      hasDiscount: true,
      discountPercent,
      originalPrice: product.originalPrice
    };
  }

  return {
    hasDiscount: false,
    discountPercent: 0,
    originalPrice: product.price
  };
};
