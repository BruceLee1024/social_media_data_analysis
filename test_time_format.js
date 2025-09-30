const XLSX = require('xlsx');

// 读取小红书Excel文件
const workbook = XLSX.readFile('小红书数据.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const rawData = XLSX.utils.sheet_to_json(worksheet);

console.log('原始数据条数：', rawData.length);

// 测试时间格式解析函数
function normalizeTimeFormat(timeStr) {
  if (!timeStr) return '';
  
  // 尝试解析各种时间格式
  const patterns = [
    // 中文格式：2024年01月15日14时30分25秒
    /^(\d{4})年(\d{1,2})月(\d{1,2})日(\d{1,2})时(\d{1,2})分(\d{1,2})秒$/,
    // 标准格式：2024-01-15 14:30:25
    /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/,
    // 日期格式：2024-01-15
    /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/,
    // 美式日期格式：01/15/2024
    /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/,
  ];

  for (const pattern of patterns) {
    const match = timeStr.match(pattern);
    if (match) {
      if (pattern.source.includes('年')) {
        // 中文格式
        const [, year, month, day, hour, minute, second] = match;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}`;
      } else if (pattern.source.includes('\\s+')) {
        // 包含时间的格式
        const [, year, month, day, hour, minute, second] = match;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}`;
      } else if (match[3] && match[3].length === 4) {
        // MM/DD/YYYY 格式
        const [, month, day, year] = match;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} 00:00:00`;
      } else {
        // YYYY-MM-DD 格式
        const [, year, month, day] = match;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} 00:00:00`;
      }
    }
  }

  return timeStr; // 无法解析时返回原字符串
}

// 测试时间格式
const timeSamples = rawData.slice(0, 3).map(row => row['首次发布时间']);
console.log('时间格式样本：', timeSamples);

timeSamples.forEach(timeStr => {
  console.log('\n处理时间字符串:', timeStr);
  const result = normalizeTimeFormat(String(timeStr));
  console.log('解析结果:', result);
  console.log('是否有效日期:', !isNaN(new Date(result).getTime()));
});

// 检查观看量数据
const viewSamples = rawData.slice(0, 3).map(row => row['观看量']);
console.log('\n观看量样本：', viewSamples);
console.log('数据类型：', viewSamples.map(v => typeof v));

console.log('\n数据验证完成！');