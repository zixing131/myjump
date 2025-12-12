/**
 * 调试日志系统 - 支持TAG过滤和日志导出
 * 
 * 使用方法：
 * 1. 在控制台设置过滤TAG: window.DEBUG_TAGS = ['BLACKSCREEN', 'SWAPBUFFERS', 'REFRESH0']
 * 2. 查看日志: window.getDebugLogs()
 * 3. 导出日志: window.exportDebugLogs()
 * 4. 清除日志: window.clearDebugLogs()
 */

(function() {
  'use strict';

  // 日志存储
  window._debugLogs = window._debugLogs || [];
  window._maxLogSize = 10000; // 最大日志条数
  window.DEBUG_TAGS = window.DEBUG_TAGS || []; // 空数组表示记录所有TAG
  window.DEBUG_ENABLED = window.DEBUG_ENABLED !== false; // 默认启用

  // 日志级别
  const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
  };

  /**
   * 添加日志
   * @param {string} tag - 日志TAG
   * @param {string} level - 日志级别 ('DEBUG', 'INFO', 'WARN', 'ERROR')
   * @param {...any} args - 日志参数
   */
  function addLog(tag, level, ...args) {
    if (!window.DEBUG_ENABLED) return;

    // 检查TAG过滤
    if (window.DEBUG_TAGS.length > 0 && !window.DEBUG_TAGS.includes(tag)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp: timestamp,
      tag: tag,
      level: level,
      message: args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' '),
      raw: args
    };

    window._debugLogs.push(logEntry);

    // 限制日志大小
    if (window._debugLogs.length > window._maxLogSize) {
      window._debugLogs.shift();
    }

    // 同时输出到控制台（带颜色）
    const levelNum = LogLevel[level] || 0;
    const consoleMethod = levelNum >= LogLevel.ERROR ? 'error' : 
                         levelNum >= LogLevel.WARN ? 'warn' : 
                         levelNum >= LogLevel.INFO ? 'info' : 'log';
    
    const tagStyle = 'color: #0066cc; font-weight: bold';
    const levelStyle = levelNum >= LogLevel.ERROR ? 'color: #ff0000' :
                       levelNum >= LogLevel.WARN ? 'color: #ff8800' :
                       levelNum >= LogLevel.INFO ? 'color: #008800' : 'color: #666666';
    
    console[consoleMethod](
      `%c[${tag}]%c[${level}]`,
      tagStyle,
      levelStyle,
      ...args
    );
  }

  // 导出日志函数
  window.debugLog = {
    /**
     * 记录DEBUG级别日志
     */
    debug: function(tag, ...args) {
      addLog(tag, 'DEBUG', ...args);
    },

    /**
     * 记录INFO级别日志
     */
    info: function(tag, ...args) {
      addLog(tag, 'INFO', ...args);
    },

    /**
     * 记录WARN级别日志
     */
    warn: function(tag, ...args) {
      addLog(tag, 'WARN', ...args);
    },

    /**
     * 记录ERROR级别日志
     */
    error: function(tag, ...args) {
      addLog(tag, 'ERROR', ...args);
    }
  };

  /**
   * 获取所有日志
   * @param {string[]} tags - 可选的TAG过滤
   * @returns {Array} 日志数组
   */
  window.getDebugLogs = function(tags) {
    if (!tags || tags.length === 0) {
      return window._debugLogs.slice();
    }
    return window._debugLogs.filter(log => tags.includes(log.tag));
  };

  /**
   * 获取日志的文本格式
   * @param {string[]} tags - 可选的TAG过滤
   * @returns {string} 日志文本
   */
  window.getDebugLogsText = function(tags) {
    const logs = window.getDebugLogs(tags);
    return logs.map(log => {
      return `[${log.timestamp}] [${log.tag}] [${log.level}] ${log.message}`;
    }).join('\n');
  };

  /**
   * 导出日志到文件
   * @param {string[]} tags - 可选的TAG过滤
   */
  window.exportDebugLogs = function(tags) {
    const logs = window.getDebugLogs(tags);
    const text = logs.map(log => {
      return `[${log.timestamp}] [${log.tag}] [${log.level}] ${log.message}`;
    }).join('\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`已导出 ${logs.length} 条日志`);
  };

  /**
   * 清除所有日志
   */
  window.clearDebugLogs = function() {
    window._debugLogs = [];
    console.log('日志已清除');
  };

  /**
   * 在控制台显示日志统计
   */
  window.showDebugLogStats = function() {
    const stats = {};
    window._debugLogs.forEach(log => {
      if (!stats[log.tag]) {
        stats[log.tag] = { total: 0, debug: 0, info: 0, warn: 0, error: 0 };
      }
      stats[log.tag].total++;
      stats[log.tag][log.level.toLowerCase()]++;
    });

    console.table(stats);
    console.log(`总日志数: ${window._debugLogs.length}`);
    console.log(`当前过滤TAG: ${window.DEBUG_TAGS.length === 0 ? '全部' : window.DEBUG_TAGS.join(', ')}`);
  };

  /**
   * 复制日志到剪贴板
   * @param {string[]} tags - 可选的TAG过滤
   */
  window.copyDebugLogs = function(tags) {
    const text = window.getDebugLogsText(tags);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        console.log(`已复制 ${window.getDebugLogs(tags).length} 条日志到剪贴板`);
      }).catch(err => {
        console.error('复制失败:', err);
        // 降级方案
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        console.log(`已复制 ${window.getDebugLogs(tags).length} 条日志到剪贴板（降级方案）`);
      });
    } else {
      // 降级方案
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      console.log(`已复制 ${window.getDebugLogs(tags).length} 条日志到剪贴板（降级方案）`);
    }
  };

  // 初始化提示
  console.log('%c调试日志系统已加载', 'color: #008800; font-weight: bold; font-size: 14px');
  console.log('可用命令:');
  console.log('  window.DEBUG_TAGS = ["BLACKSCREEN", "SWAPBUFFERS"] - 设置过滤TAG（空数组表示记录所有）');
  console.log('  window.getDebugLogs() - 获取所有日志');
  console.log('  window.getDebugLogsText() - 获取日志文本');
  console.log('  window.copyDebugLogs() - 复制日志到剪贴板');
  console.log('  window.exportDebugLogs() - 导出日志到文件');
  console.log('  window.showDebugLogStats() - 显示日志统计');
  console.log('  window.clearDebugLogs() - 清除所有日志');
  console.log('  window.DEBUG_ENABLED = false - 禁用日志记录');

  // 预设常用TAG组合
  window.DEBUG_PRESETS = {
    BLACKSCREEN: ['BLACKSCREEN', 'SWAPBUFFERS', 'REFRESH0', 'DRAWIMAGE2', 'WEBGL', 'SHADER'],
    RENDERING: ['SWAPBUFFERS', 'DRAWIMAGE2', 'REFRESH0', 'BINDTARGET', 'CLEAR'],
    WEBGL: ['WEBGL', 'SHADER', 'TEXTURE', 'UNIFORM'],
    ALL: [] // 空数组表示所有
  };

  console.log('预设TAG组合:');
  console.log('  window.DEBUG_TAGS = window.DEBUG_PRESETS.BLACKSCREEN - 黑屏相关');
  console.log('  window.DEBUG_TAGS = window.DEBUG_PRESETS.RENDERING - 渲染相关');
  console.log('  window.DEBUG_TAGS = window.DEBUG_PRESETS.WEBGL - WebGL相关');
  console.log('  window.DEBUG_TAGS = window.DEBUG_PRESETS.ALL - 所有日志');

})();



