import mongoose from "mongoose";
import dotenv from "dotenv";
import Project from "../models/Project.js";
import BudgetAllocation from "../models/BudgetAllocation.js";
import Procurement from "../models/Procurement.js";

dotenv.config();

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined");
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`🟢 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

async function checkProjectProcurementState() {
  try {
    await connectDB();

    console.log("\n🔍 PROCUREMENT ORDERS ANALYSIS");
    console.log("=".repeat(80));

    // Get all procurement orders
    const procurementOrders = await Procurement.find()
      .populate('createdBy', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email')
      .populate('supplier')
      .populate('relatedProject', 'name code')
      .sort({ createdAt: -1 });

    console.log(`\n📋 TOTAL PROCUREMENT ORDERS: ${procurementOrders.length}`);
    console.log("-".repeat(50));

    // Group orders by status
    const ordersByStatus = {};
    procurementOrders.forEach(order => {
      if (!ordersByStatus[order.status]) {
        ordersByStatus[order.status] = [];
      }
      ordersByStatus[order.status].push(order);
    });

    // Print status summary
    console.log("\n📊 STATUS SUMMARY:");
    Object.entries(ordersByStatus).forEach(([status, orders]) => {
      console.log(`${status}: ${orders.length} orders`);
    });
    console.log("-".repeat(50));

    // Print detailed order information
    procurementOrders.forEach((order, index) => {
      console.log(`\nORDER #${index + 1}:`);
      console.log(`PO Number: ${order.poNumber}`);
      console.log(`Title: ${order.title}`);
      console.log(`Status: ${order.status}`);
      console.log(`Priority: ${order.priority}`);
      console.log(`Related Project: ${order.relatedProject?.name} (${order.relatedProject?.code})`);
      console.log(`Created By: ${order.createdBy?.firstName} ${order.createdBy?.lastName}`);
      console.log(`Approved By: ${order.approvedBy?.firstName} ${order.approvedBy?.lastName}`);
      console.log(`Supplier: ${order.supplier?.name || 'Not specified'}`);
      console.log(`Items: ${order.items?.length || 0}`);
      if (order.items?.length > 0) {
        console.log("\nItems Details:");
        order.items.forEach((item, i) => {
          console.log(`  ${i + 1}. ${item.name}`);
          console.log(`     Quantity: ${item.quantity}`);
          console.log(`     Unit Price: ₦${item.unitPrice?.toLocaleString()}`);
          console.log(`     Category: ${item.category}`);
        });
      }
      console.log(`\nSubtotal: ₦${order.subtotal?.toLocaleString()}`);
      console.log(`Tax: ₦${order.tax?.toLocaleString()}`);
      console.log(`Shipping: ₦${order.shipping?.toLocaleString()}`);
      console.log(`Total Amount: ₦${order.totalAmount?.toLocaleString()}`);
      console.log(`Created At: ${new Date(order.createdAt).toLocaleString()}`);
      console.log(`Expected Delivery: ${order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleString() : 'Not specified'}`);
      console.log("\n" + "-".repeat(50));
    });

    console.log("\n✅ ANALYSIS COMPLETE");
    console.log("=".repeat(80));

  } catch (error) {
    console.error("❌ Error during analysis:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Database connection closed");
  }
}

checkProjectProcurementState();