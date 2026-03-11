import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export class FileProcessor {
  // 已知的表格列名特征集合，用于检测「第一行是标题说明行，第二行才是真正列名」
  private static readonly KNOWN_COLUMN_NAMES = new Set([
    '笔记标题', '作品名称', '视频描述', '首次发布时间', '发布时间',
    '播放量', '曝光', '曝光量', '观看量', '推荐', '点赞', '评论',
    '收藏', '分享', '涨粉', '体裁', '粉丝增量', '完播率',
  ]);

  /**
   * 获取 Excel 文件中所有 sheet 名称
   */
  static async getSheetNames(file: File): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          resolve(workbook.SheetNames);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsArrayBuffer(file);
    });
  }

  static async readExcelFile(file: File, sheetName?: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          const targetSheetName = sheetName || workbook.SheetNames[0];
          const worksheet = workbook.Sheets[targetSheetName];

          if (!worksheet) {
            reject(new Error(`未找到工作表: ${targetSheetName}`));
            return;
          }

          const sheetRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
          let needSkip = false;

          if (sheetRange.e.r > 0 && sheetRange.e.c >= 4) {
            // 方法1：worksheet 层面——第一行非空单元格数 ≤ 2（合并单元格标题行）
            let nonEmpty = 0;
            for (let c = 0; c <= sheetRange.e.c; c++) {
              const addr = XLSX.utils.encode_cell({ r: 0, c });
              if (worksheet[addr]?.v !== undefined && worksheet[addr].v !== '') nonEmpty++;
            }
            if (nonEmpty <= 2) needSkip = true;

            // 方法2：解析数据层面——第一行数据的「值」包含已知列名
            // （说明真正的列名在第二行，第一行是说明文字）
            if (!needSkip) {
              const firstParse = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];
              if (firstParse.length > 0) {
                const firstRowVals = Object.values(firstParse[0]).map(v => String(v));
                if (firstRowVals.some(v => FileProcessor.KNOWN_COLUMN_NAMES.has(v))) {
                  needSkip = true;
                }
              }
            }
          }

          const jsonData = XLSX.utils.sheet_to_json(worksheet, needSkip ? { range: 1 } : {});
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsArrayBuffer(file);
    });
  }

  static async readCSVFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`CSV解析错误: ${results.errors[0].message}`));
          } else {
            resolve(results.data);
          }
        },
        error: (error) => reject(error),
      });
    });
  }

  static async processFile(file: File, sheetName?: string): Promise<any[]> {
    const extension = file.name.toLowerCase().split('.').pop();
    
    switch (extension) {
      case 'xlsx':
      case 'xls':
        return await this.readExcelFile(file, sheetName);
      case 'csv':
        return await this.readCSVFile(file);
      default:
        throw new Error(`不支持的文件格式: ${extension}`);
    }
  }
}