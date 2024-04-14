import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import { GenerateIndexesOptions } from './types';

/**
 * exportするファイルの情報
 */
type ExportFiles = {
  // デフォルトエクスポートするソースファイル
  defaultExport: string | null;
  // ソースファイル
  sources: string[];
  // リソースファイル
  resources: string[];
  // ディレクトリ
  dirs: string[];
  // typesファイルの有無
  hasTypes: boolean;
  // constantsファイルの有無
  hasConstants: boolean;
  // デフォルトエクスポートの有無
  hasDefaultExport: any;
};

/**
 * 内部処理用のオプション
 */
type GenerateIndexesOpts = GenerateIndexesOptions & {
  /**
   * 処理対象とする拡張子
   */
  targetExtsMap: { [ext: string]: true };

  /**
   * 処理対象から除外するディレクトリの名称
   */
  excludeDirNameMap: { [dir: string]: true };
};

/**
 * 処理対象のディレクトリ配下の全ディレクトリにindexファイルを作成する
 * @param targetDirPath  処理対象のディレクトリパス
 * @param options オプション
 */
export default function generateIndex(targetDirPath: string, options: GenerateIndexesOptions = {}): void {
  // 内部用オプションの作成
  const { targetExts = ['.ts', '.tsx', '.js', '.jsx'], excludeDirNames = [], ...rest } = options,
    opts: GenerateIndexesOpts = {
      ...rest,
      targetExtsMap: targetExts.reduce((result, ext) => {
        result[ext] = true;
        return result;
      }, {}),
      excludeDirNameMap: excludeDirNames.reduce((result, dir) => {
        result[dir] = true;
        return result;
      }, {}),
    };

  // indexファイルの出力
  _generateIndex(targetDirPath, opts);
}

/**
 * @param targetDirPath 処理対象のディレクトリパス
 * @param options オプション
 * @return デフォルトエクスポートがあるか
 */
function _generateIndex(targetDirPath: string, options: GenerateIndexesOpts) {
  // indexに出力する情報の取得
  const exportFiles = createExportFiles(targetDirPath, options);

  // indexファイルの出力
  exportIndex(targetDirPath, exportFiles, options);

  // デフォルトエクスポートがある場合はtrueを返す
  return !!exportFiles.defaultExport;
}

/**
 * エクスポートするファイルの情報を作成する
 * @param targetDirPath 処理対象のディレクトリパス
 * @param options オプション
 * @returns エクスポートするファイルの情報
 */
function createExportFiles(targetDirPath: string, options: GenerateIndexesOpts) {
  const { indexFileName = 'index.ts', targetExtsMap = {}, excludeDirNameMap = {}, shallow } = options,
    // 拡張子を除いたindexファイル名
    indexName = path.parse(indexFileName).name,
    // 対象ディレクトリの親ディレクトリ名
    parentName = path.basename(targetDirPath),
    // 対象ディレクトリの子要素(ディレクトリ＆ファイル)名
    children = fs.readdirSync(targetDirPath),
    // エクスポートするファイルの情報
    exportFiles: ExportFiles = {
      defaultExport: null,
      sources: [],
      resources: [],
      dirs: [],
      hasTypes: false,
      hasConstants: false,
      hasDefaultExport: {},
    };

  for (const child of children) {
    // 子要素のパス
    const childPath = path.join(targetDirPath, child),
      stat = fs.statSync(childPath);
    if (stat.isFile()) {
      // ファイルの場合
      const { ext, name } = path.parse(child);
      if (ext !== '') {
        // 拡張子のみでない場合
        if (targetExtsMap[ext.toLowerCase()]) {
          // ソースコードの場合
          if (name !== indexName) {
            // indexファイルではない場合
            if (name === parentName) {
              // ディレクトリ名と同じファイル名のものがある場合は、処理中のディレクトリのdefault exportとする
              exportFiles.defaultExport = name;
            } else if (name === 'constants') {
              // constantsの場合
              exportFiles.hasConstants = true;
            } else if (name === 'types') {
              // typesの場合
              exportFiles.hasTypes = true;
            } else {
              // 上記以外の場合
              exportFiles.sources.push(name);
            }
          }
          // indexはindexに出力しない
        } else {
          // ソースコード以外の場合
          exportFiles.resources.push(child);
        }
      }
      // 拡張子のみのものはindexに出力しない
    } else if (stat.isDirectory()) {
      // ディレクトリの場合
      if (!excludeDirNameMap[child]) {
        // 対象外ではない場合
        exportFiles.dirs.push(child);
        if (!shallow) {
          exportFiles.hasDefaultExport[child] = _generateIndex(childPath, options);
        }
      }
    }
  }

  return exportFiles;
}

/**
 * indexファイルを出力する
 * @param targetDirPath 出力先のディレクトリのパス
 * @param exportFiles indexに出力するファイルの情報
 * @param options オプション
 */
function exportIndex(targetDirPath: string, exportFiles: ExportFiles, options: GenerateIndexesOpts) {
  const { defaultExport, sources, resources, dirs, hasTypes, hasConstants, hasDefaultExport } = exportFiles,
    { indexFileName = 'index.ts', trial } = options,
    index: string[] = [];

  // 出力先のディレクトリのデフォルトエクスポート
  if (defaultExport) {
    // デフォルトエクスポートがある場合
    index.push(exportDefault(defaultExport));
  }

  // ディレクトリのエクスポート
  dirs.sort();
  for (const dir of dirs) {
    // 配下ディレクトリにデフォルトエクスポートある／なしで出力内容が異なる
    if (hasDefaultExport[dir]) {
      // ある場合
      index.push(exportDefaultAs(dir));
    } else {
      // ない場合
      index.push(exportAllAs(dir));
    }
  }

  // デフォルトエクスポート以外のソースのエクスポート
  sources.sort();
  for (const source of sources) {
    index.push(exportDefaultAs(source));
  }

  if (hasConstants) {
    // constantsがある場合
    index.push(exportAll('constants'));
  }

  if (hasTypes) {
    // typesがある場合
    index.push(exportTypeAll('types'));
  }

  // リソースのエクスポート
  resources.sort();
  for (const resource of resources) {
    index.push(exportAllAs(resource));
  }

  // indexの出力
  const indexFilePath = path.join(targetDirPath, indexFileName),
    indexContents = index.join(os.EOL);
  if (!trial) {
    // ファイルに出力
    fs.writeFileSync(indexFilePath, indexContents);
    console.info(indexFilePath);
  } else {
    // ログに出力
    console.info(`${indexFilePath} -------------------------------`);
    console.info(indexContents);
  }
}

/**
 * 出力先ディレクトリのデフォルトエクスポート
 * @param module
 * @returns
 */
function exportDefault(module: string) {
  return `export { default } from './${module}';`;
}

/**
 * デフォルトエクスポートを持つソースコードのネームドエクスポート
 * @param module
 * @returns
 */
function exportDefaultAs(module: string) {
  return `export { default as ${module} } from './${module}';`;
}

/**
 * デフォルトエクスポートを持たないソースコード or リソースのネームドエクスポート
 * @param module
 * @returns
 */
function exportAllAs(module: string) {
  return `export * as ${module} from './${module}';`;
}

/**
 * デフォルトエクスポートを持たないソースコードのエクスポート
 * @param module
 * @returns
 */
function exportAll(module: string) {
  return `export * from './${module}';`;
}

/**
 * デフォルトエクスポートを持たないソースコードのエクスポート
 * @param module
 * @returns
 */
function exportTypeAll(module: string) {
  return `export type * from './${module}';`;
}
