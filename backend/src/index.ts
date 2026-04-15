import app from './app';
import { setupContainer } from './infrastructure/di/setupContainer';
import { prisma } from './infrastructure/database/prisma.client';
import { logger } from './infrastructure/logging/logger';

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    console.log('📊 Starting HireFlow Bootloader...');
    
    // 1. Connect to Database
    console.log('📡 Connecting to PostgreSQL (Prisma)...');
    await prisma.$connect();
    logger.info('✅ Database connected');
    
    // 2. Initialize Dependency Injection Container
    console.log('🔧 Initializing Dependency Container...');
    try {
      setupContainer(); 
      logger.info('✅ Container and Dependencies ready');
    } catch (e) {
      console.error('❌ DI Container initialization failed:', e);
      throw e;
    }
    
    // 3. Start listening
    const server = app.listen(PORT, () => {
      console.log('');
      console.log('🚀 ═══════════════════════════════════════');
      console.log(`   HireFlow Unified Server Running`);
      console.log(`   http://localhost:${PORT}`);
      console.log('   ═══════════════════════════════════════');
      console.log('');
      console.log('   📍 Endpoints:');
      console.log(`      Health:     http://localhost:${PORT}/api/health`);
      console.log(`      Debug:      http://localhost:${PORT}/api/debug/routes`);
      console.log(`      Candidates: http://localhost:${PORT}/api/v1/candidates`);
      console.log(`      Jobs:       http://localhost:${PORT}/api/v1/jobs`);
      console.log('   ═══════════════════════════════════════');
    });

    // Handle process events
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down gracefully...');
      await prisma.$disconnect();
      server.close();
      process.exit(0);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error({ reason, promise }, 'Unhandled Rejection');
    });

    process.on('uncaughtException', (error) => {
      logger.error(error, 'Uncaught Exception');
      process.exit(1);
    });

  } catch (error) {
    logger.error(error, '❌ Failed to start server');
    process.exit(1);
  }
}

startServer();
