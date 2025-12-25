<template>
  <div class="terminal-chapter-select">
    <div class="crt-overlay"></div>

    <div class="layout-grid">
      <!-- 左侧：主终端区域 -->
      <main class="main-terminal">
        <div class="ascii-logo">
            __    __   __  ____  __  __  __  __   __
            /  \  |  | /  /|    ||  |/  ||  |/  | /  \
            /    \ |  |/  /  |  |  \    / |     / /    \
            \__\/__/\____/    |__|   |__|  |___/  \__\/__/
            A K I Y A M A _ O S   //  KERNEL_V.5.14
        </div>

        <div class="welcome-msg">
            [SYS_BOOT]: Integrity Verification Complete.
            [SYS_BOOT]: Mounting memory partitions /dev/sda1 ... OK
            -----------------------------------------------------------------------
        </div>

        <!-- 系统诊断命令（示例） -->
        <div class="history-block">
            <div class="cmd-line">
                <span class="prompt"><span class="user">root</span><span class="path">~</span>></span>
                <span class="command-text">system_diagnostic --verbose --deep-scan --target=/core/memory_banks</span>
            </div>

            <div class="std-out">
                <div class="data-table">
                    <div class="row" style="border-bottom: 1px solid #333; color: #fff;">
                        <span class="cell" style="width: 15%">PID</span>
                        <span class="cell" style="width: 25%">MODULE</span>
                        <span class="cell" style="width: 20%">ADDRESS</span>
                        <span class="cell" style="width: 20%">STATUS</span>
                        <span class="cell">LATENCY</span>
                    </div>
                    <div class="row"><span class="cell">0x01A</span><span class="cell">Logic_Gate</span><span class="cell">0x0000FFFF</span><span class="cell hl">ACTIVE</span><span class="cell">0.02ms</span></div>
                    <div class="row"><span class="cell">0x02B</span><span class="cell">Emotion_Eng</span><span class="cell">0x00010000</span><span class="cell hl">STANDBY</span><span class="cell">1.40ms</span></div>
                    <div class="row"><span class="cell">0x04F</span><span class="cell">Visual_Cortex</span><span class="cell">0x00045A2C</span><span class="cell err">CORRUPT</span><span class="cell">999ms</span></div>
                    <div class="row"><span class="cell">0x09C</span><span class="cell">Audio_Synth</span><span class="cell">0x00088B11</span><span class="cell hl">ACTIVE</span><span class="cell">0.05ms</span></div>
                </div>
            </div>
        </div>

        <!-- 动态生成的章节节点 -->
        <div 
          v-for="(node, index) in chapterNodes" 
          :key="node.id"
          class="history-block"
        >
            <!-- 命令行动态生成（支持多行） -->
            <div class="cmd-line" :class="{ 'multi-line': node.commandInfo?.isMultiLine }">
                <template v-if="node.commandInfo?.isMultiLine">
                    <!-- 多行命令显示：每行都是独立的命令行 -->
                    <div v-for="(line, lineIndex) in node.commandInfo.commandRaw" :key="lineIndex" class="cmd-line-item">
                        <span class="prompt">
                            <span class="user">root</span>
                            <span class="path">{{ getPathForNode(node) }}</span>>
                        </span>
                        <span class="command-text">{{ line }}</span>
                    </div>
                </template>
                <template v-else>
                    <!-- 单行命令显示 -->
                    <span class="prompt">
                        <span class="user">root</span>
                        <span class="path">{{ getPathForNode(node) }}</span>>
                    </span>
                    <span class="command-text">{{ getCommandForNode(node, index) }}</span>
                </template>
            </div>

            <!-- 命令输出（根据节点状态和命令类型显示） -->
            <div 
              v-if="getOutputType(node) === 'error'"
              class="std-out"
              style="color: var(--text-dim); font-size: 0.8rem; white-space: pre-wrap;"
            >
                {{ getCommandOutput(node) }}
            </div>

            <!-- Hex Dump 输出 -->
            <div 
              v-else-if="getOutputType(node) === 'hexdump'"
              class="std-out hex-dump"
              style="white-space: pre;"
            >
                {{ getCommandOutput(node) }}
            </div>

            <!-- 成功输出（未锁定的节点） -->
            <div 
              v-else-if="getOutputType(node) === 'success'"
              class="std-out"
              style="color: var(--text-main); font-size: 0.85rem; white-space: pre-wrap;"
            >
                {{ getCommandOutput(node) }}
            </div>

            <!-- 章节结果卡片 -->
            <div 
              class="cmd-result"
              :class="{ 
                'error': node.locked && !node.unlockConditions,
                'locked': node.locked && node.unlockConditions && node.unlockConditions.length > 0
              }"
              @click="handleNodeClick(node)"
            >
                <div class="result-content">
                    <div class="res-meta">
                        <span v-if="!node.locked">EXEC_TIME: 0.04s | THREADS: 4 | OVERRIDE: TRUE</span>
                        <span v-else-if="node.unlockConditions && node.unlockConditions.length > 0">
                            PERMISSION DENIED | SECURITY LEVEL: MAX
                        </span>
                        <span v-else>
                            ERR_CODE: 0xBAD_SECTOR_77A | OFFSET: 0x004F
                        </span>
                    </div>
                    <div class="res-title">{{ formatChapterTitle(node) }}</div>
                    <div class="res-meta">
                        <span v-if="!node.locked">>> "{{ node.summary || 'System clock synchronized.' }}"</span>
                        <span v-else-if="node.unlockConditions && node.unlockConditions.length > 0">
                            Decryption key missing. Contact System Admin (Sarah).
                        </span>
                        <span v-else>
                            CRITICAL FAILURE: Cannot reconstruct memory fragment.
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 活动输入行 -->
        <div class="active-input-line">
            <span class="prompt"><span class="user">root</span><span class="path">~/memories</span>></span>
            <span ref="typingText" class="command-text"></span><span class="typing-cursor"></span>
        </div>
      </main>

      <!-- 右侧：消息侧边栏 -->
      <aside class="sidebar-area">
        <div class="msg-header">BUFFER_STREAM ({{ messageType || 'SMS' }})</div>

        <div class="msg-container">
            <!-- 根据消息类型动态渲染不同的组件 -->
            <div
              v-for="message in messages"
              :key="message.id"
              class="msg-item-wrapper"
            >
              <component
                :is="getMessageComponent(message.messageType)"
                :sender="message.sender"
                :content="message.content"
                :date-display="message.dateDisplay"
                :direction="message.direction"
                :is-read="message.isRead"
              />
              
              <!-- 接收/不接收按钮 -->
              <div class="msg-receive-control">
                <button
                  @click="toggleMessageReceive(message.topic, true)"
                  :class="['receive-btn', 'receive-btn-enable', { 'active': message.receiveStatus !== false }]"
                  title="接收消息"
                >
                  <span class="btn-text">接收</span>
                </button>
                <button
                  @click="toggleMessageReceive(message.topic, false)"
                  :class="['receive-btn', 'receive-btn-disable', { 'active': message.receiveStatus === false }]"
                  title="不接收消息"
                >
                  <span class="btn-text">不接收</span>
                </button>
              </div>
            </div>
            
            <!-- 如果没有消息，显示空状态 -->
            <div v-if="messages.length === 0" class="msg-item" style="opacity: 0.4;">
                <div class="msg-meta">
                    <span class="msg-sender">FROM: SYSTEM</span>
                    <span>---</span>
                </div>
                <div class="msg-content">
                    > No messages available.
                    > Waiting for incoming data...
                </div>
            </div>
        </div>
      </aside>
    </div>

    <!-- 解锁提示框 -->
    <MysticAlert
      v-model="showUnlockAlert"
      notice-title="SYSTEM NOTICE"
      :message="unlockAlertMessage"
      :highlight-text="unlockAlertHighlight"
      confirm-text="确认"
      @confirm="handleUnlockConfirm"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import MysticAlert from '@/components/MysticAlert.vue'
import SMSMessage from '@/components/messages/SMSMessage.vue'
import PhoneMessage from '@/components/messages/PhoneMessage.vue'
import QQMessage from '@/components/messages/QQMessage.vue'
import { novelScriptApi } from '@/api/novelScriptApi'
import { miscMessageApi, gameSaveApiForMessages } from '@/api/miscMessageApi'
import { useUserSession } from '@/composables/useUserSession'

const router = useRouter()
const userSession = useUserSession()

// 章节节点数据
const chapterNodes = ref([])

// 消息数据
const messages = ref([])
const messageType = computed(() => {
  if (messages.value.length === 0) return 'SMS'
  // 获取最常见的消息类型，映射到显示类型
  const types = messages.value.map(m => {
    // 将数据库中的消息类型映射到显示类型
    if (m.messageType === 'PHONE' || m.messageType === 'SYSTEM') return 'PHONE'
    if (m.messageType === 'QQ' || m.messageType === 'EMAIL' || m.messageType === 'USER') return 'QQ'
    return 'SMS' // SMS, NETWORK, ADMIN, OTHER 等都显示为 SMS
  })
  const typeCounts = types.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {})
  return Object.keys(typeCounts).reduce((a, b) => typeCounts[a] > typeCounts[b] ? a : b, 'SMS')
})

// 消息类型到组件的映射
const messageComponentMap = {
  'PHONE': PhoneMessage,
  'SYSTEM': PhoneMessage,
  'QQ': QQMessage,
  'EMAIL': QQMessage,
  'USER': QQMessage,
  'SMS': SMSMessage,
  'NETWORK': SMSMessage,
  'ADMIN': SMSMessage,
  'OTHER': SMSMessage
}

// 根据消息类型返回对应的组件
const getMessageComponent = (messageType) => {
  return messageComponentMap[messageType] || SMSMessage
}

// 解锁提示框状态
const showUnlockAlert = ref(false)
const unlockAlertMessage = ref('需要完成以下剧本')
const unlockAlertHighlight = ref('')

// 打字效果
const typingText = ref(null)
let typingInterval = null

// 命令模板库
const commandTemplates = {
  // 未锁定节点的命令
  unlocked: [
    {
      command: (id) => `./init_${id}.sh --override-safety-checks`,
      output: (id) => `[INFO] Initializing chapter ${id}...
[OK] Safety checks bypassed
[OK] Memory allocation: 256MB
[OK] Thread pool created: 4 threads
[OK] Chapter ${id} ready for execution`
    },
    {
      command: (id) => [
        `cd /var/chapters/${id}`,
        `./configure --prefix=/opt/chapters/${id}`,
        `make && make install`
      ],
      output: (id) => `Configuring chapter ${id}...
checking for gcc... yes
checking for C++ compiler... yes
[OK] Configuration complete
Compiling chapter ${id}...
[OK] Build successful
Installing to /opt/chapters/${id}...
[OK] Installation complete`
    },
    {
      command: (id) => `systemctl start chapter-${id}.service --force`,
      output: (id) => `Starting chapter-${id}.service...
[OK] Service started successfully
[INFO] PID: ${Math.floor(Math.random() * 9000 + 1000)}
[INFO] Memory: ${Math.floor(Math.random() * 200 + 100)}MB
[OK] Status: ACTIVE`
    },
    {
      command: (id) => [
        `export CHAPTER_ID=${id}`,
        `export MODE=production`,
        `python3 /usr/local/bin/load_chapter.py --id=${id} --mode=interactive`
      ],
      output: (id) => `Setting environment variables...
Loading chapter ${id}...
[INFO] Reading script file: /var/chapters/${id}/script.json
[OK] Script loaded: ${id} lines
[OK] Assets preloaded: ${Math.floor(Math.random() * 50 + 20)} files
[OK] Chapter ${id} initialized successfully`
    },
    {
      command: (id) => [
        `docker pull chapter:${id}`,
        `docker run -d --name chapter-${id} \\`,
        `  -p ${Math.floor(Math.random() * 9000 + 3000)}:8080 \\`,
        `  chapter:${id} --privileged`
      ],
      output: (id) => `Pulling image chapter:${id}...
[OK] Image pulled: chapter:${id}
Creating container chapter-${id}...
[OK] Container created: ${Math.random().toString(36).substring(7)}
[OK] Network configured
[OK] Chapter ${id} container running`
    },
    {
      command: (id) => [
        `git clone https://repo/chapters/${id}.git /tmp/${id}`,
        `cd /tmp/${id}`,
        `npm install && npm run build`,
        `cp -r dist/* /var/www/chapters/${id}/`
      ],
      output: (id) => `Cloning repository...
[OK] Repository cloned
Installing dependencies...
[OK] ${Math.floor(Math.random() * 50 + 20)} packages installed
Building chapter ${id}...
[OK] Build complete
Deploying to /var/www/chapters/${id}/...
[OK] Deployment successful`
    }
  ],
  // 锁定且有解锁条件的命令
  lockedWithConditions: [
    {
      command: (id) => [
        `sudo python3 decrypt_tool.py --target=${id} \\`,
        `  --key-file=/etc/shadow_keys \\`,
        `  --algorithm=quantum`
      ],
      output: (id) => `Traceback (most recent call last):
  File "/usr/local/bin/decrypt_tool.py", line 402, in <module>
    main(sys.argv[1:])
  File "/usr/local/bin/decrypt_tool.py", line 88, in unlock_sector
    key = load_quantum_key(opts.key_file)
  File "/lib/security/quantum_crypto.py", line 22, in load_quantum_key
    raise PermissionError("User 'root' is not in the phantom_users group.")
PermissionError: Access denied for file: /etc/shadow_keys/${id}.enc`
    },
    {
      command: (id) => [
        `openssl genrsa -out /tmp/${id}_key.pem 2048`,
        `openssl aes-256-cbc -d -in /var/encrypted/${id}.enc \\`,
        `  -out /tmp/${id}.dec -pass file:/tmp/${id}_key.pem`
      ],
      output: (id) => `Generating RSA key...
[ERROR] Permission denied: cannot write to /tmp/${id}_key.pem
Enter passphrase for /var/encrypted/${id}.enc:
*** Permission denied ***
[ERROR] Decryption failed: Missing decryption key
[ERROR] Required keys: ${id}_master.key
[ERROR] Contact system administrator for access`
    },
    {
      command: (id) => [
        `gpg --import /var/keys/${id}_public.key`,
        `gpg --decrypt /var/secure/${id}.gpg \\`,
        `  --output /tmp/${id}.txt`
      ],
      output: (id) => `Importing public key...
[ERROR] Key file not found: /var/keys/${id}_public.key
gpg: encrypted with RSA key, ID ${Math.random().toString(16).substring(2, 10).toUpperCase()}
gpg: decryption failed: No secret key
[ERROR] Secret key not found in keyring
[ERROR] Import required key: ${id}_private.key
[ERROR] Access level insufficient for this operation`
    },
    {
      command: (id) => [
        `ssh-keygen -t rsa -f ~/.ssh/${id}_key -N ""`,
        `ssh-copy-id -i ~/.ssh/${id}_key.pub admin@chapter-server`,
        `ssh -i ~/.ssh/${id}_key admin@chapter-server "unlock ${id}"`
      ],
      output: (id) => `Generating SSH key...
[ERROR] Permission denied: cannot create key file
Copying public key...
[ERROR] Authentication failed
Permission denied (publickey).
[ERROR] Authentication failed
[ERROR] Key file not found: ~/.ssh/${id}_key
[ERROR] Required access level: ADMIN
[ERROR] Current level: USER
[INFO] Contact system administrator`
    },
    {
      command: (id) => [
        `kubectl auth can-i exec pods/chapter-pod-${id} -n chapters`,
        `kubectl exec -it chapter-pod-${id} -n chapters -- /bin/bash`
      ],
      output: (id) => `Checking permissions...
no
Error from server (Forbidden): pods "chapter-pod-${id}" is forbidden: 
User "root" cannot exec resource "pods" in API group "" in the namespace "chapters"
[ERROR] Insufficient permissions
[ERROR] Required role: chapter-admin
[ERROR] Current role: chapter-viewer`
    },
    {
      command: (id) => [
        `curl -X POST https://api.chapters.local/unlock \\`,
        `  -H "Authorization: Bearer $(cat /etc/tokens/${id}.token)" \\`,
        `  -d '{"chapter_id": "${id}"}'`
      ],
      output: (id) => `[ERROR] Token file not found: /etc/tokens/${id}.token
[ERROR] HTTP 401 Unauthorized
[ERROR] Missing authentication token
[ERROR] Required access level: ADMIN
[ERROR] Current level: USER`
    }
  ],
  // 锁定且无解锁条件的命令
  lockedWithoutConditions: [
    {
      command: (id) => [
        `cd ./old_sector`,
        `cat ${id}_rust.log | hexdump -C -n 256`
      ],
      output: (id) => `00000000  53 59 53 5f 45 52 52 3a  44 41 54 41 5f 4c 4f 53  |SYS_ERR:DATA_LOS|
00000010  53 20 44 45 54 45 43 54  45 44 2e 20 52 55 53 54  |S DETECTED. RUST|
00000020  49 4e 47 20 4f 56 45 52  20 54 48 45 20 44 52 49  |ING OVER THE DRI|
00000030  56 45 2e 20 00 00 00 00  ff ff ff ff 42 41 44 21  |VE. ....ÿÿÿÿBAD!|
00000040  0a 23 21 2f 62 69 6e 2f  6e 75 6c 6c 00 00 00 00  |.#!/bin/null....|`
    },
    {
      command: (id) => [
        `ls -la /var/corrupted/${id}*`,
        `file /var/corrupted/${id}.dat`,
        `hexdump -C /var/corrupted/${id}.dat | head -5`
      ],
      output: (id) => `/var/corrupted/${id}.dat
/var/corrupted/${id}.dat: data
[WARNING] File type cannot be determined
[ERROR] File header corrupted
00000000  ff ff ff ff ff ff ff ff  ff ff ff ff ff ff ff ff  |................|
[ERROR] Magic number mismatch: 0x${Math.random().toString(16).substring(2, 10)}
[ERROR] Cannot read file structure`
    },
    {
      command: (id) => [
        `fdisk -l /dev/sector/${id}`,
        `strings /dev/sector/${id} | head -20`
      ],
      output: (id) => `[ERROR] Cannot open /dev/sector/${id}
[ERROR] I/O error reading /dev/sector/${id}
[ERROR] Device not responding
[ERROR] Sector ${Math.floor(Math.random() * 1000 + 100)}: Bad block detected
[ERROR] Data integrity check failed
[ERROR] Cannot recover data from corrupted sector`
    },
    {
      command: (id) => [
        `test -e /dev/zero || echo "Device not found"`,
        `dd if=/dev/zero of=/tmp/${id}.test bs=1M count=1`,
        `md5sum /tmp/${id}.test`
      ],
      output: (id) => `Device not found
dd: failed to open '/dev/zero': No such device or address
[ERROR] Device /dev/zero not found
[ERROR] System resources unavailable
[ERROR] Cannot perform I/O operations
[ERROR] Chapter ${id} data unrecoverable`
    },
    {
      command: (id) => [
        `find /var/chapters/${id} -type f -name "*.json"`,
        `test -r /var/chapters/${id}/script.json && echo "OK" || echo "FAIL"`,
        `cat /var/chapters/${id}/script.json 2>&1`
      ],
      output: (id) => `find: '/var/chapters/${id}': No such file or directory
FAIL
[ERROR] File /var/chapters/${id}/script.json does not exist
[ERROR] Path not found: /var/chapters/${id}/
[ERROR] Directory structure corrupted
[ERROR] Chapter ${id} data lost`
    },
    {
      command: (id) => [
        `tar -tf /var/backups/${id}.tar.gz 2>&1 | head -10`,
        `tar -xzf /var/backups/${id}.tar.gz -C /tmp/${id}/ 2>&1`
      ],
      output: (id) => `tar: /var/backups/${id}.tar.gz: Cannot open: No such file or directory
tar: /var/backups/${id}.tar.gz: Cannot open: No such file or directory
[ERROR] Backup file not found
[ERROR] Archive corrupted or missing
[ERROR] Cannot restore chapter ${id} data`
    }
  ]
}

// 为节点生成并存储命令信息
const generateCommandForNode = (node) => {
  let commandSet
  let seed = node.id.charCodeAt(0) + (node.id.charCodeAt(node.id.length - 1) || 0)
  
  if (!node.locked) {
    commandSet = commandTemplates.unlocked
  } else if (node.unlockConditions && node.unlockConditions.length > 0) {
    commandSet = commandTemplates.lockedWithConditions
  } else {
    commandSet = commandTemplates.lockedWithoutConditions
  }
  
  // 使用节点ID作为种子，确保同一节点总是选择相同的命令
  const index = seed % commandSet.length
  const selected = commandSet[index]
  
  // 获取命令（可能是字符串或数组）
  const rawCommand = selected.command(node.id)
  
  // 将命令转换为显示格式
  // 如果是数组，每行单独显示；如果是字符串，直接使用
  const commandDisplay = Array.isArray(rawCommand) 
    ? rawCommand.join('\n') 
    : rawCommand
  
  return {
    command: commandDisplay,  // 用于显示的格式（多行字符串）
    commandRaw: rawCommand,     // 原始格式（数组或字符串）
    output: selected.output(node.id),
    outputType: node.locked 
      ? (node.unlockConditions && node.unlockConditions.length > 0 ? 'error' : 'hexdump')
      : 'success',
    isMultiLine: Array.isArray(rawCommand)  // 标记是否为多行命令
  }
}

// 生成命令文本（保持向后兼容）
const getCommandForNode = (node, index) => {
  if (!node.commandInfo) {
    node.commandInfo = generateCommandForNode(node)
  }
  return node.commandInfo.command
}

// 获取命令输出
const getCommandOutput = (node) => {
  if (!node.commandInfo) {
    node.commandInfo = generateCommandForNode(node)
  }
  return node.commandInfo.output
}

// 获取输出类型
const getOutputType = (node) => {
  if (!node.commandInfo) {
    node.commandInfo = generateCommandForNode(node)
  }
  return node.commandInfo.outputType
}

// 生成路径
const getPathForNode = (node) => {
  if (node.locked) {
    return '~/memories'
  } else {
    return '~'
  }
}

// 格式化章节标题
const formatChapterTitle = (node) => {
  const chapterNum = String(node.id).padStart(2, '0')
  return `CHAPTER ${chapterNum}: ${node.name || 'UNKNOWN'}`
}

// 节点点击处理
const handleNodeClick = (node) => {
  if (node.locked) {
    // 显示解锁条件提示
    if (node.unlockConditions && node.unlockConditions.length > 0) {
      unlockAlertMessage.value = '需要完成以下剧本'
      unlockAlertHighlight.value = `「 ${node.unlockConditions.join('、')} 」`
    } else {
      unlockAlertMessage.value = '该剧本已锁定'
      unlockAlertHighlight.value = ''
    }
    showUnlockAlert.value = true
  } else {
    // 跳转到剧本页面
    router.push({
      path: '/visual-novel',
      query: { scriptId: node.id }
    })
  }
}

// 解锁提示确认处理
const handleUnlockConfirm = () => {
  // 可以在这里添加额外的逻辑
}

// 打字机效果
const startTypingEffect = () => {
  const textToType = "run_analysis.sh --force --ignore-errors"
  let charIndex = 0

  const typeWriter = () => {
    if (typingText.value) {
      if (charIndex < textToType.length) {
        typingText.value.textContent += textToType.charAt(charIndex)
        charIndex++
        typingInterval = setTimeout(typeWriter, 120)
      } else {
        typingInterval = setTimeout(() => {
          typingText.value.textContent = ""
          charIndex = 0
          typeWriter()
        }, 5000)
      }
    }
  }

  setTimeout(typeWriter, 1000)
}

// 格式化消息内容（将换行符转换为多行显示）
// 注意：现在由各个组件自己处理内容格式，这个函数保留用于兼容
const formatMessageContent = (content) => {
  if (!content) return ''
  // 如果内容包含换行符，每行前面添加 >
  return content.split('\n').map(line => `> ${line}`).join('\n')
}

// 加载消息数据
const loadMessages = async () => {
  try {
    // 确保用户会话已初始化
    if (!userSession.userId.value) {
      await userSession.initSession('TerminalChapterSelect')
    }
    
    const playerId = userSession.userId.value
    const response = await miscMessageApi.getTerminalMessages(playerId)
    
    if (response.success && response.data) {
      // 后端已经根据以下条件过滤了消息：
      // 1. 已经点击接收或者未接受的消息不显示（已操作的消息不显示）
      // 2. 未解锁的消息不显示（unlockConditions 和 unlockTopics 未满足）
      // 3. 不在章节显示范围内的消息不显示（chapterRange 检查）
      messages.value = response.data
      
      console.log(`📨 加载了 ${messages.value.length} 条消息`)
      console.log('📋 消息列表:', messages.value.map(m => ({
        topic: m.topic,
        sender: m.sender,
        chapterRange: m.chapterRange,
        unlockConditions: m.unlockConditions,
        unlockTopics: m.unlockTopics
      })))
    } else {
      messages.value = []
    }
  } catch (error) {
    console.error('加载消息失败:', error)
    // 如果加载失败，使用空数组
    messages.value = []
  }
}

// 切换消息接收状态
const toggleMessageReceive = async (topic, receiveStatus) => {
  try {
    // 确保用户会话已初始化
    if (!userSession.userId.value) {
      await userSession.initSession('TerminalChapterSelect')
    }
    
    const playerId = userSession.userId.value
    
    // 调用 API 更新接收状态（使用 topic）
    const response = await gameSaveApiForMessages.updateMessageReceiveStatus(
      playerId,
      topic,
      receiveStatus
    )
    
    if (response.success) {
      // 无论接收还是不接收，都从列表中移除该消息（表示已处理）
      messages.value = messages.value.filter(m => m.topic !== topic)
      console.log(`✅ 消息 ${topic} 已${receiveStatus ? '接收' : '拒绝'}，已从列表中移除`)
      
      // 重新加载消息列表，以检查是否有新的消息因为此操作而解锁
      // 注意：这里不立即重新加载，因为用户可能还在查看其他消息
      // 如果需要，可以在页面可见性变化时或定时刷新
    }
  } catch (error) {
    console.error('切换消息接收状态失败:', error)
  }
}

// 加载章节节点数据
const loadChapterNodes = async () => {
  try {
    // 确保用户会话已初始化
    if (!userSession.userId.value) {
      await userSession.initSession('TerminalChapterSelect')
    }
    
    const playerId = userSession.userId.value
    const response = await novelScriptApi.getChapterNodes(playerId)
    
    if (response.success && response.data) {
      // 将后端返回的数据转换为节点格式
      chapterNodes.value = response.data.map((script, index) => {
        const node = {
          id: script.scriptId,
          name: script.scriptName,
          locked: script.locked,
          summary: script.summary || '',
          unlockConditions: script.unlockConditions || []
        }
        // 为每个节点生成命令信息
        node.commandInfo = generateCommandForNode(node)
        return node
      })
    }
  } catch (error) {
    console.error('加载章节节点失败:', error)
    // 如果加载失败，可以显示默认数据或错误提示
  }
}

// 页面可见性变化处理函数
const handleVisibilityChange = () => {
  if (!document.hidden) {
    console.log('📄 页面重新可见，刷新消息列表...')
    loadMessages()
  }
}

onMounted(() => {
  // 加载章节节点数据
  loadChapterNodes()
  
  // 加载消息数据
  loadMessages()
  
  // 启动打字效果
  startTypingEffect()
  
  // 监听页面可见性变化，当页面重新可见时刷新消息
  // 这样可以确保在用户完成章节后返回页面时，消息列表是最新的
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  // 清理定时器
  if (typingInterval) {
    clearTimeout(typingInterval)
  }
  
  // 移除事件监听器
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

.terminal-chapter-select {
    --bg-color: #050505;
    --text-main: #d0d0d0;
    --text-dim: #555555;
    --text-msg: #888888;
    --prompt-user: #40e0d0;
    --prompt-path: #5070ff;
    --cmd-input: #ffffff;
    --accent-err: #ff3333;
    --accent-warn: #ffcc00;
    --sender-color: #bd93f9;
    
    margin: 0;
    padding: 0;
    background-color: var(--bg-color);
    color: var(--text-main);
    font-family: 'Share Tech Mono', monospace;
    min-height: 100vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    position: relative;
    width: 100%;
}

.terminal-chapter-select .crt-overlay {
    position: fixed; 
    top: 0; 
    left: 0; 
    width: 100%; 
    height: 100vh;
    pointer-events: none;
    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%),
    linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
    background-size: 100% 3px, 3px 100%;
    z-index: 999;
    opacity: 0.4;
}

.terminal-chapter-select .layout-grid {
    display: grid;
    grid-template-columns: 1fr 380px; /* 右侧稍微加宽一点 */
    min-height: 100vh;
    width: 100%;
    box-sizing: border-box;
    padding: 20px 40px;
    gap: 40px;
}

@media (max-width: 900px) {
    .terminal-chapter-select .layout-grid { 
        grid-template-columns: 1fr; 
        padding: 20px; 
    }
    .terminal-chapter-select .sidebar-area { 
        display: none; 
    }
}

/* === 左侧：主终端区域 === */
.terminal-chapter-select .main-terminal {
    display: flex;
    flex-direction: column;
    overflow-y: visible;
    padding-right: 10px;
    min-height: 100%;
}
.terminal-chapter-select .main-terminal::-webkit-scrollbar, 
.terminal-chapter-select .sidebar-area::-webkit-scrollbar { 
    width: 8px;
}
.terminal-chapter-select .main-terminal::-webkit-scrollbar-track,
.terminal-chapter-select .sidebar-area::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
}
.terminal-chapter-select .main-terminal::-webkit-scrollbar-thumb,
.terminal-chapter-select .sidebar-area::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
}
.terminal-chapter-select .main-terminal::-webkit-scrollbar-thumb:hover,
.terminal-chapter-select .sidebar-area::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
}

/* ASCII ART LOGO */
.terminal-chapter-select .ascii-logo {
    color: var(--text-dim);
    font-size: 0.7rem;
    line-height: 1.1;
    white-space: pre;
    margin-bottom: 20px;
    opacity: 0.5;
}

.terminal-chapter-select .welcome-msg {
    color: var(--text-main);
    opacity: 0.85;
    white-space: pre-wrap;
    margin-bottom: 20px;
    font-size: 0.9rem;
    line-height: 1.5;
}

/* 历史记录块 */
.terminal-chapter-select .history-block {
    margin-bottom: 25px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
}

/* 命令行 */
.terminal-chapter-select .cmd-line { 
    display: flex; 
    align-items: flex-start; 
    flex-wrap: wrap; 
    width: 100%; 
    margin-bottom: 6px; 
    margin-top: 10px; 
    line-height: 1.5; 
}
.terminal-chapter-select .cmd-line.multi-line {
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
}
.terminal-chapter-select .cmd-line-item {
    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;
    width: 100%;
    margin-bottom: 6px;
    margin-top: 0;
}
.terminal-chapter-select .cmd-line-item:first-child {
    margin-top: 0;
}
.terminal-chapter-select .prompt { 
    margin-right: 10px; 
    white-space: nowrap; 
}
.terminal-chapter-select .prompt .user { 
    color: var(--prompt-user); 
}
.terminal-chapter-select .prompt .path { 
    color: var(--prompt-path); 
}
.terminal-chapter-select .command-text { 
    color: var(--cmd-input); 
    text-shadow: 0 0 2px rgba(255,255,255,0.4); 
    word-break: break-all; 
    white-space: pre-wrap;
}

/* 普通文本输出 (Syslog 风格) */
.terminal-chapter-select .std-out {
    color: var(--text-main);
    opacity: 0.85;
    white-space: pre-wrap;
    margin-bottom: 6px;
    font-size: 0.9rem;
    line-height: 1.5;
    width: 100%;
}

/* 表格样式的数据展示 */
.terminal-chapter-select .data-table {
    display: table;
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
    color: var(--text-dim);
    margin: 10px 0;
}
.terminal-chapter-select .data-table .row { 
    display: table-row; 
}
.terminal-chapter-select .data-table .cell { 
    display: table-cell; 
    padding: 2px 10px 2px 0; 
}
.terminal-chapter-select .data-table .hl { 
    color: var(--prompt-user); 
}
.terminal-chapter-select .data-table .err { 
    color: var(--accent-err); 
}

/* Hex Dump 样式 */
.terminal-chapter-select .hex-dump {
    font-family: 'Share Tech Mono', monospace;
    color: #444;
    font-size: 0.85rem;
    width: 100%;
    overflow-x: hidden;
    white-space: pre; /* 保持格式 */
}
.terminal-chapter-select .hex-addr { 
    color: var(--prompt-path); 
    margin-right: 10px; 
}
.terminal-chapter-select .hex-data { 
    color: var(--text-msg); 
    margin-right: 10px; 
}
.terminal-chapter-select .hex-ascii { 
    color: var(--text-main); 
    opacity: 0.6; 
}

/* 结果/章节入口 */
.terminal-chapter-select .cmd-result {
    margin-top: 10px;
    margin-bottom: 10px;
    padding-left: 15px;
    border-left: 1px solid var(--text-dim);
    transition: all 0.2s;
    cursor: pointer;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
}
.terminal-chapter-select .cmd-result:hover { 
    border-left-color: var(--prompt-user); 
    background: rgba(255, 255, 255, 0.02); 
}
.terminal-chapter-select .result-content { 
    padding: 8px 0; 
    display: flex; 
    flex-direction: column; 
    gap: 4px; 
}
.terminal-chapter-select .res-title { 
    font-size: 1.2rem; 
    color: #fff; 
    font-weight: bold; 
    letter-spacing: 1px; 
}
.terminal-chapter-select .res-meta { 
    color: var(--text-dim); 
    font-size: 0.85rem; 
}

.terminal-chapter-select .cmd-result.error { 
    border-left-color: var(--accent-err); 
}
.terminal-chapter-select .cmd-result.error .res-title { 
    color: var(--accent-err); 
    text-decoration: line-through; 
    opacity: 0.7; 
}
.terminal-chapter-select .cmd-result.locked { 
    border-left-color: var(--accent-warn); 
    opacity: 0.5; 
    cursor: not-allowed; 
}

/* 输入行 */
.terminal-chapter-select .active-input-line {
    margin-top: 10px;
    padding-top: 0;
    display: flex;
    align-items: flex-start;
    padding-bottom: 50px;
}
.terminal-chapter-select .typing-cursor { 
    width: 10px; 
    height: 1.2em; 
    background-color: #fff; 
    margin-left: 5px; 
    animation: blink 1s step-end infinite; 
}
@keyframes blink { 
    50% { 
        opacity: 0; 
    } 
}

/* === 右侧：消息侧边栏 === */
.terminal-chapter-select .sidebar-area {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    font-size: 0.85rem;
    padding-top: 80px;
    align-items: flex-start;
    border-left: 1px solid #111; /* 极淡的分割线 */
    padding-left: 30px;
    position: sticky;
    top: 0;
    max-height: 100vh;
}

.terminal-chapter-select .msg-header {
    color: var(--text-dim);
    border-bottom: 1px dashed #333;
    width: 100%;
    padding-bottom: 10px;
    margin-bottom: 20px;
    text-align: right;
}

.terminal-chapter-select .msg-container { 
    display: flex; 
    flex-direction: column; 
    gap: 20px; 
    width: 100%; 
}

/* 保留原有的 msg-item 样式用于空状态 */
.terminal-chapter-select .msg-item { 
    display: flex; 
    flex-direction: column; 
    opacity: 0.7; 
    transition: opacity 0.3s; 
}
.terminal-chapter-select .msg-item:hover { 
    opacity: 1; 
}
.terminal-chapter-select .msg-meta { 
    font-size: 0.75rem; 
    color: var(--text-dim); 
    margin-bottom: 4px; 
    display: flex; 
    justify-content: space-between; 
}
.terminal-chapter-select .msg-sender { 
    color: var(--sender-color); 
    font-weight: bold; 
}
.terminal-chapter-select .msg-content { 
    color: var(--text-msg); 
    line-height: 1.5; 
    border-left: 2px solid transparent; 
    padding-left: 10px; 
    white-space: pre-wrap;
    word-break: break-word;
}
.terminal-chapter-select .msg-item.unread .msg-content { 
    color: #fff; 
    border-left-color: var(--prompt-user); 
}
.terminal-chapter-select .msg-item.unread .msg-sender { 
    text-shadow: 0 0 5px var(--sender-color); 
}

/* 消息项包装器 */
.terminal-chapter-select .msg-item-wrapper {
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: relative;
}

/* 消息接收控制按钮 */
.terminal-chapter-select .msg-receive-control {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 4px;
    padding-right: 4px;
}

.terminal-chapter-select .receive-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px 12px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--text-main);
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'Share Tech Mono', monospace;
    opacity: 0.6;
}

.terminal-chapter-select .receive-btn:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.1);
}

.terminal-chapter-select .receive-btn.active {
    opacity: 1;
    background: rgba(255, 255, 255, 0.15);
    border-color: currentColor;
}

.terminal-chapter-select .receive-btn-enable {
    color: var(--prompt-user);
}

.terminal-chapter-select .receive-btn-enable:hover {
    border-color: var(--prompt-user);
    background: rgba(64, 224, 208, 0.15);
}

.terminal-chapter-select .receive-btn-enable.active {
    border-color: var(--prompt-user);
    background: rgba(64, 224, 208, 0.2);
    box-shadow: 0 0 4px rgba(64, 224, 208, 0.3);
}

.terminal-chapter-select .receive-btn-disable {
    color: var(--accent-err);
}

.terminal-chapter-select .receive-btn-disable:hover {
    border-color: var(--accent-err);
    background: rgba(255, 51, 51, 0.15);
}

.terminal-chapter-select .receive-btn-disable.active {
    border-color: var(--accent-err);
    background: rgba(255, 51, 51, 0.2);
    box-shadow: 0 0 4px rgba(255, 51, 51, 0.3);
}

.terminal-chapter-select .btn-text {
    font-size: 0.7rem;
}
</style>

