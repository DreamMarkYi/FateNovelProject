const mongoose = require('mongoose');
const { connectMongoDB } = require('../config/mongodb');
const MiscMessage = require('../schemas/miscMessageSchema');

/**
 * 初始化杂项消息数据
 */
async function initMiscMessages() {
  try {
    console.log('📨 开始初始化杂项消息数据...\n');
    
    // 连接 MongoDB
    await connectMongoDB();
    
    // 清空现有数据（可选，根据需要决定是否保留）
    // await MiscMessage.deleteMany({});
    // console.log('✅ 已清空现有消息数据\n');
    
    // 示例消息数据
    const sampleMessages = [
      {
        topic: 'system_erratic_behavior',
        date: new Date(Date.now() - 5 * 60000), // 5分钟前
        sender: 'UNKNOWN',
        messageType: 'SMS',
        direction: 'received',
        content: 'Are you seeing this? The system is behaving erratically. I see large hex dumps in the log files. Don\'t trust the logs.',
        unlockConditions: [],
        displayOrder: 1,
        isActive: true,
        isRead: false,
        visibility: 'all'
      },
      {
        topic: 'sarah_missed_call',
        date: new Date(Date.now() - 10 * 60000), // 10分钟前
        sender: 'SARAH',
        messageType: 'PHONE',
        direction: 'received',
        content: 'Missed call. Please call back when available. Urgent matter regarding the old drive.',
        unlockConditions: [],
        displayOrder: 2,
        isActive: true,
        isRead: false,
        visibility: 'all'
      },
      {
        topic: 'admin_logs_discussion',
        date: new Date(Date.now() - 30 * 60000), // 30分钟前
        sender: 'ADMIN',
        messageType: 'QQ',
        direction: 'received',
        content: 'Hey, I found something interesting in the logs. Can we discuss this?',
        unlockConditions: [],
        displayOrder: 3,
        isActive: true,
        isRead: true,
        visibility: 'all'
      },
      {
        topic: 'sys_admin_maintenance',
        date: new Date(Date.now() - 60 * 60000), // 1小时前
        sender: 'SYS_ADMIN',
        messageType: 'PHONE',
        direction: 'received',
        content: 'Scheduled maintenance postponed. I\'m trying to re-route the power to the main cluster but the visual cortex keeps failing.',
        unlockConditions: [],
        displayOrder: 4,
        isActive: true,
        isRead: true,
        visibility: 'all'
      },
      {
        topic: 'user_chapter_access_request',
        date: new Date(Date.now() - 2 * 60 * 60000), // 2小时前
        sender: 'USER',
        messageType: 'QQ',
        direction: 'sent',
        content: 'Requesting access to chapter database. Authorization code: ********',
        unlockConditions: [],
        displayOrder: 5,
        isActive: true,
        isRead: true,
        visibility: 'day'
      },
      {
        topic: 'sarah_old_drive_found',
        date: new Date(Date.now() - 24 * 60 * 60000), // 1天前
        sender: 'SARAH',
        messageType: 'SMS',
        direction: 'received',
        content: 'I found the old drive. It\'s covered in rust but might be readable if we use the legacy decryption protocol.',
        unlockConditions: [],
        displayOrder: 6,
        isActive: true,
        isRead: true,
        visibility: 'all'
      },
      {
        topic: 'network_connection_failed',
        date: new Date(Date.now() - 7 * 24 * 60 * 60000), // 7天前
        sender: 'NETWORK',
        messageType: 'SMS',
        direction: 'received',
        content: 'Connection established...\nHandshake failed.\nPacket loss: 98%\nRetrying...',
        unlockConditions: [],
        displayOrder: 7,
        isActive: true,
        isRead: true,
        visibility: 'all'
      },
      {
        topic: 'system_chapter_unlocked',
        date: new Date(Date.now() - 2 * 60000), // 2分钟前
        sender: 'SYSTEM',
        messageType: 'SYSTEM',
        direction: 'received',
        content: 'New chapter unlocked. Access granted to restricted memory sectors.',
        unlockConditions: ['chapter_01'], // 需要完成 chapter_01 才能看到
        displayOrder: 0,
        isActive: true,
        isRead: false,
        visibility: 'all'
      },
      {
        topic: 'admin_security_alert',
        date: new Date(Date.now() - 30 * 60000), // 30分钟前
        sender: 'ADMIN',
        messageType: 'ADMIN',
        direction: 'received',
        content: 'Security alert: Unauthorized access attempt detected. All systems operational.',
        unlockConditions: [],
        displayOrder: 1,
        isActive: true,
        isRead: false,
        visibility: 'night' // 仅夜用户可见
      },
      {
        topic: 'user_chapter_access_request_day',
        date: new Date(Date.now() - 15 * 60000), // 15分钟前
        sender: 'USER',
        messageType: 'USER',
        direction: 'sent',
        content: 'Requesting access to chapter database. Authorization code: ********',
        unlockConditions: [],
        displayOrder: 0,
        isActive: true,
        isRead: true,
        visibility: 'day' // 仅昼用户可见
      },
      // 消息链示例：需要接收其他消息后才能显示
      {
        topic: 'sarah_followup_message',
        date: new Date(Date.now() - 3 * 60000), // 3分钟前
        sender: 'SARAH',
        messageType: 'SMS',
        direction: 'received',
        content: 'I\'ve analyzed the old drive. The data is partially corrupted but I found something interesting. We need to meet.',
        unlockConditions: [],
        unlockTopics: ['sarah_missed_call'], // 需要先接收 sarah_missed_call 消息
        displayOrder: 8,
        isActive: true,
        isRead: false,
        visibility: 'all'
      },
      {
        topic: 'sarah_meeting_confirmed',
        date: new Date(Date.now() - 1 * 60000), // 1分钟前
        sender: 'SARAH',
        messageType: 'PHONE',
        direction: 'received',
        content: 'Meeting confirmed. Location: Old warehouse. Time: Tonight 8 PM. Bring the decryption key.',
        unlockConditions: [],
        unlockTopics: ['sarah_followup_message'], // 需要先接收 sarah_followup_message 消息
        displayOrder: 9,
        isActive: true,
        isRead: false,
        visibility: 'all'
      },
      {
        topic: 'admin_critical_update',
        date: new Date(Date.now() - 20 * 60000), // 20分钟前
        sender: 'ADMIN',
        messageType: 'SYSTEM',
        direction: 'received',
        content: 'Critical system update required. The visual cortex corruption is spreading. Immediate action needed.',
        unlockConditions: [],
        unlockTopics: ['system_erratic_behavior', 'admin_logs_discussion'], // 需要先操作这两个消息
        displayOrder: 10,
        isActive: true,
        isRead: false,
        visibility: 'all'
      },
      // 需要同时满足章节完成和消息操作的示例
      {
        topic: 'sarah_final_revelation',
        date: new Date(Date.now() - 5 * 60000), // 5分钟前
        sender: 'SARAH',
        messageType: 'PHONE',
        direction: 'received',
        content: 'I\'ve found the truth. The old drive contains evidence that changes everything. Meet me at the warehouse. We need to discuss this face to face.',
        unlockConditions: ['chapter_01'], // 需要完成 chapter_01
        unlockTopics: ['sarah_meeting_confirmed'], // 需要先操作 sarah_meeting_confirmed 消息
        displayOrder: 11,
        isActive: true,
        isRead: false,
        visibility: 'all'
      },
      {
        topic: 'system_final_warning',
        date: new Date(Date.now() - 1 * 60000), // 1分钟前
        sender: 'SYSTEM',
        messageType: 'SYSTEM',
        direction: 'received',
        content: 'WARNING: System integrity compromised. All data will be purged in 24 hours. Backup critical information immediately.',
        unlockConditions: ['chapter_01'], // 需要完成 chapter_01
        unlockTopics: ['admin_critical_update', 'sarah_final_revelation'], // 需要先操作这两个消息
        displayOrder: 12,
        isActive: true,
        isRead: false,
        visibility: 'all'
      }
    ];
    
    // 插入消息
    let insertedCount = 0;
    let skippedCount = 0;
    
    for (const messageData of sampleMessages) {
      // 检查是否已存在（根据 topic 判断，topic 是唯一的）
      const existing = await MiscMessage.findOne({
        topic: messageData.topic
      });
      
      if (existing) {
        console.log(`⏭️  跳过已存在的消息 (topic: ${messageData.topic}): ${messageData.sender} - ${messageData.content.substring(0, 30)}...`);
        skippedCount++;
        continue;
      }
      
      try {
        const message = new MiscMessage(messageData);
        await message.save();
        console.log(`✅ 已创建消息 (topic: ${messageData.topic}): ${messageData.sender} - ${messageData.content.substring(0, 30)}...`);
        insertedCount++;
      } catch (error) {
        if (error.code === 11000) {
          // 重复键错误（topic 已存在）
          console.log(`⏭️  跳过已存在的消息 (topic 重复: ${messageData.topic}): ${messageData.sender} - ${messageData.content.substring(0, 30)}...`);
          skippedCount++;
        } else {
          console.error(`❌ 创建消息失败 (topic: ${messageData.topic}):`, error.message);
          throw error;
        }
      }
    }
    
    console.log(`\n📊 初始化完成:`);
    console.log(`   新增: ${insertedCount} 条消息`);
    console.log(`   跳过: ${skippedCount} 条消息`);
    console.log(`   总计: ${await MiscMessage.countDocuments()} 条消息\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initMiscMessages();
}

module.exports = { initMiscMessages };

