export type GenerateIndexesOptions = {
  /**
   * indexのファイル名
   * デフォルトは`index.ts`
   */
  indexFileName?: string;

  /**
   * 処理対象とする拡張子
   * 未指定の場合は`.ts`,`.tsx`,`.js`,`.jsx`
   */
  targetExts?: string[];

  /**
   * 処理対象から除外するディレクトリの名称
   */
  excludeDirNames?: string[];

  /**
   * 指定されたディレクトリ直下のみを処理
   */
  shallow?: boolean;

  /**
   * お試し
   * ファイルの操作は行わない
   */
  trial?: boolean;
};
