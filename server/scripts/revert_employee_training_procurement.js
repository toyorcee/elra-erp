import mongoose from "mongoose";
import dotenv from "dotenv";
import Procurement from "../models/Procurement.js";
import Project from "../models/Project.js";

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

async function revertEmployeeTrainingProcurement() {
  try {
    await connectDB();

    console.log("\n🔄 REVERTING EMPLOYEE TRAINING PROCUREMENT");
    console.log("=".repeat(60));

    // Find the Employee Training procurement order (PO0002)
    const procurementOrder = await Procurement.findOne({ 
      poNumber: "PO0002" 
    }).populate('relatedProject', 'name code');

    if (!procurementOrder) {
      console.log("❌ Procurement order PO0002 not found!");
      return;
    }

    console.log(`📋 Found Order: ${procurementOrder.title}`);
    console.log(`📊 Current Status: ${procurementOrder.status}`);
    console.log(`🏢 Related Project: ${procurementOrder.relatedProject?.name}`);
    console.log(`💰 Total Amount: ₦${procurementOrder.totalAmount?.toLocaleString()}`);

    // Check if it's currently delivered
    if (procurementOrder.status !== "delivered") {
      console.log(`⚠️  Order is not in 'delivered' status. Current status: ${procurementOrder.status}`);
      console.log("❌ Cannot revert - order is not delivered");
      return;
    }

    console.log("\n🔄 Reverting to 'paid' status...");

    // Fix category validation issue - update invalid categories to valid ones
    if (procurementOrder.items && procurementOrder.items.length > 0) {
      procurementOrder.items.forEach(item => {
        if (item.category === "electronics") {
          item.category = "it_equipment"; // Map to valid unified category
          console.log(`   🔧 Fixed category: ${item.name} -> ${item.category}`);
        }
      });
    }

    // Revert to paid status
    procurementOrder.status = "paid";
    procurementOrder.deliveryStatus = "pending";
    
    // Remove delivery-related fields
    procurementOrder.actualDeliveryDate = undefined;
    procurementOrder.markedAsDeliveredBy = undefined;
    
    // Keep payment info (since it was paid)
    // procurementOrder.paidAmount remains the same
    // procurementOrder.paymentDate remains the same
    // procurementOrder.markedAsPaidBy remains the same

    // Remove delivery note from notes array
    procurementOrder.notes = procurementOrder.notes.filter(note => 
      !note.content.toLowerCase().includes("delivery completed")
    );

    // Ensure no inventory items were created
    procurementOrder.createdInventoryItems = [];

    // Update the document
    procurementOrder.updatedAt = new Date();

    await procurementOrder.save();

    // Also fix the project's inventoryCompleted flag
    const project = await Project.findById(procurementOrder.relatedProject);
    if (project) {
      project.workflowTriggers.inventoryCompleted = false;
      project.workflowTriggers.inventoryCompletedAt = undefined;
      project.workflowTriggers.inventoryCompletedBy = undefined;
      await project.save();
      console.log("   🔧 Fixed project inventoryCompleted flag");
    }

    console.log("✅ Successfully reverted to 'paid' status!");
    console.log("\n📊 Updated Order Details:");
    console.log(`   Status: ${procurementOrder.status}`);
    console.log(`   Delivery Status: ${procurementOrder.deliveryStatus}`);
    console.log(`   Payment Status: ${procurementOrder.paymentStatus}`);
    console.log(`   Paid Amount: ₦${procurementOrder.paidAmount?.toLocaleString()}`);
    console.log(`   Outstanding Amount: ₦${procurementOrder.outstandingAmount?.toLocaleString()}`);
    console.log(`   Created Inventory Items: ${procurementOrder.createdInventoryItems?.length || 0}`);
    console.log(`   Notes Count: ${procurementOrder.notes?.length || 0}`);

    console.log("\n🎯 REVERT COMPLETE!");
    console.log("The Employee Training procurement is now back to 'paid' status");
    console.log("You can now mark it as delivered when ready");

  } catch (error) {
    console.error("❌ Error during revert:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Database connection closed");
  }
}

revertEmployeeTrainingProcurement();