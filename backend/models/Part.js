const mongoose = require('mongoose');

const partSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  supplier: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Part', partSchema);