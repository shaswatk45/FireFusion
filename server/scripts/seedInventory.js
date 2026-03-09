const mongoose = require('mongoose');
const InventoryItem = require('../models/InventoryItem');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const items = [
  { name: 'First Aid Kits', quantity: 3, minRequired: 2 },
  { name: 'Rescue Equipment', quantity: 1, minRequired: 2 },
  { name: 'Communication Devices', quantity: 5, minRequired: 3 }
];

async function seed() {
  await InventoryItem.deleteMany({});
  await InventoryItem.insertMany(items);
  console.log('Inventory seeded');
  mongoose.disconnect();
}

seed();
