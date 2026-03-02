import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export class FileProcessor {
  static async readExcelFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // 检测是否存在标题行（如小红书导出文件第一行为说明文字）
          // 判断条件：第一行实际有内容的单元格数 ≤ 2，且表格总列数 ≥ 5
          const sheetRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
          let startRow = 0;
          if (sheetRange.e.r > 0 && sheetRange.e.c >= 4) {
            let nonEmptyInFirstRow = 0;
            for (let c = 0; c <= sheetRange.e.c; c++) {
              const addr = XLSX.utils.encode_cell({ r: 0, c });
              if (worksheet[addr] && worksheet[addr].v !== undefined && worksheet[addr].v !== '') {
                nonEmptyInFirstRow++;
              }
            }
            if (nonEmptyInFirstRow <= 2) {
              startRow = 1; // 跳过标题行，以第二行为列名
            }
          }

          const jsonData = XLSX.utils.sheet_to_json(worksheet, startRow > 0 ? { range: startRow } : {});
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

  static async processFile(file: File): Promise<any[]> {
    const extension = file.name.toLowerCase().split('.').pop();
    
    switch (extension) {
      case 'xlsx':
      case 'xls':
        return await this.readExcelFile(file);
      case 'csv':
        return await this.readCSVFile(file);
      default:
        throw new Error(`不支持的文件格式: ${extension}`);
    }
  }
}