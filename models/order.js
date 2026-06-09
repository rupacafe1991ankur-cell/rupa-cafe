const orderSchema = new mongoose.Schema({
  tableNumber: String,
  customer: String,
  phone: String,
  address: String,
  items: [
    {
      name: String,
      qty: Number,
      price: Number
    }
  ],
  total: Number,
  status: {
    type: String,
    default: "Pending"
  }
}, { timestamps: true });