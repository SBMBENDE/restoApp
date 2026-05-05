import mongoose from 'mongoose'

const MONGODB_URI =
  'mongodb+srv://lekira-db-admin:LeKira75ruePoissonniers@lekira.m2pitg3.mongodb.net/lekira?retryWrites=true&w=majority&appName=lekira'

await mongoose.connect(MONGODB_URI)

const orders = await mongoose.connection
  .collection('orders')
  .find({ billId: { $exists: false } })
  .toArray()
console.log('Orders without billId:', orders.length)

const tableMap = {}
for (const order of orders) {
  if (!tableMap[order.tableId]) {
    const bill = await mongoose.connection.collection('bills').insertOne({
      tableIds: [order.tableId],
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    tableMap[order.tableId] = bill.insertedId.toString()
    console.log(
      'Created bill',
      tableMap[order.tableId],
      'for table',
      order.tableId,
    )
  }
  await mongoose.connection
    .collection('orders')
    .updateOne(
      { _id: order._id },
      { $set: { billId: tableMap[order.tableId] } },
    )
  console.log('Updated order', order._id, '-> billId', tableMap[order.tableId])
}

await mongoose.disconnect()
console.log('Done.')
