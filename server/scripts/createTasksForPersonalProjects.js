import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from '../models/Project.js';
import Task from '../models/Task.js';

dotenv.config();

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined");
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

async function createTasksForPersonalProjects() {
  try {
    await connectDB();
    console.log('🚀 Starting task creation for personal projects...');
    
    // Find all personal projects that are approved but don't have tasks
    const personalProjects = await Project.find({
      projectScope: 'personal',
      status: { $in: ['approved', 'implementation', 'in_progress', 'active', 'completed'] },
      isActive: true
    }).populate('createdBy', 'firstName lastName email');

    console.log(`📋 Found ${personalProjects.length} personal projects to process`);

    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const project of personalProjects) {
      try {
        console.log(`\n🔍 Processing project: ${project.name} (${project.code})`);
        
        // Check if tasks already exist for this project
        const existingTasks = await Task.find({ 
          project: project._id, 
          isActive: true,
          isBaseTask: true 
        });

        if (existingTasks.length > 0) {
          console.log(`⏭️  Skipping - ${existingTasks.length} tasks already exist`);
          skippedCount++;
          continue;
        }

        // Create tasks using the project's method
        const createdTasks = await project.createImplementationTasks(project.createdBy);
        
        console.log(`✅ Created ${createdTasks.length} tasks for project ${project.code}`);
        console.log(`📋 Tasks: ${createdTasks.map(t => t.title).join(', ')}`);
        
        processedCount++;
        
      } catch (error) {
        console.error(`❌ Error processing project ${project.code}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 SUMMARY:');
    console.log(`✅ Successfully processed: ${processedCount} projects`);
    console.log(`⏭️  Skipped (already have tasks): ${skippedCount} projects`);
    console.log(`❌ Errors: ${errorCount} projects`);
    console.log(`📋 Total projects found: ${personalProjects.length}`);

  } catch (error) {
    console.error('❌ Script error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
createTasksForPersonalProjects();
