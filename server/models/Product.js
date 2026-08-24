import { products } from '../db.js';

const Product = {
  async findOne(query) {
    return products.findOne(query);
  },

  async count(query) {
    return products.count(query);
  },

  async insertMany(docs) {
    const results = [];
    for (const doc of docs) {
      results.push(await products.insert(doc));
    }
    return results;
  }
};

export default Product;
