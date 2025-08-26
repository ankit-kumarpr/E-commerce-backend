const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  seq: { type: Number, default: 0 },
});

counterSchema.statics.next = async function (name) {
  const doc = await this.findOneAndUpdate(
    { name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq;
};

module.exports = mongoose.model('Counter', counterSchema);
